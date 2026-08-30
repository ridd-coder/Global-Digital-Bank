"""
PasswordUtils — PIN hashing and verification using bcrypt
"""

import bcrypt


class PasswordUtils:

    @staticmethod
    def hash_pin(pin: str) -> str:
        """Hash a 4-digit PIN using bcrypt. Returns hash string."""
        if not isinstance(pin, str):
            pin = str(pin)
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(pin.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_pin(pin: str, pin_hash: str) -> bool:
        """Verify a PIN against its stored bcrypt hash."""
        if not isinstance(pin, str):
            pin = str(pin)
        try:
            return bcrypt.checkpw(pin.encode("utf-8"), pin_hash.encode("utf-8"))
        except Exception:
            return False

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash an admin password using bcrypt."""
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify an admin password against its stored bcrypt hash."""
        try:
            return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
        except Exception:
            return False
