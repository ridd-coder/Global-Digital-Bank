"""
AuthorizationService — Route guards / decorators
"""

from functools import wraps
from flask import session, jsonify


class AuthorizationService:

    @staticmethod
    def require_customer(f):
        """Decorator: requires customer session."""
        @wraps(f)
        def decorated(*args, **kwargs):
            if session.get("role") != "customer":
                return jsonify({"error": "Authentication required. Please log in."}), 401
            return f(*args, **kwargs)
        return decorated

    @staticmethod
    def require_admin(f):
        """Decorator: requires admin session."""
        @wraps(f)
        def decorated(*args, **kwargs):
            if session.get("role") != "admin":
                return jsonify({"error": "Administrator privileges required."}), 403
            return f(*args, **kwargs)
        return decorated

    @staticmethod
    def require_own_account(f):
        """
        Decorator: customer can only access their own account.
        Expects route param `account_number`.
        """
        @wraps(f)
        def decorated(*args, **kwargs):
            if session.get("role") == "admin":
                return f(*args, **kwargs)
            if session.get("role") != "customer":
                return jsonify({"error": "Authentication required."}), 401
            account_number = kwargs.get("account_number")
            if account_number is None:
                return f(*args, **kwargs)
            if int(account_number) != int(session.get("account_number", -1)):
                return jsonify({"error": "Access denied. You can only access your own account."}), 403
            return f(*args, **kwargs)
        return decorated
