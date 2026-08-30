"""
Demo Seed Script — Global Digital Bank
Creates realistic demo data for portfolio demonstration.
Run: python seed_demo.py

Creates:
- Demo customer: Alex Johnson (alex@gdb.demo)
- Realistic 6-month transaction history
- A suspicious transaction (₹85,000 CRITICAL fraud demo)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone, timedelta
import random
from sqlalchemy.orm import Session
from database import SessionLocal, create_tables
from models.user import User
from models.account import Account
from models.transaction import Transaction
from models.beneficiary import Beneficiary
from models.fraud_alert import FraudAlert
from models.notification import Notification
from models.audit_log import AuditLog
from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed():
    create_tables()
    db: Session = SessionLocal()

    try:
        # ── Check if already seeded ────────────────────────────────────────────
        existing = db.query(User).filter(User.email == "alex@gdb.demo").first()
        if existing:
            print("Demo data already exists. Skipping.")
            return

        print("Seeding demo data...")

        # ── Demo Customer ──────────────────────────────────────────────────────
        user = User(
            email="alex@gdb.demo",
            full_name="Alex Johnson",
            password_hash=pwd_ctx.hash("Demo@1234"),
            phone="+91 98765 43210",
            date_of_birth="1990-03-15",
            role="customer",
        )
        db.add(user)
        db.flush()

        account = Account(
            user_id=user.id,
            account_type="savings",
            balance=125450.00,
            pin_hash=pwd_ctx.hash("1234"),
            status="active",
        )
        db.add(account)
        db.flush()

        # ── Beneficiaries ──────────────────────────────────────────────────────
        bens = [
            Beneficiary(account_id=account.id, name="Priya Sharma", account_number="4567891230",
                        bank_name="HDFC Bank"),
            Beneficiary(account_id=account.id, name="Rahul Verma", account_number="7891234560",
                        bank_name="ICICI Bank"),
            Beneficiary(account_id=account.id, name="Tech Solutions Ltd", account_number="3456789012",
                        bank_name="SBI"),
        ]
        for b in bens:
            db.add(b)
        db.flush()

        # ── Historical transactions (6 months) ────────────────────────────────
        now = datetime.now(timezone.utc)
        balance = 125450.00

        txn_templates = [
            # type, description, amount_range, frequency_days
            ("deposit", "Monthly Salary — Tech Corp", (80000, 85000), 30),
            ("withdrawal", "ATM Withdrawal", (2000, 5000), 7),
            ("transfer_out", "Rent Payment — Priya Sharma", (18000, 20000), 30),
            ("transfer_out", "Grocery Shopping — BigBasket", (800, 2500), 5),
            ("transfer_out", "Electricity Bill — BESCOM", (1200, 2000), 30),
            ("transfer_out", "Amazon Shopping", (500, 8000), 10),
            ("transfer_out", "Swiggy Order", (200, 600), 3),
            ("transfer_out", "Netflix Subscription", (499, 499), 30),
            ("deposit", "Freelance Payment", (15000, 25000), 45),
            ("transfer_out", "Gym Membership", (1500, 1500), 30),
            ("transfer_out", "Petrol — Indian Oil", (1000, 2000), 10),
            ("transfer_out", "Medical — Apollo Pharmacy", (500, 3000), 60),
        ]

        txns_to_create = []
        for i in range(180, 0, -1):
            date = now - timedelta(days=i)
            for ttype, desc, (amin, amax), freq in txn_templates:
                if i % freq == 0 or (freq <= 5 and random.random() < 1/freq):
                    amount = round(random.uniform(amin, amax), 2)
                    if ttype in ("withdrawal", "transfer_out"):
                        if balance - amount < 5000:
                            continue
                        balance -= amount
                    else:
                        balance += amount
                    txns_to_create.append(Transaction(
                        account_id=account.id,
                        type=ttype,
                        amount=amount,
                        balance_after=balance,
                        description=desc,
                        status="completed",
                        risk_score=random.randint(0, 25),
                        risk_level="low",
                        created_at=date,
                    ))

        for t in txns_to_create:
            db.add(t)
        db.flush()

        # Update account balance
        account.balance = balance
        db.flush()

        # ── Suspicious Transaction Demo ────────────────────────────────────────
        suspicious_amount = 85000.00
        suspicious_txn = Transaction(
            account_id=account.id,
            type="transfer_out",
            amount=suspicious_amount,
            balance_after=account.balance - suspicious_amount,
            description="[DEMO] Urgent Transfer — New Account",
            counterparty_account_number="9876543210",
            counterparty_name="Unknown Recipient",
            risk_score=94,
            risk_level="critical",
            status="blocked",
            metadata_={
                "demo": True,
                "new_device": True,
                "unusual_time": True,
                "new_beneficiary": True,
                "unusual_location": True,
                "device": "Unknown Android Device",
                "location": "Hyderabad, AP (unusual — normal activity in Bengaluru)",
                "time": "02:47 AM",
            },
            created_at=now - timedelta(hours=2),
        )
        db.add(suspicious_txn)
        db.flush()

        # Fraud alert for the suspicious transaction
        fraud_alert = FraudAlert(
            transaction_id=suspicious_txn.id,
            account_id=account.id,
            risk_score=94,
            risk_level="critical",
            reasons=[
                "Transaction amount is significantly above the customer's average transaction amount.",
                "This beneficiary was recently added or is not a saved beneficiary.",
                "Transaction originated from an unrecognised device.",
                "Transaction occurred at an unusual time (between 1 AM and 5 AM).",
                "Transaction amount exceeds ₹50,000.",
                "Account has already used 82% of the daily withdrawal limit.",
            ],
            ml_score=0.87,
            rule_score=84,
            status="open",
            created_at=now - timedelta(hours=2),
        )
        db.add(fraud_alert)

        # Notifications
        notifs = [
            Notification(user_id=user.id, title="Welcome to Global Digital Bank!",
                         body="Your savings account has been opened successfully. Welcome, Alex!",
                         type="system", created_at=now - timedelta(days=180)),
            Notification(user_id=user.id, title="Salary Credited",
                         body="₹82,500.00 has been credited to your account from Tech Corp.",
                         type="transaction", created_at=now - timedelta(days=30)),
            Notification(user_id=user.id, title="⚠️ Suspicious Transaction Detected",
                         body="A transfer of ₹85,000 has been blocked. Risk Score: 94/100 (CRITICAL). Contact support if this was not you.",
                         type="fraud", is_read=False, created_at=now - timedelta(hours=2)),
            Notification(user_id=user.id, title="Transfer Blocked",
                         body="Your transfer of ₹85,000 has been blocked pending fraud review.",
                         type="security", is_read=False, created_at=now - timedelta(hours=2)),
        ]
        for n in notifs:
            db.add(n)

        # Audit logs
        logs = [
            AuditLog(user_id=user.id, action="REGISTER", resource_type="user",
                     resource_id=user.id, details={"email": user.email},
                     created_at=now - timedelta(days=180)),
            AuditLog(user_id=user.id, action="LOGIN_SUCCESS", resource_type="user",
                     resource_id=user.id, ip_address="103.21.58.x",
                     created_at=now - timedelta(hours=4)),
            AuditLog(user_id=user.id, action="LOGIN_FAILED", resource_type="user",
                     resource_id=user.id, ip_address="185.220.101.x",
                     created_at=now - timedelta(hours=3)),
            AuditLog(user_id=user.id, action="TRANSFER_CREATED", resource_type="transaction",
                     resource_id=suspicious_txn.id,
                     details={"amount": 85000, "risk_score": 94, "status": "blocked"},
                     created_at=now - timedelta(hours=2)),
            AuditLog(user_id=user.id, action="FRAUD_ALERT_CREATED", resource_type="fraud_alert",
                     resource_id=fraud_alert.id,
                     details={"risk_level": "critical", "risk_score": 94},
                     created_at=now - timedelta(hours=2)),
        ]
        for log in logs:
            db.add(log)

        # Second demo user (receiver)
        user2 = User(
            email="priya@gdb.demo",
            full_name="Priya Sharma",
            password_hash=pwd_ctx.hash("Demo@1234"),
            phone="+91 87654 32109",
            date_of_birth="1992-07-22",
            role="customer",
        )
        db.add(user2)
        db.flush()
        account2 = Account(
            user_id=user2.id,
            account_number="4567891230",
            account_type="current",
            balance=45000.00,
            pin_hash=pwd_ctx.hash("5678"),
        )
        db.add(account2)

        db.commit()
        print("✅ Demo data seeded successfully!")
        print("=" * 50)
        print("  Demo Customer Login:")
        print("  Email:    alex@gdb.demo")
        print("  Password: Demo@1234")
        print("  PIN:      1234")
        print()
        print("  Admin Login (from .env):")
        print("  Email:    admin@globaldigitalbank.com")
        print("  Password: Admin@SecurePass1")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
