"""Security router — /api/security/*"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_customer
from models.user import User
from models.audit_log import AuditLog
from models.device import Device

router = APIRouter(prefix="/api/security", tags=["security"])


@router.get("/login-history")
def login_history(
    limit: int = 20,
    current_user: User = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action.in_(["LOGIN_SUCCESS", "LOGIN_FAILED", "ACCOUNT_LOCKED"]),
    ).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return {"login_history": [l.to_dict() for l in logs]}


@router.get("/devices")
def list_devices(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    devices = db.query(Device).filter(Device.user_id == current_user.id).order_by(
        Device.last_seen_at.desc()
    ).all()
    return {"devices": [d.to_dict() for d in devices]}


@router.get("/overview")
def security_overview(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    failed_count = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action == "LOGIN_FAILED",
    ).count()
    device_count = db.query(Device).filter(Device.user_id == current_user.id).count()
    last_login = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id,
        AuditLog.action == "LOGIN_SUCCESS",
    ).order_by(AuditLog.created_at.desc()).first()

    return {
        "is_locked": current_user.is_locked,
        "failed_login_attempts": current_user.failed_login_attempts,
        "total_failed_logins": failed_count,
        "registered_devices": device_count,
        "last_successful_login": last_login.created_at.isoformat() if last_login else None,
    }
