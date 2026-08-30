"""
BankingService — Core banking operations for Global Digital Bank
"""

import uuid
from datetime import date, datetime
from typing import List, Optional, Dict

import config
from models.account import Account
from models.transaction import Transaction
from services.file_manager import FileManager
from utils.password_utils import PasswordUtils


class BankingError(Exception):
    """Raised for business rule violations."""
    pass


class BankingService:

    def __init__(self, file_manager: FileManager):
        self.fm = file_manager
        self.pw = PasswordUtils()

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _new_txn_id(self) -> str:
        return str(uuid.uuid4())[:8].upper()

    def _log(self, account_number: int, operation: str, amount: float,
              balance_after: float, note: str = ""):
        txn = Transaction(
            transaction_id=self._new_txn_id(),
            account_number=account_number,
            operation=operation,
            amount=amount,
            balance_after=balance_after,
            timestamp=datetime.now().isoformat(),
            note=note,
        )
        self.fm.append_transaction(txn)
        return txn

    def _reset_daily_if_needed(self, account: Account) -> Account:
        today = date.today().isoformat()
        if account.last_withdrawal_date != today:
            account.daily_withdrawn = 0.0
            account.last_withdrawal_date = today
        return account

    def _get_min_balance(self, account_type: str) -> float:
        return (
            config.MIN_BALANCE_SAVINGS
            if account_type.lower() == "savings"
            else config.MIN_BALANCE_CURRENT
        )

    # ── Create Account ─────────────────────────────────────────────────────────

    def create_account(self, name: str, age: int, account_type: str,
                       initial_deposit: float, pin: str) -> Account:
        # Validations
        name = name.strip()
        if not name:
            raise BankingError("Name cannot be empty.")
        if age < config.MIN_AGE:
            raise BankingError(f"Minimum age to open an account is {config.MIN_AGE}.")
        if account_type not in config.ACCOUNT_TYPES:
            raise BankingError(f"Account type must be one of: {', '.join(config.ACCOUNT_TYPES)}.")
        min_bal = self._get_min_balance(account_type)
        if initial_deposit < min_bal:
            raise BankingError(
                f"Initial deposit for a {account_type} account must be at least ₹{min_bal:,.2f}."
            )
        pin = str(pin).strip()
        if not pin.isdigit() or len(pin) != 4:
            raise BankingError("PIN must be exactly 4 digits.")

        account_number = self.fm.get_next_account_number()
        pin_hash = self.pw.hash_pin(pin)

        account = Account(
            account_number=account_number,
            name=name,
            age=age,
            account_type=account_type,
            balance=initial_deposit,
            pin_hash=pin_hash,
        )
        self.fm.add_account(account)
        self.fm.increment_counter()
        self._log(account_number, "create", initial_deposit, initial_deposit,
                  f"Account created — {account_type}")
        return account

    # ── Deposit ────────────────────────────────────────────────────────────────

    def deposit(self, account_number: int, amount: float) -> Account:
        if amount <= 0:
            raise BankingError("Deposit amount must be positive.")
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        if not account.is_active():
            raise BankingError("Account is inactive. Reopen to perform transactions.")
        account.balance += amount
        self.fm.update_account(account)
        self._log(account_number, "deposit", amount, account.balance)
        return account

    # ── Withdraw ───────────────────────────────────────────────────────────────

    def withdraw(self, account_number: int, amount: float, pin: str) -> Account:
        if amount <= 0:
            raise BankingError("Withdrawal amount must be positive.")
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        if account.is_locked:
            raise BankingError("Account is locked. Contact admin to unlock.")
        if not account.is_active():
            raise BankingError("Account is inactive.")
        if not self.pw.verify_pin(pin, account.pin_hash):
            raise BankingError("Incorrect PIN.")

        account = self._reset_daily_if_needed(account)
        min_bal = self._get_min_balance(account.account_type)
        if account.balance - amount < min_bal:
            raise BankingError(
                f"Insufficient balance. Minimum required balance: ₹{min_bal:,.2f}."
            )
        remaining_daily = config.DAILY_WITHDRAWAL_LIMIT - account.daily_withdrawn
        if amount > remaining_daily:
            raise BankingError(
                f"Daily withdrawal limit exceeded. You can withdraw up to ₹{remaining_daily:,.2f} today."
            )

        account.balance -= amount
        account.daily_withdrawn += amount
        self.fm.update_account(account)
        self._log(account_number, "withdraw", amount, account.balance)
        return account

    # ── Transfer ───────────────────────────────────────────────────────────────

    def transfer(self, sender_number: int, receiver_number: int,
                 amount: float, pin: str) -> Dict:
        if sender_number == receiver_number:
            raise BankingError("Sender and receiver cannot be the same account.")
        if amount <= 0:
            raise BankingError("Transfer amount must be positive.")

        sender = self.fm.find_account(sender_number)
        receiver = self.fm.find_account(receiver_number)
        if not sender:
            raise BankingError("Sender account not found.")
        if not receiver:
            raise BankingError("Receiver account not found.")
        if sender.is_locked:
            raise BankingError("Sender account is locked. Contact admin.")
        if not sender.is_active():
            raise BankingError("Sender account is inactive.")
        if not receiver.is_active():
            raise BankingError("Receiver account is inactive.")
        if not self.pw.verify_pin(pin, sender.pin_hash):
            raise BankingError("Incorrect PIN for sender account.")

        sender = self._reset_daily_if_needed(sender)
        min_bal = self._get_min_balance(sender.account_type)
        if sender.balance - amount < min_bal:
            raise BankingError(
                f"Insufficient balance. Minimum required: ₹{min_bal:,.2f}."
            )
        remaining_daily = config.DAILY_WITHDRAWAL_LIMIT - sender.daily_withdrawn
        if amount > remaining_daily:
            raise BankingError(
                f"Daily limit exceeded. Remaining today: ₹{remaining_daily:,.2f}."
            )

        sender.balance -= amount
        sender.daily_withdrawn += amount
        receiver.balance += amount

        self.fm.update_account(sender)
        self.fm.update_account(receiver)

        note = f"Transfer to {receiver_number}"
        self._log(sender_number, "transfer_out", amount, sender.balance, note)
        note2 = f"Transfer from {sender_number}"
        self._log(receiver_number, "transfer_in", amount, receiver.balance, note2)

        return {"sender": sender, "receiver": receiver}

    # ── Balance / Account Info ─────────────────────────────────────────────────

    def get_balance(self, account_number: int) -> float:
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        return account.balance

    # ── Close / Reopen ─────────────────────────────────────────────────────────

    def close_account(self, account_number: int, pin: str) -> Account:
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        if account.is_locked:
            raise BankingError("Account is locked. Contact admin.")
        if not self.pw.verify_pin(pin, account.pin_hash):
            raise BankingError("Incorrect PIN.")
        if account.status == "inactive":
            raise BankingError("Account is already closed.")
        account.status = "inactive"
        self.fm.update_account(account)
        self._log(account_number, "close", 0.0, account.balance)
        return account

    def reopen_account(self, account_number: int, pin: str) -> Account:
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        if not self.pw.verify_pin(pin, account.pin_hash):
            raise BankingError("Incorrect PIN.")
        if account.status == "active":
            raise BankingError("Account is already active.")
        account.status = "active"
        self.fm.update_account(account)
        self._log(account_number, "reopen", 0.0, account.balance)
        return account

    # ── Rename ─────────────────────────────────────────────────────────────────

    def rename_account(self, account_number: int, new_name: str, pin: str) -> Account:
        new_name = new_name.strip()
        if not new_name:
            raise BankingError("Name cannot be empty.")
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        if account.is_locked:
            raise BankingError("Account is locked. Contact admin.")
        if not self.pw.verify_pin(pin, account.pin_hash):
            raise BankingError("Incorrect PIN.")
        old_name = account.name
        account.name = new_name
        self.fm.update_account(account)
        self._log(account_number, "rename", 0.0, account.balance,
                  f"Renamed from '{old_name}' to '{new_name}'")
        return account

    # ── Simple Interest ────────────────────────────────────────────────────────

    def calculate_simple_interest(self, account_number: int,
                                  rate: float, years: float) -> Dict:
        if rate <= 0 or rate > 100:
            raise BankingError("Interest rate must be between 0 and 100.")
        if years <= 0:
            raise BankingError("Number of years must be positive.")
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        principal = account.balance
        si = (principal * rate * years) / 100.0
        return {
            "principal": round(principal, 2),
            "rate": rate,
            "years": years,
            "simple_interest": round(si, 2),
            "final_amount": round(principal + si, 2),
        }

    # ── Transaction History ────────────────────────────────────────────────────

    def get_transactions(self, account_number: int) -> List[Transaction]:
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        txns = self.fm.get_account_transactions(account_number)
        return sorted(txns, key=lambda t: t.timestamp, reverse=True)

    # ── Admin Operations ───────────────────────────────────────────────────────

    def get_all_accounts(self) -> List[Account]:
        return self.fm.load_accounts()

    def get_active_accounts(self) -> List[Account]:
        return [a for a in self.fm.load_accounts() if a.is_active()]

    def get_inactive_accounts(self) -> List[Account]:
        return [a for a in self.fm.load_accounts() if not a.is_active()]

    def search_accounts(self, query: str) -> List[Account]:
        q = query.strip().lower()
        results = []
        for acc in self.fm.load_accounts():
            if (q in acc.name.lower() or
                    q in str(acc.account_number)):
                results.append(acc)
        return results

    def get_top_accounts(self, n: int = 10) -> List[Account]:
        accounts = self.fm.load_accounts()
        return sorted(accounts, key=lambda a: a.balance, reverse=True)[:n]

    def get_youngest_account(self) -> Optional[Account]:
        accounts = self.fm.load_accounts()
        if not accounts:
            return None
        return min(accounts, key=lambda a: a.age)

    def get_oldest_account(self) -> Optional[Account]:
        accounts = self.fm.load_accounts()
        if not accounts:
            return None
        return max(accounts, key=lambda a: a.age)

    def get_average_balance(self) -> float:
        accounts = self.fm.load_accounts()
        if not accounts:
            return 0.0
        return sum(a.balance for a in accounts) / len(accounts)

    def get_report(self) -> Dict:
        accounts = self.fm.load_accounts()
        active = [a for a in accounts if a.is_active()]
        inactive = [a for a in accounts if not a.is_active()]
        locked = [a for a in accounts if a.is_locked]
        total_balance = sum(a.balance for a in accounts)
        avg_balance = total_balance / len(accounts) if accounts else 0.0
        youngest = min(accounts, key=lambda a: a.age) if accounts else None
        oldest = max(accounts, key=lambda a: a.age) if accounts else None
        return {
            "total_accounts": len(accounts),
            "active_accounts": len(active),
            "inactive_accounts": len(inactive),
            "locked_accounts": len(locked),
            "total_balance": round(total_balance, 2),
            "average_balance": round(avg_balance, 2),
            "youngest": youngest.to_dict() if youngest else None,
            "oldest": oldest.to_dict() if oldest else None,
            "savings_count": len([a for a in accounts if a.account_type == "Savings"]),
            "current_count": len([a for a in accounts if a.account_type == "Current"]),
        }

    def unlock_account(self, account_number: int) -> Account:
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        account.is_locked = False
        account.failed_login_attempts = 0
        self.fm.update_account(account)
        return account

    def get_all_transactions(self) -> List[Transaction]:
        txns = self.fm.load_transactions()
        return sorted(txns, key=lambda t: t.timestamp, reverse=True)

    # ── Withdrawal limit info ──────────────────────────────────────────────────

    def get_withdrawal_limit_info(self, account_number: int) -> Dict:
        account = self.fm.find_account(account_number)
        if not account:
            raise BankingError("Account not found.")
        account = self._reset_daily_if_needed(account)
        self.fm.update_account(account)
        used = account.daily_withdrawn
        remaining = config.DAILY_WITHDRAWAL_LIMIT - used
        return {
            "limit": config.DAILY_WITHDRAWAL_LIMIT,
            "used": round(used, 2),
            "remaining": round(remaining, 2),
            "reset_daily": True,
        }
