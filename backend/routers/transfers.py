"""Transfers router — /api/transfers — with integrated fraud detection pipeline."""
import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_customer
from services.banking_service import BankingService, BankingError
from services.fraud_service import FraudService
from models.account import Account
from models.transaction import Transaction
from models.notification import Notification
from models.audit_log import AuditLog
from models.user import User
from schemas.banking import TransferRequest, SimulateSuspiciousRequest

router = APIRouter(prefix="/api/transfers", tags=["transfers"])


@router.post("")
def initiate_transfer(
    req: TransferRequest,
    request: Request,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """
    Complete transfer pipeline:
    1. Get sender account
    2. Assess fraud risk
    3. Based on risk level:
       LOW  → process immediately
       MEDIUM → process + flag for monitoring
       HIGH → require step-up verification (return step_up token)
       CRITICAL → block + create fraud alert
    """
    svc = BankingService(db)
    fraud_svc = FraudService(db)

    # Get sender's first active account (or specific one)
    accounts = svc.get_user_accounts(current_user.id)
    if not accounts:
        raise HTTPException(status_code=400, detail="No account found.")
    from_account = accounts[0]

    # Verify PIN before running fraud check (fail fast)
    from passlib.context import CryptContext
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    if not ctx.verify(req.pin, from_account.pin_hash):
        raise HTTPException(status_code=400, detail="Incorrect transaction PIN.")

    # Detect device fingerprint
    ip = request.client.host if request.client else ""
    device_fp = req.device_fingerprint or request.headers.get("X-Device-Fingerprint", ip)
    from models.device import Device
    known_device = db.query(Device).filter(
        Device.user_id == current_user.id,
        Device.device_fingerprint == device_fp,
    ).first()
    is_new_device = known_device is None

    # Register device
    if is_new_device:
        new_dev = Device(
            user_id=current_user.id,
            device_fingerprint=device_fp,
            user_agent=request.headers.get("User-Agent", ""),
            ip_address=ip,
        )
        db.add(new_dev)
    else:
        known_device.last_seen_at = datetime.now(timezone.utc)

    # Fraud assessment
    assessment = fraud_svc.assess_transaction(
        account=from_account,
        amount=req.amount,
        beneficiary_id=req.beneficiary_id,
        is_new_device=is_new_device,
    )

    # Decision based on risk level
    if assessment.action == "block":
        # Execute transfer as blocked (debit sender, don't credit receiver)
        try:
            result = svc.transfer(
                from_account=from_account,
                to_account_number=req.to_account_number,
                amount=req.amount,
                pin=req.pin,
                description=req.description or f"Transfer to {req.to_account_number}",
                beneficiary_id=req.beneficiary_id,
                risk_score=assessment.score,
                risk_level=assessment.level,
                status="blocked",
            )
        except BankingError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Create fraud alert
        alert = fraud_svc.create_fraud_alert(
            transaction_id=result["transaction_id"],
            account_id=from_account.id,
            assessment=assessment,
        )
        db.commit()
        return {
            "status": "blocked",
            "message": "Transaction blocked due to high fraud risk.",
            "risk_score": assessment.score,
            "risk_level": assessment.level,
            "reasons": assessment.reasons,
            "recommended_action": assessment.recommended_action,
            "transaction": result["transaction"],
            "fraud_alert_id": alert.id,
        }

    elif assessment.action == "step_up":
        # Generate a short-lived step-up token (OTP simulation)
        otp = "".join(random.choices(string.digits, k=6))
        # Store in temp — use a simple cache via notification
        step_up_data = {
            "otp": otp,
            "transfer_req": req.model_dump(),
            "assessment": {
                "score": assessment.score,
                "level": assessment.level,
                "reasons": assessment.reasons,
            }
        }
        # Notify user with OTP (simulated — no real SMS)
        notif = Notification(
            user_id=current_user.id,
            title="Step-Up Verification Required",
            body=f"[DEMO OTP] Your transaction verification code is: {otp}. "
                 f"Risk Score: {assessment.score}/100. Valid for 5 minutes.",
            type="security",
        )
        db.add(notif)
        db.commit()
        return {
            "status": "step_up_required",
            "message": "Additional verification required for this transaction.",
            "risk_score": assessment.score,
            "risk_level": assessment.level,
            "reasons": assessment.reasons,
            "recommended_action": assessment.recommended_action,
            "otp_hint": otp,  # Demo only — in production, sent via SMS
            "demo_note": "In production, OTP would be sent via SMS/email. This is a demo display.",
        }

    else:
        # LOW or MEDIUM — process normally
        try:
            result = svc.transfer(
                from_account=from_account,
                to_account_number=req.to_account_number,
                amount=req.amount,
                pin=req.pin,
                description=req.description or f"Transfer to {req.to_account_number}",
                beneficiary_id=req.beneficiary_id,
                risk_score=assessment.score,
                risk_level=assessment.level,
                status="completed",
            )
        except BankingError as e:
            raise HTTPException(status_code=400, detail=str(e))

        notif = Notification(
            user_id=current_user.id,
            title="Transfer Successful",
            body=f"₹{req.amount:,.2f} transferred to ****{req.to_account_number[-4:]} successfully.",
            type="transaction",
        )
        db.add(notif)
        log = AuditLog(
            user_id=current_user.id,
            action="TRANSFER_CREATED",
            resource_type="transaction",
            resource_id=result["transaction_id"],
            details={"amount": req.amount, "risk_score": assessment.score},
            ip_address=ip,
        )
        db.add(log)
        db.commit()
        return {
            "status": "completed",
            "message": f"₹{req.amount:,.2f} transferred successfully.",
            "risk_score": assessment.score,
            "risk_level": assessment.level,
            "reasons": assessment.reasons,
            "recommended_action": assessment.recommended_action,
            "transaction": result["transaction"],
        }


@router.post("/simulate-suspicious")
def simulate_suspicious(
    req: SimulateSuspiciousRequest,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    """
    DEMO ONLY: Simulate a suspicious transaction to demonstrate the full fraud pipeline.
    Creates a realistic suspicious transaction and returns the complete pipeline trace.
    """
    svc = BankingService(db)
    fraud_svc = FraudService(db)

    accounts = svc.get_user_accounts(current_user.id)
    if not accounts:
        raise HTTPException(status_code=400, detail="No account found.")
    from_account = accounts[0]

    # Force suspicious features (new device, unusual time, new beneficiary)
    assessment = fraud_svc.assess_transaction(
        account=from_account,
        amount=req.amount,
        beneficiary_id=None,  # no saved beneficiary
        is_new_device=req.new_device,
        override_hour=3 if req.unusual_time else None,  # 3 AM
    )

    # Create a blocked transaction for demo
    target_number = req.target_account_number or "9999999999"
    to_account = svc.get_account_by_number(target_number)
    if not to_account:
        # Create a dummy transaction manually for demo
        txn = Transaction(
            account_id=from_account.id,
            type="transfer_out",
            amount=req.amount,
            balance_after=from_account.balance,
            description=f"[DEMO] Suspicious transfer to {target_number}",
            counterparty_account_number=target_number,
            counterparty_name="Unknown Recipient",
            risk_score=assessment.score,
            risk_level=assessment.level,
            status="blocked",
            metadata_={
                "demo": True,
                "new_device": req.new_device,
                "unusual_time": req.unusual_time,
                "new_beneficiary": req.new_beneficiary,
                "unusual_location": req.unusual_location,
            },
        )
        db.add(txn)
        db.flush()
    else:
        txn = Transaction(
            account_id=from_account.id,
            type="transfer_out",
            amount=req.amount,
            balance_after=from_account.balance,
            description=f"[DEMO] Suspicious transfer",
            counterparty_account_number=target_number,
            risk_score=assessment.score,
            risk_level=assessment.level,
            status="blocked",
            metadata_={"demo": True},
        )
        db.add(txn)
        db.flush()

    alert = fraud_svc.create_fraud_alert(
        transaction_id=txn.id,
        account_id=from_account.id,
        assessment=assessment,
    )

    db.commit()

    return {
        "pipeline": [
            {"step": "Transaction Created", "status": "done", "details": f"₹{req.amount:,.2f} transfer initiated"},
            {"step": "Feature Extraction", "status": "done", "details": f"{len(assessment.signals)} risk signals detected"},
            {"step": "Rule Engine", "status": "done", "details": f"Rule score: {assessment.rule_score}/100"},
            {"step": "ML Anomaly Detection", "status": "done", "details": f"Isolation Forest score: {assessment.ml_score:.3f}"},
            {"step": "Risk Scoring", "status": "done", "details": f"Combined score: {assessment.score}/100"},
            {"step": f"CRITICAL ({assessment.score}/100)", "status": "alert"},
            {"step": "Transaction Blocked", "status": "blocked"},
            {"step": "Fraud Alert Created", "status": "done", "details": f"Alert ID: {alert.id[:8]}..."},
            {"step": "Admin Notified", "status": "done"},
        ],
        "risk_assessment": {
            "score": assessment.score,
            "level": assessment.level,
            "reasons": assessment.reasons,
            "signals": assessment.signals,
            "ml_score": assessment.ml_score,
            "rule_score": assessment.rule_score,
            "recommended_action": assessment.recommended_action,
        },
        "transaction_id": txn.id,
        "transaction_ref": txn.transaction_id,
        "fraud_alert_id": alert.id,
    }
