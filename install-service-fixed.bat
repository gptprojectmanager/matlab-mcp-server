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

:: Check if port 3000 is already in use
echo [INFO] Checking if port 3000 is available...
netstat -an | find ":3000" >nul
if %errorLevel% equ 0 (
    echo [WARNING] Port 3000 is already in use
    echo [INFO] Trying to find process using port 3000...
    for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do (
        echo [INFO] Process ID using port 3000: %%a
        tasklist /FI "PID eq %%a" /FO TABLE
    )
    echo.
    choice /C YN /M "Continue anyway? (Y/N)"
    if errorlevel 2 (
        echo [INFO] Installation cancelled
        pause
        exit /b 1
    )
)

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

:: Create batch file for service
echo [INFO] Creating service batch file...
set "SERVICE_BAT=%CD%\matlab-mcp-service.bat"
echo @echo off > "%SERVICE_BAT%"
echo cd /d "%CD%" >> "%SERVICE_BAT%"
echo set MATLAB_PATH=%MATLAB_PATH% >> "%SERVICE_BAT%"
echo node build\index.js --sse --port=3000 >> "%SERVICE_BAT%"

:: Create Windows Task Scheduler entry for auto-start
echo [INFO] Creating Windows scheduled task for auto-start...
schtasks /create /tn "MatlabMCPServer" /tr "\"%SERVICE_BAT%\"" /sc onstart /ru "SYSTEM" /rl highest /f

if %errorLevel% equ 0 (
    echo [SUCCESS] Scheduled task created successfully
    echo [INFO] Server will start automatically on Windows boot
    echo.
    echo [INFO] Management commands:
    echo   Start:  schtasks /run /tn "MatlabMCPServer"
    echo   Stop:   taskkill /f /im node.exe
    echo   Remove: schtasks /delete /tn "MatlabMCPServer" /f
    echo.
    
    :: Ask to start now
    choice /C YN /M "Start server now? (Y/N)"
    if not errorlevel 2 (
        echo [INFO] Starting server...
        schtasks /run /tn "MatlabMCPServer"
        timeout /t 3 /nobreak >nul
        echo [INFO] Server should be running on http://localhost:3000
    )
) else (
    echo [ERROR] Failed to create scheduled task
)

pause