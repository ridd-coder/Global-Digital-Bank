"""
Account model — Global Digital Bank
"""
import uuid
import random
from datetime import datetime, timezone, date
from sqlalchemy import String, Float, Boolean, Integer, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def _now():
    return datetime.now(timezone.utc)


def _generate_account_number() -> str:
    """Generate a 10-digit account number."""
    return str(random.randint(1000000000, 9999999999))


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True,
                                                 default=_generate_account_number)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_type: Mapped[str] = mapped_column(SAEnum("savings", "current", name="account_type"), nullable=False)
    balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(SAEnum("active", "inactive", "closed", name="account_status"),
                                        default="active", nullable=False)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)  # bcrypt — never plaintext

    # Daily withdrawal tracking (migrated from existing logic)
    daily_withdrawn: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_withdrawal_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Security (mirrors user-level lock for account-specific operations)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="account",
                                                              lazy="select", cascade="all, delete-orphan")
    beneficiaries: Mapped[list["Beneficiary"]] = relationship("Beneficiary", back_populates="account",
                                                               foreign_keys="Beneficiary.account_id",
                                                               lazy="select", cascade="all, delete-orphan")
    fraud_alerts: Mapped[list["FraudAlert"]] = relationship("FraudAlert", back_populates="account", lazy="select")

    def is_active(self) -> bool:
        return self.status == "active"

    def masked_number(self) -> str:
        """Return masked account number like ****7890."""
        if len(self.account_number) >= 4:
            return f"****{self.account_number[-4:]}"
        return self.account_number

    def reset_daily_if_needed(self):
        """Reset daily_withdrawn if it's a new day (migrated from existing logic)."""
        today = date.today()
        if self.last_withdrawal_date != today:
            self.daily_withdrawn = 0.0
            self.last_withdrawal_date = today

    def to_dict(self, include_sensitive: bool = False) -> dict:
        return {
            "id": self.id,
            "account_number": self.account_number,
            "masked_number": self.masked_number(),
            "user_id": self.user_id,
            "account_type": self.account_type,
            "balance": round(self.balance, 2),
            "status": self.status,
            "is_locked": self.is_locked,
            "daily_withdrawn": round(self.daily_withdrawn, 2),
            "last_withdrawal_date": self.last_withdrawal_date.isoformat() if self.last_withdrawal_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
