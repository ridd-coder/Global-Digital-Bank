"""
FraudFeatureExtractor — Extracts transaction features for fraud scoring.
All features are behavioral/statistical; no sensitive demographic data.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from dataclasses import dataclass

from sqlalchemy.orm import Session
from models.account import Account
from models.transaction import Transaction
from models.beneficiary import Beneficiary
from models.user import User


@dataclass
class TransactionFeatures:
    amount: float
    avg_amount: float
    amount_deviation: float          # (amount - avg) / max(avg, 1)
    txn_count_1h: int
    txn_count_24h: int
    is_new_beneficiary: bool         # beneficiary added < 24h ago
    is_unusual_time: bool            # 01:00–05:00 local hour
    is_new_device: bool
    failed_logins_recent: int
    daily_velocity: float            # fraction of daily limit used
    account_age_days: int
    large_amount_flag: bool          # amount > ₹1,00,000
    high_velocity_flag: bool         # txn_count_1h > 3


def make_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt

def extract_features(
    db: Session,
    account: Account,
    amount: float,
    beneficiary_id: Optional[str] = None,
    is_new_device: bool = False,
    txn_hour: Optional[int] = None,  # override for demo/testing
) -> TransactionFeatures:
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    twenty_four_hours_ago = now - timedelta(hours=24)
    thirty_days_ago = now - timedelta(days=30)

    # Historical transactions for this account
    recent_txns = db.query(Transaction).filter(
        Transaction.account_id == account.id,
        Transaction.type.in_(["withdrawal", "transfer_out"]),
        Transaction.status == "completed",
        Transaction.created_at >= thirty_days_ago,
    ).all()

    amounts = [t.amount for t in recent_txns]
    avg_amount = sum(amounts) / len(amounts) if amounts else amount
    amount_deviation = (amount - avg_amount) / max(avg_amount, 1.0)

    # Transaction counts
    txn_count_1h = db.query(Transaction).filter(
        Transaction.account_id == account.id,
        Transaction.type.in_(["withdrawal", "transfer_out"]),
        Transaction.created_at >= one_hour_ago,
    ).count()

    txn_count_24h = db.query(Transaction).filter(
        Transaction.account_id == account.id,
        Transaction.type.in_(["withdrawal", "transfer_out"]),
        Transaction.created_at >= twenty_four_hours_ago,
    ).count()

    # New beneficiary check (added in last 24h)
    is_new_beneficiary = False
    if beneficiary_id:
        ben = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
        ben_created_at = make_aware(ben.created_at) if ben else None
        if ben_created_at and ben_created_at >= twenty_four_hours_ago:
            is_new_beneficiary = True
    elif beneficiary_id is None:
        # No saved beneficiary → fresh transfer
        is_new_beneficiary = True

    # Unusual time (01:00–05:00 UTC ≈ 02:00–06:00 IST — wee hours)
    hour = txn_hour if txn_hour is not None else now.hour
    is_unusual_time = 1 <= hour <= 5

    # Failed logins for this user in last 24h
    from models.audit_log import AuditLog
    failed_logins = db.query(AuditLog).filter(
        AuditLog.user_id == account.user_id,
        AuditLog.action == "LOGIN_FAILED",
        AuditLog.created_at >= twenty_four_hours_ago,
    ).count()

    # Daily velocity
    daily_velocity = account.daily_withdrawn / 50000.0  # fraction of 50k limit

    # Account age
    account_created_at = make_aware(account.created_at)
    account_age_days = (now - account_created_at).days if account_created_at else 0

    return TransactionFeatures(
        amount=amount,
        avg_amount=round(avg_amount, 2),
        amount_deviation=round(amount_deviation, 4),
        txn_count_1h=txn_count_1h,
        txn_count_24h=txn_count_24h,
        is_new_beneficiary=is_new_beneficiary,
        is_unusual_time=is_unusual_time,
        is_new_device=is_new_device,
        failed_logins_recent=failed_logins,
        daily_velocity=round(daily_velocity, 4),
        account_age_days=account_age_days,
        large_amount_flag=amount > 100000,
        high_velocity_flag=txn_count_1h > 3,
    )
