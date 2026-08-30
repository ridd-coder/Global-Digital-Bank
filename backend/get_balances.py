import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models.account import Account
from models.user import User
db = SessionLocal()
for u, a in db.query(User, Account).join(Account).all():
    print(f"User: {u.email}, Account: {a.account_number}, Balance: {a.balance}")
