"""
Admin Routes — /api/admin/*
"""

import os
import tempfile
from flask import Blueprint, request, jsonify, current_app, send_file
from services.banking_service import BankingService, BankingError
from services.authorization_service import AuthorizationService

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def get_svc():
    fm = current_app.config["FILE_MANAGER"]
    return BankingService(fm)


def get_fm():
    return current_app.config["FILE_MANAGER"]


@admin_bp.route("/accounts", methods=["GET"])
@AuthorizationService.require_admin
def all_accounts():
    status_filter = request.args.get("status", "all")
    svc = get_svc()
    if status_filter == "active":
        accounts = svc.get_active_accounts()
    elif status_filter == "inactive":
        accounts = svc.get_inactive_accounts()
    elif status_filter == "locked":
        accounts = [a for a in svc.get_all_accounts() if a.is_locked]
    else:
        accounts = svc.get_all_accounts()
    return jsonify({"accounts": [a.to_dict() for a in accounts], "count": len(accounts)}), 200


@admin_bp.route("/accounts/search", methods=["GET"])
@AuthorizationService.require_admin
def search_accounts():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"accounts": [], "count": 0}), 200
    accounts = get_svc().search_accounts(query)
    return jsonify({"accounts": [a.to_dict() for a in accounts], "count": len(accounts)}), 200


@admin_bp.route("/accounts/top", methods=["GET"])
@AuthorizationService.require_admin
def top_accounts():
    try:
        n = int(request.args.get("n", 10))
    except (ValueError, TypeError):
        n = 10
    accounts = get_svc().get_top_accounts(n)
    return jsonify({"accounts": [a.to_dict() for a in accounts]}), 200


@admin_bp.route("/report", methods=["GET"])
@AuthorizationService.require_admin
def report():
    report_data = get_svc().get_report()
    return jsonify(report_data), 200


@admin_bp.route("/transactions", methods=["GET"])
@AuthorizationService.require_admin
def all_transactions():
    op_filter = request.args.get("operation", "all")
    account_filter = request.args.get("account_number", "")
    txns = get_svc().get_all_transactions()
    if op_filter != "all":
        txns = [t for t in txns if t.operation == op_filter]
    if account_filter:
        try:
            acc_num = int(account_filter)
            txns = [t for t in txns if t.account_number == acc_num]
        except (ValueError, TypeError):
            pass
    return jsonify({"transactions": [t.to_dict() for t in txns], "count": len(txns)}), 200


@admin_bp.route("/accounts/<int:account_number>/unlock", methods=["POST"])
@AuthorizationService.require_admin
def unlock_account(account_number):
    try:
        account = get_svc().unlock_account(account_number)
        return jsonify({
            "message": f"Account {account_number} has been unlocked successfully.",
            "account": account.to_dict(),
        }), 200
    except BankingError as e:
        return jsonify({"error": str(e)}), 400


@admin_bp.route("/backup", methods=["POST"])
@AuthorizationService.require_admin
def backup():
    fm = get_fm()
    path = fm.backup()
    return jsonify({"message": "Backup created successfully.", "path": path}), 200


@admin_bp.route("/restore", methods=["POST"])
@AuthorizationService.require_admin
def restore():
    fm = get_fm()
    ok = fm.restore()
    if ok:
        return jsonify({"message": "Accounts restored from latest backup."}), 200
    return jsonify({"error": "No backup found. Please create a backup first."}), 400


@admin_bp.route("/export", methods=["GET"])
@AuthorizationService.require_admin
def export_accounts():
    fm = get_fm()
    filepath = fm.export_accounts_csv()
    if not os.path.exists(filepath):
        return jsonify({"error": "No accounts file found."}), 404
    return send_file(filepath, as_attachment=True, download_name="gdb_accounts_export.csv",
                     mimetype="text/csv")


@admin_bp.route("/import", methods=["POST"])
@AuthorizationService.require_admin
def import_accounts():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400
    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported."}), 400

    # Save to temp file
    tmp = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
    file.save(tmp.name)
    tmp.close()

    try:
        count = get_fm().import_accounts_csv(tmp.name)
        return jsonify({"message": f"Imported {count} accounts successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Import failed: {str(e)}"}), 400
    finally:
        os.unlink(tmp.name)


@admin_bp.route("/delete-all", methods=["POST"])
@AuthorizationService.require_admin
def delete_all_accounts():
    data = request.get_json() or {}
    confirm = str(data.get("confirmation", "")).strip()
    if confirm != "DELETE ALL":
        return jsonify({"error": "Confirmation text must be exactly: DELETE ALL"}), 400
    get_fm().delete_all_accounts()
    return jsonify({
        "message": "All accounts have been deleted. An automatic backup was created before deletion."
    }), 200


@admin_bp.route("/backup-info", methods=["GET"])
@AuthorizationService.require_admin
def backup_info():
    info = get_fm().get_latest_backup_info()
    if info:
        return jsonify({"available": True, "backup": info}), 200
    return jsonify({"available": False}), 200
