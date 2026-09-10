import os
import sys
import shutil
import signal
import subprocess
import threading
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

# Ensure UTF-8 output on Windows if supported
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def print_banner():
    print("=" * 60)
    print("  >> PromptMate - Full-Stack Runner (Backend + Frontend)")
    print("=" * 60)

def find_python_executable():
    """Finds the python executable (uses current system python)."""
    return sys.executable

def ensure_backend_env():
    """Ensures backend/.env exists."""
    env_file = BACKEND_DIR / ".env"
    env_example = BACKEND_DIR / ".env.example"
    if not env_file.exists():
        if env_example.exists():
            shutil.copy(env_example, env_file)
            print("[INFO] Created 'backend/.env' from '.env.example'.")
            print("[NOTE] Remember to add your OPENAI_API_KEY into 'backend/.env'!")
        else:
            print("[WARN] Neither backend/.env nor .env.example found.")

def check_and_install_dependencies(py_exe):
    """Checks if essential backend and frontend dependencies exist, prompts or installs them."""
    # Check backend dependencies
    test_cmd = [py_exe, "-c", "import openai, fastapi, uvicorn"]
    res = subprocess.run(test_cmd, capture_output=True)
    if res.returncode != 0:
        print("[INFO] Installing missing backend dependencies from requirements.txt...")
        req_file = BACKEND_DIR / "requirements.txt"
        if req_file.exists():
            install_cmd = [py_exe, "-m", "pip", "install", "-r", str(req_file)]
            subprocess.run(install_cmd, check=True)
            print("[SUCCESS] Backend dependencies installed successfully.")

    # Check frontend dependencies
    node_modules = FRONTEND_DIR / "node_modules"
    if not node_modules.exists():
        print("[INFO] Installing frontend dependencies (npm install)...")
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, check=True)
        print("[SUCCESS] Frontend dependencies installed successfully.")

def stream_output(pipe, prefix, color_code):
    """Streams process pipe output to console with colored prefix."""
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            # ANSI color codes: 36 = cyan, 32 = green, 33 = yellow, 35 = magenta
            print(f"\033[{color_code}m[{prefix}]\033[0m {line.rstrip()}", flush=True)
    except Exception:
        pass
    finally:
        pipe.close()

def kill_process_tree(proc):
    """Terminates process and all child processes cleanly."""
    if proc is None:
        return
    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            proc.terminate()
    except Exception:
        pass

def main():
    print_banner()

    # 1. Setup environment
    ensure_backend_env()
    py_exe = find_python_executable()

    # 2. Check dependencies
    try:
        check_and_install_dependencies(py_exe)
    except Exception as e:
        print(f"[ERROR] Dependency installation encountered an issue: {e}")
        print("You can install them manually using:")
        print("  cd backend && pip install -r requirements.txt")
        print("  cd frontend && npm install")

    # 3. Start Backend & Frontend processes
    backend_proc = None
    frontend_proc = None

    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    backend_cmd = [py_exe, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"]
    frontend_cmd = [npm_cmd, "run", "dev"]

    print("\n[STARTING] Launching servers...")
    print("  * Backend:  http://localhost:8000 (API Docs at http://localhost:8000/docs)")
    print("  * Frontend: http://localhost:3000")
    print("  * Press Ctrl+C to stop both.\n")

    try:
        # Launch backend
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=BACKEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        # Launch frontend
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=FRONTEND_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        # Start streaming threads
        t_backend = threading.Thread(
            target=stream_output,
            args=(backend_proc.stdout, "BACKEND", "36"),  # Cyan
            daemon=True,
        )
        t_frontend = threading.Thread(
            target=stream_output,
            args=(frontend_proc.stdout, "FRONTEND", "32"),  # Green
            daemon=True,
        )

        t_backend.start()
        t_frontend.start()

        # Wait for processes
        while backend_proc.poll() is None and frontend_proc.poll() is None:
            threading.Event().wait(1)

    except KeyboardInterrupt:
        print("\n[SHUTDOWN] Stopping both servers...")
    finally:
        kill_process_tree(backend_proc)
        kill_process_tree(frontend_proc)
        print("[SHUTDOWN] Both servers stopped. Goodbye!")

if __name__ == "__main__":
    main()
