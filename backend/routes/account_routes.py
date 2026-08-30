"""
Account Routes — /api/accounts/*
"""

from flask import Blueprint, request, jsonify, current_app, session
from services.banking_service import BankingService, BankingError
from services.authorization_service import AuthorizationService

account_bp = Blueprint("accounts", __name__, url_prefix="/api/accounts")

def get_svc():
    fm = current_app.config["FILE_MANAGER"]
    return BankingService(fm)


@account_bp.route("", methods=["POST"])
def create_account():
    data = request.get_json() or {}
    try:
        name = str(data.get("name", "")).strip()
        age = int(data.get("age", 0))
        account_type = str(data.get("account_type", "")).strip()
        initial_deposit = float(data.get("initial_deposit", 0))
        pin = str(data.get("pin", "")).strip()
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input: {e}"}), 400

    try:
        account = get_svc().create_account(name, age, account_type, initial_deposit, pin)
        return jsonify({
            "message": "Account created successfully.",
            "account": account.to_dict(),
        }), 201
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@account_bp.route("/<int:account_number>", methods=["GET"])
@AuthorizationService.require_own_account
def get_account(account_number):
    fm = current_app.config["FILE_MANAGER"]
    account = fm.find_account(account_number)
    if not account:
        return jsonify({"error": "Account not found."}), 404
    return jsonify({"account": account.to_dict()}), 200


@account_bp.route("/<int:account_number>/deposit", methods=["POST"])
@AuthorizationService.require_own_account
def deposit(account_number):
    data = request.get_json() or {}
    try:
        amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount."}), 400

    try:
        account = get_svc().deposit(account_number, amount)
        return jsonify({
            "message": f"₹{amount:,.2f} deposited successfully.",
            "account": account.to_dict(),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@account_bp.route("/<int:account_number>/withdraw", methods=["POST"])
@AuthorizationService.require_own_account
def withdraw(account_number):
    data = request.get_json() or {}
    try:
        amount = float(data.get("amount", 0))
        pin = str(data.get("pin", "")).strip()
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid input."}), 400

    try:
        account = get_svc().withdraw(account_number, amount, pin)
        return jsonify({
            "message": f"₹{amount:,.2f} withdrawn successfully.",
            "account": account.to_dict(),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@account_bp.route("/<int:account_number>/close", methods=["POST"])
@AuthorizationService.require_own_account
def close_account(account_number):
    data = request.get_json() or {}
    pin = str(data.get("pin", "")).strip()
    try:
        account = get_svc().close_account(account_number, pin)
        return jsonify({
            "message": "Account closed successfully.",
            "account": account.to_dict(),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@account_bp.route("/<int:account_number>/reopen", methods=["POST"])
@AuthorizationService.require_own_account
def reopen_account(account_number):
    data = request.get_json() or {}
    pin = str(data.get("pin", "")).strip()
    try:
        account = get_svc().reopen_account(account_number, pin)
        return jsonify({
            "message": "Account reopened successfully.",
            "account": account.to_dict(),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@account_bp.route("/<int:account_number>/name", methods=["PUT"])
@AuthorizationService.require_own_account
def rename_account(account_number):
    data = request.get_json() or {}
    new_name = str(data.get("name", "")).strip()
    pin = str(data.get("pin", "")).strip()
    try:
        account = get_svc().rename_account(account_number, new_name, pin)
        return jsonify({
            "message": "Account renamed successfully.",
            "account": account.to_dict(),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@account_bp.route("/<int:account_number>/interest", methods=["GET"])
@AuthorizationService.require_own_account
def simple_interest(account_number):
    try:
        rate = float(request.args.get("rate", 4.0))
        years = float(request.args.get("years", 1.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid rate or years."}), 400
    try:
        result = get_svc().calculate_simple_interest(account_number, rate, years)
        return jsonify(result), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@account_bp.route("/<int:account_number>/withdrawal-limit", methods=["GET"])
@AuthorizationService.require_own_account
def withdrawal_limit(account_number):
    try:
        result = get_svc().get_withdrawal_limit_info(account_number)
        return jsonify(result), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400
