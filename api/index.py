import sys, os
from pathlib import Path

# Add backend directory to sys.path so app imports work
ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT / "backend"))

# Import Flask app object from backend/app.py
from app import app
