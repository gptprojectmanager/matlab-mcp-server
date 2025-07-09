@echo off
echo =========================================
echo MATLAB MCP Server - Service Installer
echo =========================================
echo.

:: Check admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges
    echo Please run as Administrator
    pause
    exit /b 1
)

echo [INFO] Running with Administrator privileges

:: Auto-detect MATLAB installation
echo [INFO] Searching for MATLAB installation...

set "MATLAB_PATH="

:: Check E:\MATLAB\bin\matlab.exe first (your case)
if exist "E:\MATLAB\bin\matlab.exe" (
    set "MATLAB_PATH=E:\MATLAB\bin\matlab.exe"
    echo [FOUND] MATLAB at: E:\MATLAB\bin\matlab.exe
    goto :matlab_found
)

:: Try Program Files
for /d %%i in ("C:\Program Files\MATLAB\R*") do (
    if exist "%%i\bin\matlab.exe" (
        set "MATLAB_PATH=%%i\bin\matlab.exe"
        echo [FOUND] MATLAB at: %%i\bin\matlab.exe
        goto :matlab_found
    )
)

:: Manual input if not found
:matlab_not_found
echo [WARNING] MATLAB not found automatically
set /p "MATLAB_PATH=Enter full path to matlab.exe: "
if not exist "%MATLAB_PATH%" (
    echo [ERROR] File not found: %MATLAB_PATH%
    goto :matlab_not_found
)

:matlab_found
echo [SUCCESS] MATLAB Path: %MATLAB_PATH%

:: Check if server directory exists
if not exist "build\index.js" (
    echo [ERROR] MATLAB MCP Server not found in current directory
    echo Please run this script from the matlab-mcp-server directory
    pause
    exit /b 1
)

:: Simple node start without NSSM for now
echo [INFO] Starting MATLAB MCP Server...
echo [INFO] MATLAB Path: %MATLAB_PATH%
echo [INFO] Server will run on port 3000
echo [INFO] Press Ctrl+C to stop
echo.

set MATLAB_PATH=%MATLAB_PATH%
node build\index.js --sse --port=3000

pause