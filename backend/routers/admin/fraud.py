"""Admin Fraud Monitoring router — /api/admin/fraud/*"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_admin
from services.fraud_service import FraudService
from schemas.banking import ResolveFraudAlertRequest
from models.user import User
from models.fraud_alert import FraudAlert
from models.transaction import Transaction
from models.account import Account

router = APIRouter(prefix="/api/admin/fraud", tags=["admin-fraud"])


@router.get("")
def list_fraud_alerts(
    status: str = "all", page: int = 1, per_page: int = 20,
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    return FraudService(db).get_fraud_alerts(status, page, per_page)


@router.get("/{alert_id}")
def get_fraud_alert(
    alert_id: str,
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    alert = db.query(FraudAlert).filter(FraudAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Fraud alert not found.")

    d = alert.to_dict()

    # Full transaction details
    txn = db.query(Transaction).filter(Transaction.id == alert.transaction_id).first()
    if txn:
        d["transaction"] = txn.to_dict()

    # Customer + account info
    account = db.query(Account).filter(Account.id == alert.account_id).first()
    if account:
        d["account"] = account.to_dict()
        if account.user:
            d["customer"] = account.user.to_dict()

    # Recent transactions for this account
    if account:
        recent_txns = db.query(Transaction).filter(
            Transaction.account_id == account.id
        ).order_by(Transaction.created_at.desc()).limit(10).all()
        d["recent_transactions"] = [t.to_dict() for t in recent_txns]

    # Other fraud alerts for this account
    other_alerts = db.query(FraudAlert).filter(
        FraudAlert.account_id == alert.account_id,
        FraudAlert.id != alert_id,
    ).order_by(FraudAlert.created_at.desc()).limit(5).all()
    d["related_alerts"] = [a.to_dict() for a in other_alerts]

    return {"alert": d}


@router.post("/{alert_id}/resolve")
def resolve_fraud_alert(
    alert_id: str,
    req: ResolveFraudAlertRequest,
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    try:
        alert = FraudService(db).resolve_alert(
            alert_id=alert_id,
            resolution=req.resolution,
            notes=req.notes,
            admin_user_id=current_admin.id,
        )
        return {"message": f"Alert {req.resolution}.", "alert": alert.to_dict()}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
