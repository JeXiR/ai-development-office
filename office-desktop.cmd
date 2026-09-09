@echo off
setlocal
cd /d "%~dp0"
title AI Development Office
echo Starting AI Development Office...
call npm run desktop
if errorlevel 1 (
  echo.
  echo AI Development Office failed to start.
  pause
)
