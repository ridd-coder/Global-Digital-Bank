import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models.account import Account
from models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == "riddhimandutta0@gmail.com").first()
if user:
    account = db.query(Account).filter(Account.user_id == user.id).first()
    if account:
        account.balance += 500000.0  # Add 5 Lakhs
        db.commit()
        print(f"Success! New balance for {user.email} is {account.balance}")
