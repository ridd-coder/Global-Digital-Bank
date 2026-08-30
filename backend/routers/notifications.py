"""Notifications router — /api/notifications/*"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_customer
from models.user import User
from models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    page: int = 1, per_page: int = 30,
    current_user: User = Depends(get_current_customer), db: Session = Depends(get_db),
):
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    total = q.count()
    unread = q.filter(Notification.is_read == False).count()
    notifs = q.order_by(Notification.created_at.desc()).offset((page-1)*per_page).limit(per_page).all()
    return {
        "notifications": [n.to_dict() for n in notifs],
        "total": total,
        "unread": unread,
        "page": page,
    }


@router.post("/{notif_id}/read")
def mark_read(notif_id: str, current_user: User = Depends(get_current_customer),
              db: Session = Depends(get_db)):
    n = db.query(Notification).filter(
        Notification.id == notif_id, Notification.user_id == current_user.id
    ).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Marked as read."}


@router.post("/read-all")
def mark_all_read(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}
