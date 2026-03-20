"""
Technieum Portal - Database Models
"""
import sqlite3
from datetime import datetime
from config import Config


def get_db():
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL,
            team TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS flag_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            lab TEXT NOT NULL,
            flag_value TEXT NOT NULL,
            flag_name TEXT NOT NULL,
            points INTEGER NOT NULL DEFAULT 0,
            tier TEXT NOT NULL DEFAULT 'EASY',
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, flag_value)
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            session_token TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        );
    """)

    conn.commit()
    conn.close()


def get_user_by_username(username: str):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return user


def get_user_by_id(user_id: int):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return user


def create_user(username: str, password_hash: str, display_name: str, team: str = ""):
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, display_name, team) VALUES (?, ?, ?, ?)",
            (username, password_hash, display_name, team)
        )
        conn.commit()
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        conn.close()
        return None


def submit_flag(user_id: int, flag_value: str, flag_meta: dict) -> dict:
    conn = get_db()
    try:
        conn.execute(
            """INSERT INTO flag_submissions
               (user_id, lab, flag_value, flag_name, points, tier)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                flag_meta["lab"],
                flag_value,
                flag_meta["name"],
                flag_meta["points"],
                flag_meta["tier"],
            )
        )
        conn.commit()
        conn.close()
        return {"success": True, "points": flag_meta["points"], "name": flag_meta["name"]}
    except sqlite3.IntegrityError:
        conn.close()
        return {"success": False, "error": "Flag already submitted"}
    except Exception as e:
        conn.close()
        return {"success": False, "error": str(e)}


def get_scoreboard():
    conn = get_db()
    rows = conn.execute("""
        SELECT
            u.id,
            u.display_name,
            u.username,
            u.team,
            COALESCE(SUM(f.points), 0)  AS total_points,
            COUNT(f.id)                  AS flags_captured,
            MAX(f.submitted_at)          AS last_submission
        FROM users u
        LEFT JOIN flag_submissions f ON u.id = f.user_id
        GROUP BY u.id
        ORDER BY total_points DESC, last_submission ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_user_flags(user_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM flag_submissions WHERE user_id = ? ORDER BY submitted_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_per_lab_scores(user_id: int):
    conn = get_db()
    rows = conn.execute("""
        SELECT lab, SUM(points) as points, COUNT(id) as count
        FROM flag_submissions
        WHERE user_id = ?
        GROUP BY lab
    """, (user_id,)).fetchall()
    conn.close()
    return {r["lab"]: {"points": r["points"], "count": r["count"]} for r in rows}
