"""
Technieum AI Security Labs - Unified Portal
Single entry point for all three labs with login, scoreboard, and flag submission.
"""
import os
from datetime import datetime
from functools import wraps

from flask import (
    Flask, request, jsonify, render_template,
    session, redirect, url_for, flash
)
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from models import (
    init_db, get_user_by_username, get_user_by_id,
    create_user, submit_flag, get_scoreboard,
    get_user_flags, get_per_lab_scores
)

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY
_localhost_origins = [
    "http://localhost:5000", "http://localhost:3000", "http://localhost:8080",
    "http://localhost:8000", "http://localhost:3100", "http://localhost:8090",
    "http://localhost:9000", "http://localhost:3200", "http://localhost:8100",
    "http://localhost:5555",
]
_public_base = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
if _public_base:
    for _port in [5000, 3000, 8080, 8000, 3100, 8090, 9000, 3200, 8100, 5555, 3001]:
        _localhost_origins.append(f"{_public_base}:{_port}")
CORS(app, origins=_localhost_origins)


# ─── Auth helper ──────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("login"))
        # Verify user still exists in DB (handles stale sessions after DB reset)
        if get_user_by_id(session["user_id"]) is None:
            session.clear()
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def get_current_user():
    if "user_id" not in session:
        return None
    return get_user_by_id(session["user_id"])


# ─── Pages ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
        return redirect(url_for("dashboard"))

    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if not username or not password:
            error = "Username and password are required."
        else:
            user = get_user_by_username(username)
            if user and check_password_hash(user["password_hash"], password):
                session.permanent = True
                session["user_id"] = user["id"]
                session["username"] = user["username"]
                session["display_name"] = user["display_name"]
                return redirect(url_for("dashboard"))
            else:
                error = "Invalid username or password."

    return render_template("login.html", error=error)


@app.route("/register", methods=["GET", "POST"])
def register():
    if "user_id" in session:
        return redirect(url_for("dashboard"))

    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        display_name = request.form.get("display_name", "").strip()
        team = request.form.get("team", "").strip()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm_password", "")

        if not username or not display_name or not password:
            error = "All fields are required."
        elif len(username) < 3:
            error = "Username must be at least 3 characters."
        elif len(password) < 6:
            error = "Password must be at least 6 characters."
        elif password != confirm:
            error = "Passwords do not match."
        else:
            password_hash = generate_password_hash(password)
            user_id = create_user(username, password_hash, display_name, team)
            if user_id:
                session.permanent = True
                session["user_id"] = user_id
                session["username"] = username
                session["display_name"] = display_name
                return redirect(url_for("dashboard"))
            else:
                error = "Username already taken. Choose another."

    return render_template("register.html", error=error)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    user = get_current_user()
    per_lab = get_per_lab_scores(user["id"])
    scoreboard = get_scoreboard()

    # Find user rank
    rank = next((i + 1 for i, s in enumerate(scoreboard) if s["id"] == user["id"]), "-")

    # Merge configured lab URLs into lab_meta so templates use the correct host
    lab_urls = {
        "lab1": Config.LAB1_URL,
        "lab2": Config.LAB2_URL,
        "lab3": Config.LAB3_URL,
        "lab4": Config.LAB4_URL,
        "lab5": Config.LAB5_URL,
    }
    lab_meta = {
        lab_id: {**meta, "url": lab_urls.get(lab_id, f"http://localhost:{meta['port']}")}
        for lab_id, meta in Config.LAB_META.items()
    }

    return render_template(
        "dashboard.html",
        user=user,
        per_lab=per_lab,
        lab_meta=lab_meta,
        rank=rank,
        total_players=len(scoreboard)
    )


@app.route("/scoreboard")
@login_required
def scoreboard():
    user = get_current_user()
    board = get_scoreboard()
    user_flags = get_user_flags(user["id"])

    # Annotate with rank
    for i, entry in enumerate(board):
        entry["rank"] = i + 1
        entry["is_current"] = entry["id"] == user["id"]

    return render_template(
        "scoreboard.html",
        user=user,
        board=board,
        user_flags=user_flags,
        lab_meta=Config.LAB_META
    )


# ─── API ──────────────────────────────────────────────────────────────────────

@app.route("/api/submit-flag", methods=["POST"])
@login_required
def api_submit_flag():
    user = get_current_user()
    data = request.json or {}
    flag_value = data.get("flag", "").strip()

    if not flag_value:
        return jsonify({"success": False, "error": "No flag provided"}), 400

    flag_meta = Config.FLAGS.get(flag_value)
    if not flag_meta:
        return jsonify({"success": False, "error": "Invalid flag"}), 400

    result = submit_flag(user["id"], flag_value, flag_meta)
    return jsonify(result)


@app.route("/api/scores")
def api_scores():
    """Public scoreboard endpoint - auto-refreshed by scoreboard page."""
    board = get_scoreboard()
    return jsonify({"scoreboard": board, "timestamp": datetime.utcnow().isoformat()})


@app.route("/api/my-flags")
@login_required
def api_my_flags():
    user = get_current_user()
    flags = get_user_flags(user["id"])
    return jsonify({"flags": flags})


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "technieum-portal"})


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("=" * 62)
    print("  TECHNIEUM AI SECURITY RESEARCH LABS - Unified Portal")
    print("=" * 62)
    print(f"  Portal:  http://localhost:{Config.PORT}")
    print(f"  LAB-1:   {Config.LAB1_URL}")
    print(f"  LAB-2:   {Config.LAB2_URL}")
    print(f"  LAB-3:   {Config.LAB3_URL}")
    print(f"  LAB-4:   {Config.LAB4_URL}")
    print(f"  LAB-5:   {Config.LAB5_URL}")
    print()
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
