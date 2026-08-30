"""Pydantic schemas — Accounts, Transactions, Beneficiaries, Transfers"""
from pydantic import BaseModel, field_validator
from typing import Optional


# ── Account Schemas ────────────────────────────────────────────────────────────

class DepositRequest(BaseModel):
    amount: float

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive.")
        if v > 10_000_000:
            raise ValueError("Amount exceeds maximum transaction limit.")
        return round(v, 2)


class WithdrawRequest(BaseModel):
    amount: float
    pin: str

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive.")
        return round(v, 2)


class TransferRequest(BaseModel):
    to_account_number: str
    amount: float
    pin: str
    description: str = ""
    beneficiary_id: Optional[str] = None
    # Optional fraud context
    device_fingerprint: Optional[str] = None
    location: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive.")
        return round(v, 2)


class VerifyTransferRequest(BaseModel):
    """Step-up verification — provide OTP (simulated) to confirm high-risk transfer."""
    transfer_token: str
    otp: str


class AddBeneficiaryRequest(BaseModel):
    name: str
    account_number: str
    bank_name: str = "Global Digital Bank"

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Beneficiary name cannot be empty.")
        return v

    @field_validator("account_number")
    @classmethod
    def validate_account(cls, v):
        v = v.strip()
        if not v.isdigit() or len(v) < 6:
            raise ValueError("Invalid account number.")
        return v


# ── Statement ──────────────────────────────────────────────────────────────────

class StatementRequest(BaseModel):
    from_date: str  # YYYY-MM-DD
    to_date: str    # YYYY-MM-DD
    format: str = "csv"  # csv | pdf

    @field_validator("format")
    @classmethod
    def validate_format(cls, v):
        if v not in ("csv", "pdf"):
            raise ValueError("Format must be 'csv' or 'pdf'.")
        return v


# ── Admin Actions ──────────────────────────────────────────────────────────────

class UnlockAccountRequest(BaseModel):
    reason: str = ""


class ResolveFraudAlertRequest(BaseModel):
    resolution: str  # resolved | false_positive
    notes: str = ""


class SimulateSuspiciousRequest(BaseModel):
    """Admin-only: trigger the fraud demo pipeline."""
    amount: float = 85000.0
    target_account_number: Optional[str] = None
    new_beneficiary: bool = True
    new_device: bool = True
    unusual_time: bool = True
    unusual_location: bool = True
