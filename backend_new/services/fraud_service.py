"""
FraudService — Orchestrates the complete fraud detection pipeline.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.account import Account
from models.transaction import Transaction
from models.fraud_alert import FraudAlert
from models.notification import Notification
from models.audit_log import AuditLog
from fraud.feature_extractor import extract_features, TransactionFeatures
from fraud.risk_scorer import score_transaction, RiskAssessment
from typing import Optional


class FraudService:

    def __init__(self, db: Session):
        self.db = db

    def assess_transaction(
        self,
        account: Account,
        amount: float,
        beneficiary_id: Optional[str] = None,
        is_new_device: bool = False,
        override_hour: Optional[int] = None,  # for demo/testing
    ) -> RiskAssessment:
        """Run the full fraud assessment pipeline for a proposed transaction."""
        features = extract_features(
            db=self.db,
            account=account,
            amount=amount,
            beneficiary_id=beneficiary_id,
            is_new_device=is_new_device,
            txn_hour=override_hour,
        )
        return score_transaction(features)

    def create_fraud_alert(
        self,
        transaction_id: str,
        account_id: str,
        assessment: RiskAssessment,
        admin_user_id: Optional[str] = None,
    ) -> FraudAlert:
        """Create a fraud alert record for a flagged/blocked transaction."""
        alert = FraudAlert(
            transaction_id=transaction_id,
            account_id=account_id,
            risk_score=assessment.score,
            risk_level=assessment.level,
            reasons=assessment.reasons,
            ml_score=assessment.ml_score,
            rule_score=assessment.rule_score,
            status="open",
        )
        self.db.add(alert)

        # Notify the account owner
        account = self.db.query(Account).filter(Account.id == account_id).first()
        transaction = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if account and account.user_id and transaction:
            notif = Notification(
                user_id=account.user_id,
                title="⚠️ Suspicious Transaction Detected",
                body=(
                    f"A transaction of ₹{transaction.amount:,.2f} has been flagged. "
                    f"Risk score: {assessment.score}/100 ({assessment.level.upper()}). "
                    "Contact support if this was not you."
                ),
                type="fraud",
            )
            self.db.add(notif)

        # Audit log
        log = AuditLog(
            user_id=admin_user_id,
            action="FRAUD_ALERT_CREATED",
            resource_type="transaction",
            resource_id=transaction_id,
            details={
                "risk_score": assessment.score,
                "risk_level": assessment.level,
                "signals": assessment.signals,
            },
        )
        self.db.add(log)
        self.db.flush()
        return alert

    def get_fraud_alerts(
        self,
        status: str = "all",
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        q = self.db.query(FraudAlert)
        if status != "all":
            q = q.filter(FraudAlert.status == status)
        total = q.count()
        alerts = q.order_by(FraudAlert.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

        result = []
        for alert in alerts:
            d = alert.to_dict()
            # Enrich with transaction + account info
            txn = self.db.query(Transaction).filter(Transaction.id == alert.transaction_id).first()
            account = self.db.query(Account).filter(Account.id == alert.account_id).first()
            if txn:
                d["transaction"] = txn.to_dict()
            if account and account.user:
                d["customer_name"] = account.user.full_name
                d["account_number"] = account.masked_number()
            result.append(d)

        return {"alerts": result, "total": total, "page": page, "per_page": per_page}

    def resolve_alert(
        self,
        alert_id: str,
        resolution: str,
        notes: str,
        admin_user_id: str,
    ) -> FraudAlert:
        alert = self.db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
        if not alert:
            raise ValueError("Fraud alert not found.")
        alert.status = resolution  # resolved | false_positive | investigating
        alert.resolved_by = admin_user_id
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolution_notes = notes
        log = AuditLog(
            user_id=admin_user_id,
            action="FRAUD_ALERT_RESOLVED",
            resource_type="fraud_alert",
            resource_id=alert_id,
            details={"resolution": resolution, "notes": notes},
        )
        self.db.add(log)
        self.db.commit()
        return alert
