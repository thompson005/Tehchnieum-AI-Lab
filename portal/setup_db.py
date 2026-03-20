"""
Initialize the Technieum portal database.
Run once before starting the portal for the first time.
"""
from models import init_db

if __name__ == "__main__":
    init_db()
    print("[✓] Portal database initialized successfully.")
    print("    Start the portal with: python app.py")
