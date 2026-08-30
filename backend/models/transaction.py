"""
Transaction Model — Global Digital Bank
"""

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Transaction:
    transaction_id: str
    account_number: int
    operation: str          # deposit | withdraw | transfer_in | transfer_out | create | close | reopen | rename | interest
    amount: float
    balance_after: float
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    note: str = ""

    def to_dict(self) -> dict:
        return {
            "transaction_id": self.transaction_id,
            "account_number": self.account_number,
            "operation": self.operation,
            "amount": round(self.amount, 2),
            "balance_after": round(self.balance_after, 2),
            "timestamp": self.timestamp,
            "note": self.note,
        }

    def to_csv_row(self) -> list:
        return [
            self.transaction_id,
            self.account_number,
            self.operation,
            round(self.amount, 2),
            round(self.balance_after, 2),
            self.timestamp,
            self.note,
        ]

    @staticmethod
    def csv_header() -> list:
        return [
            "transaction_id", "account_number", "operation",
            "amount", "balance_after", "timestamp", "note",
        ]

    @classmethod
    def from_csv_row(cls, row: dict) -> "Transaction":
        return cls(
            transaction_id=row["transaction_id"],
            account_number=int(row["account_number"]),
            operation=row["operation"],
            amount=float(row["amount"]),
            balance_after=float(row["balance_after"]),
            timestamp=row["timestamp"],
            note=row.get("note", ""),
        )
