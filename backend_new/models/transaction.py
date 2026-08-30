"""
Transaction model — Global Digital Bank
"""
import uuid
import random
import string
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def _now():
    return datetime.now(timezone.utc)


def _generate_txn_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "TXN-" + "".join(random.choices(chars, k=8))


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False,
                                                  default=_generate_txn_id, index=True)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"),
                                             nullable=False, index=True)

    # Transaction details
    type: Mapped[str] = mapped_column(
        SAEnum("deposit", "withdrawal", "transfer_out", "transfer_in", "interest",
               "account_open", "account_close", name="txn_type"),
        nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    balance_after: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="", nullable=False)

    # Counterparty (for transfers)
    counterparty_account_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    counterparty_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    beneficiary_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("beneficiaries.id"),
                                                           nullable=True)

    # Fraud / Risk
    risk_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(
        SAEnum("low", "medium", "high", "critical", name="risk_level"),
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "completed", "blocked", "flagged", "reversed", name="txn_status"),
        default="completed", nullable=False
    )

    # Device / location metadata (JSON)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)

    # Device reference
    device_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("devices.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False, index=True)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="transactions")
    beneficiary: Mapped[Optional["Beneficiary"]] = relationship("Beneficiary", foreign_keys=[beneficiary_id])
    fraud_alert: Mapped[Optional["FraudAlert"]] = relationship("FraudAlert", back_populates="transaction",
                                                                uselist=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "account_id": self.account_id,
            "type": self.type,
            "amount": round(self.amount, 2),
            "balance_after": round(self.balance_after, 2),
            "description": self.description,
            "counterparty_account_number": self.counterparty_account_number,
            "counterparty_name": self.counterparty_name,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "status": self.status,
            "metadata": self.metadata_,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
