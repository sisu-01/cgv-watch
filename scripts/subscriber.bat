@echo off
setlocal
cd /d "%~dp0"

set "CLIENT_NUMBER=%~1"

if "%CLIENT_NUMBER%"=="" (
    set /p "CLIENT_NUMBER=Enter subscriber number: "
)

if "%CLIENT_NUMBER%"=="" (
    echo Error: Subscriber number is required.
    exit /b 1
)

echo.
echo Starting subscriber %CLIENT_NUMBER%...
echo.

call npm run ws:subscriber -- %CLIENT_NUMBER%
set "EXIT_CODE=%ERRORLEVEL%"

endlocal & exit /b %EXIT_CODE%