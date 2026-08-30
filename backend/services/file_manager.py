"""
FileManager — CSV persistence, backup/restore, import/export
"""

import csv
import os
import shutil
from datetime import datetime
from typing import List, Dict, Optional

import config
from models.account import Account
from models.transaction import Transaction


class FileManager:

    def __init__(self):
        os.makedirs(config.DATA_DIR, exist_ok=True)
        os.makedirs(config.BACKUP_DIR, exist_ok=True)
        self._ensure_files()

    # ── Internal helpers ───────────────────────────────────────────────────────

    def _ensure_files(self):
        if not os.path.exists(config.ACCOUNTS_FILE):
            with open(config.ACCOUNTS_FILE, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(Account.csv_header())

        if not os.path.exists(config.TRANSACTIONS_FILE):
            with open(config.TRANSACTIONS_FILE, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(Transaction.csv_header())

    # ── Account counter ────────────────────────────────────────────────────────

    def get_next_account_number(self) -> int:
        if not os.path.exists(config.COUNTER_FILE):
            self._write_counter(1001)
            return 1001
        with open(config.COUNTER_FILE, "r") as f:
            return int(f.read().strip())

    def increment_counter(self):
        current = self.get_next_account_number()
        self._write_counter(current + 1)

    def _write_counter(self, value: int):
        with open(config.COUNTER_FILE, "w") as f:
            f.write(str(value))

    # ── Accounts ───────────────────────────────────────────────────────────────

    def load_accounts(self) -> List[Account]:
        accounts = []
        try:
            with open(config.ACCOUNTS_FILE, "r", newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        accounts.append(Account.from_csv_row(row))
                    except Exception:
                        continue
        except FileNotFoundError:
            pass
        return accounts

    def save_accounts(self, accounts: List[Account]):
        with open(config.ACCOUNTS_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(Account.csv_header())
            for acc in accounts:
                writer.writerow(acc.to_csv_row())

    def find_account(self, account_number: int) -> Optional[Account]:
        for acc in self.load_accounts():
            if acc.account_number == account_number:
                return acc
        return None

    def update_account(self, updated: Account):
        accounts = self.load_accounts()
        for i, acc in enumerate(accounts):
            if acc.account_number == updated.account_number:
                accounts[i] = updated
                break
        self.save_accounts(accounts)

    def add_account(self, account: Account):
        accounts = self.load_accounts()
        accounts.append(account)
        self.save_accounts(accounts)

    # ── Transactions ───────────────────────────────────────────────────────────

    def load_transactions(self) -> List[Transaction]:
        txns = []
        try:
            with open(config.TRANSACTIONS_FILE, "r", newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        txns.append(Transaction.from_csv_row(row))
                    except Exception:
                        continue
        except FileNotFoundError:
            pass
        return txns

    def save_transactions(self, transactions: List[Transaction]):
        with open(config.TRANSACTIONS_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(Transaction.csv_header())
            for txn in transactions:
                writer.writerow(txn.to_csv_row())

    def append_transaction(self, txn: Transaction):
        with open(config.TRANSACTIONS_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(txn.to_csv_row())

    def get_account_transactions(self, account_number: int) -> List[Transaction]:
        return [t for t in self.load_transactions() if t.account_number == account_number]

    # ── Backup / Restore ───────────────────────────────────────────────────────

    def backup(self) -> str:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(config.BACKUP_DIR, f"backup_{ts}")
        os.makedirs(backup_path, exist_ok=True)
        shutil.copy2(config.ACCOUNTS_FILE, os.path.join(backup_path, "accounts.csv"))
        shutil.copy2(config.TRANSACTIONS_FILE, os.path.join(backup_path, "transactions.csv"))
        if os.path.exists(config.COUNTER_FILE):
            shutil.copy2(config.COUNTER_FILE, os.path.join(backup_path, "counter.txt"))
        return backup_path

    def restore(self) -> bool:
        """Restore from the latest backup."""
        backups = self._list_backups()
        if not backups:
            return False
        latest = backups[-1]
        acc_src = os.path.join(latest, "accounts.csv")
        txn_src = os.path.join(latest, "transactions.csv")
        ctr_src = os.path.join(latest, "counter.txt")
        if os.path.exists(acc_src):
            shutil.copy2(acc_src, config.ACCOUNTS_FILE)
        if os.path.exists(txn_src):
            shutil.copy2(txn_src, config.TRANSACTIONS_FILE)
        if os.path.exists(ctr_src):
            shutil.copy2(ctr_src, config.COUNTER_FILE)
        return True

    def _list_backups(self) -> List[str]:
        if not os.path.exists(config.BACKUP_DIR):
            return []
        dirs = [
            os.path.join(config.BACKUP_DIR, d)
            for d in sorted(os.listdir(config.BACKUP_DIR))
            if os.path.isdir(os.path.join(config.BACKUP_DIR, d))
        ]
        return dirs

    def get_latest_backup_info(self) -> Optional[Dict]:
        backups = self._list_backups()
        if not backups:
            return None
        latest = os.path.basename(backups[-1])
        return {"name": latest, "count": len(backups)}

    # ── Delete All ─────────────────────────────────────────────────────────────

    def delete_all_accounts(self):
        """Auto-backup then wipe accounts and transactions."""
        self.backup()
        self.save_accounts([])
        self.save_transactions([])
        self._write_counter(1001)

    # ── Export / Import ────────────────────────────────────────────────────────

    def export_accounts_csv(self) -> str:
        """Return accounts CSV file path for download."""
        return config.ACCOUNTS_FILE

    def import_accounts_csv(self, filepath: str) -> int:
        """Import accounts from a CSV filepath. Returns count imported."""
        imported = []
        with open(filepath, "r", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    imported.append(Account.from_csv_row(row))
                except Exception:
                    continue
        self.save_accounts(imported)
        # Update counter to max account number + 1
        if imported:
            max_num = max(a.account_number for a in imported)
            self._write_counter(max_num + 1)
        return len(imported)
