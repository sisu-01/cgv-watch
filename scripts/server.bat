@echo off
setlocal
cd /d "%~dp0"

call npm run ws:server
set "EXIT_CODE=%ERRORLEVEL%"

endlocal & exit /b %EXIT_CODE%