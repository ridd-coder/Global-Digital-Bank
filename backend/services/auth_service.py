"""
AuthService — Registration, login, lockout, JWT issuance
Migrates the existing PIN-based lockout logic from auth_service.py into a
JWT + email/password framework. Transaction PIN security is preserved.
"""
from datetime import datetime, timezone
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import settings
from models.user import User
from models.account import Account
from models.audit_log import AuditLog
from models.notification import Notification
from services.jwt_utils import create_access_token, create_refresh_token
from schemas.auth import RegisterRequest

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthError(Exception):
    def __init__(self, message: str, attempts_remaining: int | None = None, is_locked: bool = False):
        super().__init__(message)
        self.attempts_remaining = attempts_remaining
        self.is_locked = is_locked


class AuthService:

    def __init__(self, db: Session):
        self.db = db

    # ── Password helpers ───────────────────────────────────────────────────────

    def hash_password(self, password: str) -> str:
        return pwd_ctx.hash(password)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_ctx.verify(plain, hashed)

    def hash_pin(self, pin: str) -> str:
        return pwd_ctx.hash(pin)

    def verify_pin(self, pin: str, hashed: str) -> bool:
        return pwd_ctx.verify(pin, hashed)

    # ── Registration ───────────────────────────────────────────────────────────

    def register(self, req: RegisterRequest, ip: str = "") -> dict:
        # Check email uniqueness
        existing = self.db.query(User).filter(User.email == req.email).first()
        if existing:
            raise AuthError("An account with this email already exists.")

        # Validate age
        if req.date_of_birth:
            from datetime import date
            try:
                dob = date.fromisoformat(req.date_of_birth)
                age = (date.today() - dob).days // 365
                if age < settings.MIN_AGE:
                    raise AuthError(f"Minimum age to open an account is {settings.MIN_AGE} years.")
            except ValueError:
                raise AuthError("Invalid date of birth format. Use YYYY-MM-DD.")

        # Validate initial deposit
        min_deposit = (
            settings.MIN_BALANCE_SAVINGS
            if req.account_type == "savings"
            else settings.MIN_BALANCE_CURRENT
        )
        if req.initial_deposit < min_deposit:
            raise AuthError(
                f"Minimum initial deposit for a {req.account_type} account is ₹{min_deposit:,.0f}."
            )

        # Create user
        user = User(
            email=req.email,
            full_name=req.full_name,
            password_hash=self.hash_password(req.password),
            phone=req.phone,
            date_of_birth=req.date_of_birth,
            role="customer",
        )
        self.db.add(user)
        self.db.flush()  # get user.id

        # Create account
        account = Account(
            user_id=user.id,
            account_type=req.account_type,
            balance=req.initial_deposit,
            pin_hash=self.hash_pin(req.pin),
        )
        self.db.add(account)

        # Welcome notification
        notif = Notification(
            user_id=user.id,
            title="Welcome to Global Digital Bank!",
            body=f"Your {req.account_type} account has been opened with ₹{req.initial_deposit:,.2f}.",
            type="system",
        )
        self.db.add(notif)

        # Audit log
        self._audit(user.id, "REGISTER", "user", user.id, {"email": req.email}, ip)

        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(account)

        tokens = self._issue_tokens(user)
        return {"user": user.to_dict(), "account": account.to_dict(), **tokens}

    # ── Login ──────────────────────────────────────────────────────────────────

    def login(self, email: str, password: str, ip: str = "") -> dict:
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            raise AuthError("Invalid email or password.")

        if user.is_locked:
            raise AuthError(
                "Your account is locked due to multiple failed login attempts. "
                "Please contact support.",
                is_locked=True,
            )

        if not user.is_active:
            raise AuthError("Your account is deactivated. Please contact support.")

        if not self.verify_password(password, user.password_hash):
            user.failed_login_attempts += 1
            remaining = settings.MAX_FAILED_ATTEMPTS - user.failed_login_attempts

            if user.failed_login_attempts >= settings.MAX_FAILED_ATTEMPTS:
                user.is_locked = True
                user.locked_at = datetime.now(timezone.utc)
                # Notify
                notif = Notification(
                    user_id=user.id,
                    title="Account Locked",
                    body="Your account has been locked after multiple failed login attempts. Contact support.",
                    type="security",
                )
                self.db.add(notif)
                self._audit(user.id, "ACCOUNT_LOCKED", "user", user.id, {"reason": "max_failed_attempts"}, ip)
                self.db.commit()
                raise AuthError(
                    "Account locked after too many failed attempts. Please contact support.",
                    attempts_remaining=0,
                    is_locked=True,
                )

            self._audit(user.id, "LOGIN_FAILED", "user", user.id, {"attempts": user.failed_login_attempts}, ip)
            self.db.commit()
            raise AuthError(
                f"Invalid password. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
                attempts_remaining=remaining,
            )

        # Success
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
        user.last_login_at = datetime.now(timezone.utc)
        self._audit(user.id, "LOGIN_SUCCESS", "user", user.id, {}, ip)
        self.db.commit()
        self.db.refresh(user)

        # Get accounts
        accounts = self.db.query(Account).filter(Account.user_id == user.id).all()
        tokens = self._issue_tokens(user)
        return {
            "user": user.to_dict(),
            "accounts": [a.to_dict() for a in accounts],
            **tokens,
        }

    # ── Admin login ────────────────────────────────────────────────────────────

    def admin_login(self, email: str, password: str, ip: str = "") -> dict:
        if email != settings.ADMIN_EMAIL or password != settings.ADMIN_PASSWORD:
            raise AuthError("Invalid admin credentials.")
        # Return a synthetic admin token
        token_data = {"sub": "admin", "role": "admin", "email": email}
        access = create_access_token(token_data)
        refresh = create_refresh_token(token_data)
        return {
            "user": {"id": "admin", "email": email, "role": "admin", "full_name": "Administrator"},
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
        }

    # ── Change PIN ─────────────────────────────────────────────────────────────

    def change_pin(self, account_id: str, current_pin: str, new_pin: str) -> None:
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise AuthError("Account not found.")
        if not self.verify_pin(current_pin, account.pin_hash):
            raise AuthError("Current PIN is incorrect.")
        account.pin_hash = self.hash_pin(new_pin)
        self.db.commit()

    # ── Change password ────────────────────────────────────────────────────────

    def change_password(self, user_id: str, current_password: str, new_password: str, ip: str = "") -> None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise AuthError("User not found.")
        if not self.verify_password(current_password, user.password_hash):
            raise AuthError("Current password is incorrect.")
        user.password_hash = self.hash_password(new_password)
        self._audit(user_id, "PASSWORD_CHANGED", "user", user_id, {}, ip)
        self.db.commit()

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _issue_tokens(self, user: User) -> dict:
        token_data = {"sub": user.id, "role": user.role, "email": user.email}
        return {
            "access_token": create_access_token(token_data),
            "refresh_token": create_refresh_token(token_data),
            "token_type": "bearer",
        }

    def _audit(self, user_id: str, action: str, resource_type: str,
               resource_id: str, details: dict, ip: str = ""):
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip,
        )
        self.db.add(log)
