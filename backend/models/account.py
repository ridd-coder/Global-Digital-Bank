"""
Account Model — Global Digital Bank
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class Account:
    account_number: int
    name: str
    age: int
    account_type: str          # "Savings" or "Current"
    balance: float
    pin_hash: str              # bcrypt hash — never plaintext
    status: str = "active"    # "active" or "inactive"
    is_locked: bool = False
    failed_login_attempts: int = 0
    daily_withdrawn: float = 0.0
    last_withdrawal_date: str = ""   # ISO date string YYYY-MM-DD
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    # ── Helpers ────────────────────────────────────────────────────────────────
    def is_active(self) -> bool:
        return self.status == "active"

    def to_dict(self, include_sensitive: bool = False) -> dict:
        d = {
            "account_number": self.account_number,
            "name": self.name,
            "age": self.age,
            "account_type": self.account_type,
            "balance": round(self.balance, 2),
            "status": self.status,
            "is_locked": self.is_locked,
            "failed_login_attempts": self.failed_login_attempts,
            "daily_withdrawn": round(self.daily_withdrawn, 2),
            "last_withdrawal_date": self.last_withdrawal_date,
            "created_at": self.created_at,
        }
        if include_sensitive:
            d["pin_hash"] = self.pin_hash
        return d

    def to_csv_row(self) -> list:
        """Return ordered list matching CSV header."""
        return [
            self.account_number,
            self.name,
            self.age,
            self.account_type,
            round(self.balance, 2),
            self.pin_hash,
            self.status,
            int(self.is_locked),
            self.failed_login_attempts,
            round(self.daily_withdrawn, 2),
            self.last_withdrawal_date,
            self.created_at,
        ]

    @staticmethod
    def csv_header() -> list:
        return [
            "account_number", "name", "age", "account_type",
            "balance", "pin_hash", "status", "is_locked",
            "failed_login_attempts", "daily_withdrawn",
            "last_withdrawal_date", "created_at",
        ]

    @classmethod
    def from_csv_row(cls, row: dict) -> "Account":
        return cls(
            account_number=int(row["account_number"]),
            name=row["name"],
            age=int(row["age"]),
            account_type=row["account_type"],
            balance=float(row["balance"]),
            pin_hash=row["pin_hash"],
            status=row["status"],
            is_locked=row["is_locked"] in ("1", "True", "true"),
            failed_login_attempts=int(row["failed_login_attempts"]),
            daily_withdrawn=float(row["daily_withdrawn"]),
            last_withdrawal_date=row["last_withdrawal_date"],
            created_at=row["created_at"],
        )
