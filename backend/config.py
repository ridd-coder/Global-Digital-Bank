"""
Global Digital Bank - Configuration
"""

import os

# ─── Banking Rules ────────────────────────────────────────────────────────────
MIN_AGE = 18
MIN_BALANCE_SAVINGS = 1000.0
MIN_BALANCE_CURRENT = 5000.0
DAILY_WITHDRAWAL_LIMIT = 50000.0
MAX_FAILED_ATTEMPTS = 3
INTEREST_RATE_DEFAULT = 4.0  # percent per annum

ACCOUNT_TYPES = ["Savings", "Current"]

# ─── Admin Credentials ────────────────────────────────────────────────────────
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"   # Will be hashed at runtime in AdminAuthService

# ─── File Paths ───────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
ACCOUNTS_FILE = os.path.join(DATA_DIR, "accounts.csv")
TRANSACTIONS_FILE = os.path.join(DATA_DIR, "transactions.csv")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")
COUNTER_FILE = os.path.join(DATA_DIR, "counter.txt")
SESSION_DIR = os.path.join(BASE_DIR, "flask_session")

# ─── Flask ────────────────────────────────────────────────────────────────────
SECRET_KEY = "gdb-super-secret-key-2024-change-in-production"
SESSION_TYPE = "filesystem"
SESSION_FILE_DIR = SESSION_DIR
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]
BACKEND_PORT = 5001
