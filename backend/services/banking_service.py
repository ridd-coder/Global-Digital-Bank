"""
BankingService — Core banking operations (migrated from existing Flask/CSV banking_service.py)
All business logic preserved: daily limits, min balance, PIN verification, lockout, etc.
Now operates on SQLAlchemy ORM instead of CSV FileManager.
"""
from datetime import date, datetime, timezone
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import settings
from models.account import Account
from models.transaction import Transaction
from models.beneficiary import Beneficiary
from models.audit_log import AuditLog
from models.notification import Notification

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class BankingError(Exception):
    pass


class BankingService:

    def __init__(self, db: Session):
        self.db = db

    # ── PIN verification ───────────────────────────────────────────────────────

    def _verify_pin(self, pin: str, pin_hash: str) -> bool:
        try:
            return pwd_ctx.verify(pin, pin_hash)
        except Exception:
            return False

    # ── Daily withdrawal reset (migrated from existing logic) ──────────────────

    def _reset_daily_if_needed(self, account: Account) -> Account:
        today = date.today()
        if account.last_withdrawal_date != today:
            account.daily_withdrawn = 0.0
            account.last_withdrawal_date = today
        return account

    # ── Min balance helper ─────────────────────────────────────────────────────

    def _get_min_balance(self, account_type: str) -> float:
        return (
            settings.MIN_BALANCE_SAVINGS
            if account_type == "savings"
            else settings.MIN_BALANCE_CURRENT
        )

    # ── Get account (ownership-checked) ───────────────────────────────────────

    def get_account(self, account_id: str, user_id: str) -> Account:
        account = self.db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == user_id,
        ).first()
        if not account:
            raise BankingError("Account not found or access denied.")
        return account

    def get_account_by_number(self, account_number: str) -> Optional[Account]:
        return self.db.query(Account).filter(Account.account_number == account_number).first()

    def get_user_accounts(self, user_id: str) -> list[Account]:
        return self.db.query(Account).filter(Account.user_id == user_id).all()

    # ── Deposit ────────────────────────────────────────────────────────────────

    def deposit(self, account_id: str, user_id: str, amount: float) -> dict:
        if amount <= 0:
            raise BankingError("Deposit amount must be positive.")
        account = self.get_account(account_id, user_id)
        if not account.is_active():
            raise BankingError("Account is inactive. Please contact support.")
        if account.is_locked:
            raise BankingError("Account is locked. Contact support to unlock.")

        account.balance += amount
        txn = self._log(account, "deposit", amount, f"Deposit of ₹{amount:,.2f}", "completed")
        self._notify(account.user_id, "Deposit Successful",
                     f"₹{amount:,.2f} has been deposited to your account ****{account.account_number[-4:]}.")
        self.db.commit()
        return {"account": account.to_dict(), "transaction": txn.to_dict()}

    # ── Withdraw ───────────────────────────────────────────────────────────────

    def withdraw(self, account_id: str, user_id: str, amount: float, pin: str) -> dict:
        if amount <= 0:
            raise BankingError("Withdrawal amount must be positive.")
        account = self.get_account(account_id, user_id)
        if account.is_locked:
            raise BankingError("Account is locked. Contact support to unlock.")
        if not account.is_active():
            raise BankingError("Account is inactive.")
        if not self._verify_pin(pin, account.pin_hash):
            raise BankingError("Incorrect transaction PIN.")

        account = self._reset_daily_if_needed(account)
        min_bal = self._get_min_balance(account.account_type)
        if account.balance - amount < min_bal:
            raise BankingError(
                f"Insufficient balance. Minimum required balance: ₹{min_bal:,.2f}."
            )
        remaining_daily = settings.DAILY_WITHDRAWAL_LIMIT - account.daily_withdrawn
        if amount > remaining_daily:
            raise BankingError(
                f"Daily withdrawal limit exceeded. You can withdraw up to ₹{remaining_daily:,.2f} today."
            )

        account.balance -= amount
        account.daily_withdrawn += amount
        txn = self._log(account, "withdrawal", amount, f"Withdrawal of ₹{amount:,.2f}", "completed")
        self._notify(account.user_id, "Withdrawal Successful",
                     f"₹{amount:,.2f} has been withdrawn from your account ****{account.account_number[-4:]}.")
        self.db.commit()
        return {"account": account.to_dict(), "transaction": txn.to_dict()}

    # ── Transfer ───────────────────────────────────────────────────────────────

    def transfer(
        self,
        from_account: Account,
        to_account_number: str,
        amount: float,
        pin: str,
        description: str = "",
        beneficiary_id: Optional[str] = None,
        risk_score: int = 0,
        risk_level: str = "low",
        status: str = "completed",
    ) -> dict:
        if amount <= 0:
            raise BankingError("Transfer amount must be positive.")
        if from_account.account_number == to_account_number:
            raise BankingError("Cannot transfer to the same account.")
        if from_account.is_locked:
            raise BankingError("Your account is locked. Contact support.")
        if not from_account.is_active():
            raise BankingError("Your account is inactive.")
        if not self._verify_pin(pin, from_account.pin_hash):
            raise BankingError("Incorrect transaction PIN.")

        to_account = self.get_account_by_number(to_account_number)
        if to_account and not to_account.is_active():
            raise BankingError("Recipient account is inactive.")

        from_account = self._reset_daily_if_needed(from_account)
        min_bal = self._get_min_balance(from_account.account_type)
        if from_account.balance - amount < min_bal:
            raise BankingError(f"Insufficient balance. Minimum required: ₹{min_bal:,.2f}.")
        remaining_daily = settings.DAILY_WITHDRAWAL_LIMIT - from_account.daily_withdrawn
        if amount > remaining_daily:
            raise BankingError(f"Daily limit exceeded. Remaining today: ₹{remaining_daily:,.2f}.")

        from_account.balance -= amount
        from_account.daily_withdrawn += amount

        # Credit receiver only if not blocked and receiver is internal
        if status != "blocked" and to_account:
            to_account.balance += amount

        desc_out = description or f"Transfer to {to_account_number}"
        desc_in = description or f"Transfer from ****{from_account.account_number[-4:]}"

        txn_out = self._log(
            from_account, "transfer_out", amount, desc_out, status,
            counterparty_account_number=to_account_number,
            counterparty_name=to_account.user.full_name if (to_account and to_account.user) else "External Account",
            beneficiary_id=beneficiary_id,
            risk_score=risk_score,
            risk_level=risk_level,
        )
        if status != "blocked" and to_account:
            self._log(
                to_account, "transfer_in", amount, desc_in, "completed",
                counterparty_account_number=from_account.account_number,
            )

        self.db.flush()
        return {
            "from_account": from_account.to_dict(),
            "to_account": to_account.to_dict() if to_account else None,
            "transaction": txn_out.to_dict(),
            "transaction_id": txn_out.id,
        }

    # ── Withdrawal limit info ──────────────────────────────────────────────────

    def get_withdrawal_limit_info(self, account_id: str, user_id: str) -> dict:
        account = self.get_account(account_id, user_id)
        account = self._reset_daily_if_needed(account)
        return {
            "limit": settings.DAILY_WITHDRAWAL_LIMIT,
            "used": round(account.daily_withdrawn, 2),
            "remaining": round(settings.DAILY_WITHDRAWAL_LIMIT - account.daily_withdrawn, 2),
        }

    # ── Close / Reopen ─────────────────────────────────────────────────────────

    def close_account(self, account_id: str, user_id: str, pin: str) -> Account:
        account = self.get_account(account_id, user_id)
        if account.is_locked:
            raise BankingError("Account is locked. Contact support.")
        if not self._verify_pin(pin, account.pin_hash):
            raise BankingError("Incorrect PIN.")
        if account.status == "inactive":
            raise BankingError("Account is already closed.")
        account.status = "inactive"
        self._log(account, "account_close", 0.0, "Account closed", "completed")
        self.db.commit()
        return account

    def reopen_account(self, account_id: str, user_id: str, pin: str) -> Account:
        account = self.get_account(account_id, user_id)
        if not self._verify_pin(pin, account.pin_hash):
            raise BankingError("Incorrect PIN.")
        if account.status == "active":
            raise BankingError("Account is already active.")
        account.status = "active"
        self._log(account, "account_open", 0.0, "Account reopened", "completed")
        self.db.commit()
        return account

    # ── Beneficiary management ─────────────────────────────────────────────────

    def add_beneficiary(self, account_id: str, user_id: str, name: str,
                        account_number: str, bank_name: str = "Global Digital Bank") -> Beneficiary:
        account = self.get_account(account_id, user_id)
        # Check duplicate
        existing = self.db.query(Beneficiary).filter(
            Beneficiary.account_id == account_id,
            Beneficiary.account_number == account_number,
            Beneficiary.is_active == True,
        ).first()
        if existing:
            raise BankingError("This beneficiary already exists.")
        if account_number == account.account_number:
            raise BankingError("Cannot add your own account as a beneficiary.")

        ben = Beneficiary(account_id=account_id, name=name, account_number=account_number, bank_name=bank_name)
        self.db.add(ben)
        self._notify(user_id, "Beneficiary Added",
                     f"New beneficiary '{name}' (****{account_number[-4:]}) has been added.")
        self.db.commit()
        return ben

    def get_beneficiaries(self, account_id: str, user_id: str) -> list[Beneficiary]:
        self.get_account(account_id, user_id)  # ownership check
        return self.db.query(Beneficiary).filter(
            Beneficiary.account_id == account_id,
            Beneficiary.is_active == True,
        ).all()

    def delete_beneficiary(self, beneficiary_id: str, account_id: str, user_id: str) -> None:
        self.get_account(account_id, user_id)  # ownership check
        ben = self.db.query(Beneficiary).filter(
            Beneficiary.id == beneficiary_id,
            Beneficiary.account_id == account_id,
        ).first()
        if not ben:
            raise BankingError("Beneficiary not found.")
        ben.is_active = False
        self.db.commit()

    # ── Transaction history ────────────────────────────────────────────────────

    def get_transactions(self, account_id: str, user_id: str,
                         page: int = 1, per_page: int = 20,
                         txn_type: str = "all", status: str = "all") -> dict:
        self.get_account(account_id, user_id)  # ownership check
        q = self.db.query(Transaction).filter(Transaction.account_id == account_id)
        if txn_type != "all":
            q = q.filter(Transaction.type == txn_type)
        if status != "all":
            q = q.filter(Transaction.status == status)
        total = q.count()
        txns = q.order_by(Transaction.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return {
            "transactions": [t.to_dict() for t in txns],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page,
        }

    def get_transaction_detail(self, txn_id: str, user_id: str) -> Transaction:
        txn = self.db.query(Transaction).filter(Transaction.id == txn_id).first()
        if not txn:
            raise BankingError("Transaction not found.")
        # Ownership check via account
        account = self.db.query(Account).filter(
            Account.id == txn.account_id, Account.user_id == user_id
        ).first()
        if not account:
            raise BankingError("Access denied.")
        return txn

    # ── Analytics ─────────────────────────────────────────────────────────────

    def get_analytics(self, user_id: str) -> dict:
        from sqlalchemy import func, extract
        accounts = self.get_user_accounts(user_id)
        if not accounts:
            return {}
        account_ids = [a.id for a in accounts]

        # Monthly spending (last 6 months)
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        six_months_ago = now - timedelta(days=180)

        txns = self.db.query(Transaction).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.created_at >= six_months_ago,
            Transaction.status == "completed",
        ).all()

        monthly_data: dict = {}
        category_totals: dict = {
            "Food & Groceries": 0, "Utilities": 0, "Transfer": 0,
            "Salary": 0, "Shopping": 0, "Other": 0,
        }

        for t in txns:
            month_key = t.created_at.strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {"income": 0.0, "expense": 0.0}
            if t.type in ("deposit", "transfer_in", "interest"):
                monthly_data[month_key]["income"] += t.amount
            else:
                monthly_data[month_key]["expense"] += t.amount
            # Category from description
            desc = (t.description or "").lower()
            if any(k in desc for k in ["grocer", "food", "restaurant", "swiggy", "zomato"]):
                category_totals["Food & Groceries"] += t.amount
            elif any(k in desc for k in ["electric", "gas", "water", "bill", "utility"]):
                category_totals["Utilities"] += t.amount
            elif any(k in desc for k in ["transfer"]):
                category_totals["Transfer"] += t.amount
            elif any(k in desc for k in ["salary", "income", "payroll"]):
                category_totals["Salary"] += t.amount
            elif any(k in desc for k in ["amazon", "flipkart", "shop", "purchase", "myntra"]):
                category_totals["Shopping"] += t.amount

        total_balance = sum(a.balance for a in accounts)
        all_amounts = [t.amount for t in txns if t.type not in ("deposit", "transfer_in", "interest")]

        return {
            "total_balance": round(total_balance, 2),
            "monthly_data": [
                {"month": k, "income": round(v["income"], 2), "expense": round(v["expense"], 2)}
                for k, v in sorted(monthly_data.items())
            ],
            "category_spending": [
                {"category": k, "amount": round(v, 2)}
                for k, v in category_totals.items() if v > 0
            ],
            "avg_transaction": round(sum(all_amounts) / len(all_amounts), 2) if all_amounts else 0,
            "largest_transaction": round(max(all_amounts), 2) if all_amounts else 0,
            "transaction_count": len(txns),
        }

    # ── Admin operations ───────────────────────────────────────────────────────

    def unlock_account(self, account_id: str, admin_user_id: str) -> Account:
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise BankingError("Account not found.")
        account.is_locked = False
        # Also unlock the user
        user = account.user
        if user:
            user.is_locked = False
            user.failed_login_attempts = 0
            self._notify(user.id, "Account Unlocked",
                         "Your account has been unlocked by an administrator. You can now log in.")
        log = AuditLog(
            user_id=admin_user_id,
            action="ACCOUNT_UNLOCKED",
            resource_type="account",
            resource_id=account_id,
            details={"account_number": account.account_number},
        )
        self.db.add(log)
        self.db.commit()
        return account

    # ── Private helpers ────────────────────────────────────────────────────────

    def _log(self, account: Account, txn_type: str, amount: float, description: str,
             status: str = "completed", **kwargs) -> Transaction:
        txn = Transaction(
            account_id=account.id,
            type=txn_type,
            amount=amount,
            balance_after=account.balance,
            description=description,
            status=status,
            **kwargs,
        )
        self.db.add(txn)
        return txn

    def _notify(self, user_id: str, title: str, body: str, ntype: str = "transaction") -> None:
        n = Notification(user_id=user_id, title=title, body=body, type=ntype)
        self.db.add(n)
