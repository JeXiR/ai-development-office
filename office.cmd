@echo off
setlocal
cd /d "%~dp0"
if not exist ".env.local" (
  echo [AI Development Office] .env.local not found.
)
if not exist "node_modules" (
  echo [AI Development Office] Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
start "AI Development Office Bridge" cmd /k "cd /d ""%~dp0"" && npm run bridge"
timeout /t 2 /nobreak >nul
start "AI Development Office Web" cmd /k "cd /d ""%~dp0"" && npm run dev"
timeout /t 2 /nobreak >nul
start "" http://localhost:3000
endlocal
