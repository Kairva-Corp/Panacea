"""
run.py — Panacea launcher
Usage: python run.py
"""

import subprocess, sys, os, webbrowser, time
from pathlib import Path

ROOT     = Path(__file__).resolve().parent
BACKEND  = ROOT / "backend" / "app.py"
FRONTEND = ROOT / "frontend" / "index.html"


def check_env():
    env_file = ROOT / ".env"
    if not env_file.exists():
        print("[ERROR] .env file not found.")
        print("  Create one at the project root with:")
        print("  ANAKIN_API_KEY=your_key_here")
        sys.exit(1)


def main():
    check_env()

    print("-" * 50)
    print("  Panacea -- The cure for your medicine bill.")
    print("-" * 50)

    print("\n[1/2] Starting backend on http://localhost:5000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, str(BACKEND)],
        cwd=str(ROOT / "backend"),
    )

    # Give Flask a moment to boot
    time.sleep(2)
    if backend_proc.poll() is not None:
        print("[ERROR] Backend failed to start. Check backend/app.py and .env.")
        sys.exit(1)

    print("[2/2] Opening frontend in browser ...")
    webbrowser.open("http://localhost:5000")

    print("\n[OK] Panacea is running.")
    print("  Backend : http://localhost:5000")
    print(f"  Frontend: {FRONTEND}")
    print("\n  Press Ctrl+C to stop.\n")

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
        backend_proc.terminate()
        try:
            backend_proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_proc.kill()
        print("Done.")
        sys.exit(0)


if __name__ == "__main__":
    main()
