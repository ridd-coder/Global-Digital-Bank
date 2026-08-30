"""
Auth Routes — /api/auth/*
"""

from flask import Blueprint, request, jsonify, session
from services.auth_service import AuthenticationService, AuthenticationError
from services.admin_auth_service import AdminAuthenticationService, AdminAuthError

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def make_auth_services(app):
    fm = app.config["FILE_MANAGER"]
    return AuthenticationService(fm), AdminAuthenticationService()


@auth_bp.route("/customer-login", methods=["POST"])
def customer_login():
    data = request.get_json() or {}
    account_number = data.get("account_number")
    pin = str(data.get("pin", "")).strip()

    if not account_number or not pin:
        return jsonify({"error": "Account number and PIN are required."}), 400

    try:
        account_number = int(account_number)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid account number."}), 400

    from flask import current_app
    fm = current_app.config["FILE_MANAGER"]
    auth_svc = AuthenticationService(fm)

    try:
        account = auth_svc.login(account_number, pin)
        session.clear()
        session["role"] = "customer"
        session["account_number"] = account.account_number
        session.permanent = True
        return jsonify({
            "message": "Login successful.",
            "account": account.to_dict(),
        }), 200
    except AuthenticationError as e:
        return jsonify({
            "error": str(e),
            "attempts_remaining": e.attempts_remaining,
            "is_locked": e.is_locked,
        }), 401


@auth_bp.route("/admin-login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", "")).strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    admin_svc = AdminAuthenticationService()
    try:
        admin_svc.login(username, password)
        session.clear()
        session["role"] = "admin"
        session["username"] = username
        session.permanent = True
        return jsonify({"message": "Admin login successful."}), 200
    except AdminAuthError as e:
        return jsonify({"error": str(e)}), 401


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    role = session.get("role")
    if not role:
        return jsonify({"authenticated": False}), 200
    if role == "customer":
        from flask import current_app
        fm = current_app.config["FILE_MANAGER"]
        account = fm.find_account(session["account_number"])
        if not account:
            session.clear()
            return jsonify({"authenticated": False}), 200
        return jsonify({
            "authenticated": True,
            "role": "customer",
            "account": account.to_dict(),
        }), 200
    elif role == "admin":
        return jsonify({
            "authenticated": True,
            "role": "admin",
            "username": session.get("username"),
        }), 200
    return jsonify({"authenticated": False}), 200
