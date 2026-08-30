"""Accounts router — /api/accounts/*"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_customer
from services.banking_service import BankingService, BankingError
from schemas.banking import DepositRequest, WithdrawRequest
from models.user import User
from models.account import Account

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("")
def list_accounts(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    svc = BankingService(db)
    accounts = svc.get_user_accounts(current_user.id)
    return {"accounts": [a.to_dict() for a in accounts]}


@router.get("/{account_id}")
def get_account(account_id: str, current_user: User = Depends(get_current_customer),
                db: Session = Depends(get_db)):
    try:
        account = BankingService(db).get_account(account_id, current_user.id)
        return {"account": account.to_dict()}
    except BankingError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{account_id}/deposit")
def deposit(account_id: str, req: DepositRequest,
            current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    try:
        result = BankingService(db).deposit(account_id, current_user.id, req.amount)
        return {"message": f"₹{req.amount:,.2f} deposited successfully.", **result}
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{account_id}/withdraw")
def withdraw(account_id: str, req: WithdrawRequest,
             current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    try:
        result = BankingService(db).withdraw(account_id, current_user.id, req.amount, req.pin)
        return {"message": f"₹{req.amount:,.2f} withdrawn successfully.", **result}
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{account_id}/withdrawal-limit")
def withdrawal_limit(account_id: str, current_user: User = Depends(get_current_customer),
                     db: Session = Depends(get_db)):
    try:
        return BankingService(db).get_withdrawal_limit_info(account_id, current_user.id)
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{account_id}/transactions")
def account_transactions(account_id: str, page: int = 1, per_page: int = 20,
                         type: str = "all", status: str = "all",
                         current_user: User = Depends(get_current_customer),
                         db: Session = Depends(get_db)):
    try:
        return BankingService(db).get_transactions(account_id, current_user.id, page, per_page, type, status)
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{account_id}/close")
def close_account(account_id: str, pin: str,
                  current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    try:
        account = BankingService(db).close_account(account_id, current_user.id, pin)
        return {"message": "Account closed.", "account": account.to_dict()}
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{account_id}/reopen")
def reopen_account(account_id: str, pin: str,
                   current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    try:
        account = BankingService(db).reopen_account(account_id, current_user.id, pin)
        return {"message": "Account reopened.", "account": account.to_dict()}
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))
