@echo off
title PromptMate Launcher
echo ====================================================
echo      Starting PromptMate (Backend + Frontend)
echo ====================================================

:: 1. Check/copy backend .env
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [INFO] Creating backend\.env from .env.example...
        copy "backend\.env.example" "backend\.env" >nul
        echo [NOTE] Remember to add your OPENAI_API_KEY into backend\.env!
    )
)

:: 2. Launch Backend in a new window
echo [INFO] Launching FastAPI Backend on http://localhost:8000...
start "PromptMate - Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"

:: 3. Launch Frontend in a new window
echo [INFO] Launching Vite Frontend on http://localhost:3000...
start "PromptMate - Frontend" cmd /k "cd frontend && (if not exist node_modules npm install) && npm run dev"

echo ====================================================
echo Both servers have been launched in separate windows!
echo - Backend:  http://localhost:8000
echo - Frontend: http://localhost:3000
echo ====================================================
timeout /t 5
