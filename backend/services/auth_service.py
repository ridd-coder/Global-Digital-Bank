"""
AuthenticationService — Customer PIN-based login with lockout
"""

import config
from models.account import Account
from services.file_manager import FileManager
from utils.password_utils import PasswordUtils


class AuthenticationError(Exception):
    def __init__(self, message: str, attempts_remaining: int = None,
                 is_locked: bool = False):
        super().__init__(message)
        self.attempts_remaining = attempts_remaining
        self.is_locked = is_locked


class AuthenticationService:

    def __init__(self, file_manager: FileManager):
        self.fm = file_manager
        self.pw = PasswordUtils()

    def login(self, account_number: int, pin: str) -> Account:
        """
        Attempt customer login.
        - Returns Account on success.
        - Raises AuthenticationError on failure.
        """
        account = self.fm.find_account(account_number)
        if not account:
            raise AuthenticationError("Account not found.")

        if account.is_locked:
            raise AuthenticationError(
                "Your account is locked due to too many failed login attempts. "
                "Please contact an administrator to unlock.",
                is_locked=True,
            )

        if not account.is_active():
            raise AuthenticationError(
                "Your account is inactive. Please contact the bank."
            )

        if self.pw.verify_pin(pin, account.pin_hash):
            # Success — reset failed attempts
            if account.failed_login_attempts > 0:
                account.failed_login_attempts = 0
                self.fm.update_account(account)
            return account
        else:
            # Wrong PIN
            account.failed_login_attempts += 1
            remaining = config.MAX_FAILED_ATTEMPTS - account.failed_login_attempts

            if account.failed_login_attempts >= config.MAX_FAILED_ATTEMPTS:
                account.is_locked = True
                self.fm.update_account(account)
                raise AuthenticationError(
                    "Account locked due to too many failed login attempts. "
                    "Please contact an administrator.",
                    attempts_remaining=0,
                    is_locked=True,
                )

            self.fm.update_account(account)
            raise AuthenticationError(
                f"Invalid PIN. {remaining} attempt{'s' if remaining != 1 else ''} remaining.",
                attempts_remaining=remaining,
                is_locked=False,
            )
