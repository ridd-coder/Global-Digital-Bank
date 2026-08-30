import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
from models.account import Account
db = SessionLocal()
account = db.query(Account).first()
print(f"Balance: {account.balance}")
