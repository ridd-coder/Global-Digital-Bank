"""Pydantic schemas — Auth"""
from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    date_of_birth: str  # YYYY-MM-DD
    phone: str | None = None
    account_type: str = "savings"
    initial_deposit: float = 1000.0
    pin: str  # 4-digit transaction PIN

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v):
        if not v.isdigit() or len(v) != 4:
            raise ValueError("PIN must be exactly 4 digits.")
        return v

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, v):
        if v.lower() not in ("savings", "current"):
            raise ValueError("Account type must be 'savings' or 'current'.")
        return v.lower()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str

    @field_validator("new_pin")
    @classmethod
    def validate_pin(cls, v):
        if not v.isdigit() or len(v) != 4:
            raise ValueError("New PIN must be exactly 4 digits.")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v
