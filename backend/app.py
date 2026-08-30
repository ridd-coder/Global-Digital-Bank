"""
Global Digital Bank — Flask Application Entry Point
"""

import os
import sys

# Ensure the backend directory is in the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import timedelta
from flask import Flask, jsonify
from flask_cors import CORS
from flask_session import Session

import config
from services.file_manager import FileManager
from routes.auth_routes import auth_bp
from routes.account_routes import account_bp
from routes.transaction_routes import transaction_bp
from routes.admin_routes import admin_bp


def create_app():
    app = Flask(__name__)

    # ── Configuration ──────────────────────────────────────────────────────────
    app.config["SECRET_KEY"] = config.SECRET_KEY
    app.config["SESSION_TYPE"] = "filesystem"
    app.config["SESSION_FILE_DIR"] = config.SESSION_DIR
    app.config["SESSION_PERMANENT"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=8)
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_SECURE"] = False   # True in production with HTTPS
    app.config["SESSION_COOKIE_HTTPONLY"] = True

    # ── Sessions ───────────────────────────────────────────────────────────────
    os.makedirs(config.SESSION_DIR, exist_ok=True)
    Session(app)

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS(app, origins=config.CORS_ORIGINS, supports_credentials=True)

    # ── Services ───────────────────────────────────────────────────────────────
    fm = FileManager()
    app.config["FILE_MANAGER"] = fm

    # ── Blueprints ─────────────────────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(transaction_bp)
    app.register_blueprint(admin_bp)

    # ── Health check ───────────────────────────────────────────────────────────
    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "ok",
            "service": "Global Digital Bank API",
            "version": "1.0.0",
        }), 200

    # ── 404 / 500 handlers ─────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found."}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "An internal server error occurred. Please try again."}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    print("=" * 50)
    print(" Global Digital Bank — Backend API")
    print(" Running on http://localhost:5001")
    print(" Admin credentials: admin / admin123")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5001, debug=True)
