"""Analytics router — /api/analytics"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_customer
from services.banking_service import BankingService
from models.user import User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("")
def get_analytics(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    return BankingService(db).get_analytics(current_user.id)
