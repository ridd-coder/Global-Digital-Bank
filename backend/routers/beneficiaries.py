"""Beneficiaries router — /api/beneficiaries/*"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_customer
from services.banking_service import BankingService, BankingError
from schemas.banking import AddBeneficiaryRequest
from models.user import User
from models.account import Account

router = APIRouter(prefix="/api/beneficiaries", tags=["beneficiaries"])


def _get_primary_account(user_id: str, db: Session) -> Account:
    account = db.query(Account).filter(Account.user_id == user_id, Account.status == "active").first()
    if not account:
        raise HTTPException(status_code=404, detail="No active account found.")
    return account


@router.get("")
def list_beneficiaries(current_user: User = Depends(get_current_customer), db: Session = Depends(get_db)):
    account = _get_primary_account(current_user.id, db)
    bens = BankingService(db).get_beneficiaries(account.id, current_user.id)
    return {"beneficiaries": [b.to_dict() for b in bens]}


@router.post("", status_code=201)
def add_beneficiary(req: AddBeneficiaryRequest, current_user: User = Depends(get_current_customer),
                    db: Session = Depends(get_db)):
    account = _get_primary_account(current_user.id, db)
    try:
        ben = BankingService(db).add_beneficiary(
            account.id, current_user.id, req.name, req.account_number, req.bank_name
        )
        return {"message": "Beneficiary added.", "beneficiary": ben.to_dict()}
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{beneficiary_id}")
def delete_beneficiary(beneficiary_id: str, current_user: User = Depends(get_current_customer),
                       db: Session = Depends(get_db)):
    account = _get_primary_account(current_user.id, db)
    try:
        BankingService(db).delete_beneficiary(beneficiary_id, account.id, current_user.id)
        return {"message": "Beneficiary removed."}
    except BankingError as e:
        raise HTTPException(status_code=400, detail=str(e))
