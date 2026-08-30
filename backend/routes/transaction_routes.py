"""
Transaction Routes — /api/transfer, /api/accounts/:num/transactions
"""

from flask import Blueprint, request, jsonify, current_app, session
from services.banking_service import BankingService, BankingError
from services.authorization_service import AuthorizationService

transaction_bp = Blueprint("transactions", __name__, url_prefix="/api")

def get_svc():
    fm = current_app.config["FILE_MANAGER"]
    return BankingService(fm)


@transaction_bp.route("/transfer", methods=["POST"])
@AuthorizationService.require_customer
def transfer():
    data = request.get_json() or {}
    try:
        sender_number = int(data.get("sender_account_number"))
        receiver_number = int(data.get("receiver_account_number"))
        amount = float(data.get("amount", 0))
        pin = str(data.get("pin", "")).strip()
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input: {e}"}), 400

    # Customer can only transfer from their own account
    if session.get("role") == "customer":
        if sender_number != session.get("account_number"):
            return jsonify({"error": "You can only transfer from your own account."}), 403

    try:
        result = get_svc().transfer(sender_number, receiver_number, amount, pin)
        return jsonify({
            "message": f"₹{amount:,.2f} transferred successfully.",
            "sender": result["sender"].to_dict(),
            "receiver": result["receiver"].to_dict(),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@transaction_bp.route("/accounts/<int:account_number>/transactions", methods=["GET"])
@AuthorizationService.require_own_account
def get_transactions(account_number):
    op_filter = request.args.get("operation", "all")
    try:
        txns = get_svc().get_transactions(account_number)
        if op_filter != "all":
            txns = [t for t in txns if t.operation == op_filter]
        return jsonify({
            "transactions": [t.to_dict() for t in txns],
            "count": len(txns),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400
