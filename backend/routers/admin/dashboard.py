"""Admin Dashboard router — /api/admin/dashboard"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from middleware.auth import get_current_admin
from models.user import User
from models.account import Account
from models.transaction import Transaction
from models.fraud_alert import FraudAlert
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard")
def dashboard(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    total_customers = db.query(User).filter(User.role == "customer").count()
    total_accounts = db.query(Account).count()
    active_accounts = db.query(Account).filter(Account.status == "active").count()
    locked_accounts = db.query(Account).filter(Account.is_locked == True).count()

    total_txns = db.query(Transaction).count()
    txn_volume = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "completed"
    ).scalar() or 0

    suspicious_count = db.query(Transaction).filter(
        Transaction.risk_level.in_(["high", "critical"])
    ).count()
    blocked_count = db.query(Transaction).filter(Transaction.status == "blocked").count()
    open_alerts = db.query(FraudAlert).filter(FraudAlert.status == "open").count()

    avg_risk = db.query(func.avg(Transaction.risk_score)).filter(
        Transaction.risk_score.isnot(None)
    ).scalar() or 0

    fraud_rate = (suspicious_count / max(total_txns, 1)) * 100

    # Monthly transaction volumes
    monthly_txns = []
    for i in range(6, 0, -1):
        month_start = (now.replace(day=1) - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        count = db.query(Transaction).filter(
            Transaction.created_at >= month_start,
            Transaction.created_at < month_end,
        ).count()
        volume = db.query(func.sum(Transaction.amount)).filter(
            Transaction.created_at >= month_start,
            Transaction.created_at < month_end,
            Transaction.status == "completed",
        ).scalar() or 0
        monthly_txns.append({
            "month": month_start.strftime("%b %Y"),
            "count": count,
            "volume": round(float(volume), 2),
        })

    # Risk level distribution
    risk_dist = {}
    for level in ["low", "medium", "high", "critical"]:
        risk_dist[level] = db.query(Transaction).filter(Transaction.risk_level == level).count()

    # Recent fraud alerts
    recent_alerts = db.query(FraudAlert).order_by(FraudAlert.created_at.desc()).limit(5).all()
    alerts_data = []
    for a in recent_alerts:
        d = a.to_dict()
        txn = db.query(Transaction).filter(Transaction.id == a.transaction_id).first()
        acc = db.query(Account).filter(Account.id == a.account_id).first()
        if txn:
            d["amount"] = txn.amount
            d["transaction_ref"] = txn.transaction_id
        if acc and acc.user:
            d["customer_name"] = acc.user.full_name
        alerts_data.append(d)

    return {
        "stats": {
            "total_customers": total_customers,
            "total_accounts": total_accounts,
            "active_accounts": active_accounts,
            "locked_accounts": locked_accounts,
            "total_transactions": total_txns,
            "transaction_volume": round(float(txn_volume), 2),
            "suspicious_transactions": suspicious_count,
            "blocked_transactions": blocked_count,
            "open_fraud_alerts": open_alerts,
            "fraud_rate": round(fraud_rate, 2),
            "avg_risk_score": round(float(avg_risk), 1),
        },
        "monthly_transactions": monthly_txns,
        "risk_distribution": risk_dist,
        "recent_alerts": alerts_data,
    }


@router.get("/customers")
def list_customers(
    page: int = 1, per_page: int = 20, q: str = "",
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == "customer")
    if q:
        query = query.filter(
            (User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()
    result = []
    for u in users:
        d = u.to_dict()
        accounts = db.query(Account).filter(Account.user_id == u.id).all()
        d["accounts"] = [a.to_dict() for a in accounts]
        d["total_balance"] = sum(a.balance for a in accounts)
        result.append(d)
    return {"customers": result, "total": total, "page": page}


@router.get("/accounts")
def list_accounts(
    status: str = "all", page: int = 1, per_page: int = 20,
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    q = db.query(Account)
    if status == "active":
        q = q.filter(Account.status == "active")
    elif status == "locked":
        q = q.filter(Account.is_locked == True)
    elif status == "inactive":
        q = q.filter(Account.status == "inactive")
    total = q.count()
    accounts = q.offset((page-1)*per_page).limit(per_page).all()
    result = []
    for a in accounts:
        d = a.to_dict()
        if a.user:
            d["customer_name"] = a.user.full_name
            d["customer_email"] = a.user.email
        result.append(d)
    return {"accounts": result, "total": total, "page": page}


@router.get("/transactions")
def list_transactions(
    page: int = 1, per_page: int = 30, status: str = "all", risk_level: str = "all",
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    q = db.query(Transaction)
    if status != "all":
        q = q.filter(Transaction.status == status)
    if risk_level != "all":
        q = q.filter(Transaction.risk_level == risk_level)
    total = q.count()
    txns = q.order_by(Transaction.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()
    result = []
    for t in txns:
        d = t.to_dict()
        acc = db.query(Account).filter(Account.id == t.account_id).first()
        if acc and acc.user:
            d["customer_name"] = acc.user.full_name
            d["account_number"] = acc.masked_number()
        result.append(d)
    return {"transactions": result, "total": total, "page": page}


@router.post("/accounts/{account_id}/unlock")
def unlock_account(
    account_id: str,
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    from services.banking_service import BankingService, BankingError
    try:
        account = BankingService(db).unlock_account(account_id, current_admin.id)
        return {"message": "Account unlocked.", "account": account.to_dict()}
    except BankingError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/audit-logs")
def audit_logs(
    page: int = 1, per_page: int = 50, action: str = "all",
    current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db),
):
    from models.audit_log import AuditLog
    q = db.query(AuditLog)
    if action != "all":
        q = q.filter(AuditLog.action == action)
    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()
    result = []
    for l in logs:
        d = l.to_dict()
        if l.user:
            d["user_name"] = l.user.full_name
            d["user_email"] = l.user.email
        result.append(d)
    return {"logs": result, "total": total, "page": page}


@router.get("/report")
def banking_report(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    from sqlalchemy import func
    total_balance = db.query(func.sum(Account.balance)).scalar() or 0
    avg_balance = db.query(func.avg(Account.balance)).scalar() or 0
    savings_count = db.query(Account).filter(Account.account_type == "savings").count()
    current_count = db.query(Account).filter(Account.account_type == "current").count()
    top_accounts = db.query(Account).order_by(Account.balance.desc()).limit(5).all()
    return {
        "total_customers": db.query(User).filter(User.role == "customer").count(),
        "total_accounts": db.query(Account).count(),
        "active_accounts": db.query(Account).filter(Account.status == "active").count(),
        "total_balance": round(float(total_balance), 2),
        "avg_balance": round(float(avg_balance), 2),
        "savings_count": savings_count,
        "current_count": current_count,
        "top_accounts": [
            {**a.to_dict(), "customer_name": a.user.full_name if a.user else ""}
            for a in top_accounts
        ],
    }
