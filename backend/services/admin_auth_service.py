"""
AdminAuthenticationService — Admin login
"""

import config
from utils.password_utils import PasswordUtils


class AdminAuthError(Exception):
    pass


class AdminAuthenticationService:
    """
    Validates admin credentials against config.
    The password is compared using bcrypt verify so it's not stored plaintext at runtime.
    """

    def __init__(self):
        self.pw = PasswordUtils()
        # Hash the admin password once at startup
        self._admin_password_hash = self.pw.hash_password(config.ADMIN_PASSWORD)

    def login(self, username: str, password: str) -> bool:
        if username != config.ADMIN_USERNAME:
            raise AdminAuthError("Invalid admin credentials.")
        if not self.pw.verify_password(password, self._admin_password_hash):
            raise AdminAuthError("Invalid admin credentials.")
        return True
