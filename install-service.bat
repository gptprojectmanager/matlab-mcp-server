@echo off
setlocal enabledelayedexpansion

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
for /d %%i in ("C:\Program Files\MATLAB\R*") do (
    if exist "%%i\bin\matlab.exe" (
        set "MATLAB_PATH=%%i\bin\matlab.exe"
        echo [FOUND] MATLAB at: !MATLAB_PATH!
        goto :matlab_found
    )
)

:: Try Program Files (x86)
for /d %%i in ("C:\Program Files (x86)\MATLAB\R*") do (
    if exist "%%i\bin\matlab.exe" (
        set "MATLAB_PATH=%%i\bin\matlab.exe"
        echo [FOUND] MATLAB at: !MATLAB_PATH!
        goto :matlab_found
    )
)

:: Try other common locations (E: drive example)
for /d %%i in ("E:\MATLAB\R*") do (
    if exist "%%i\bin\matlab.exe" (
        set "MATLAB_PATH=%%i\bin\matlab.exe"
        echo [FOUND] MATLAB at: !MATLAB_PATH!
        goto :matlab_found
    )
)

:: Check direct E:\MATLAB\bin\matlab.exe
if exist "E:\MATLAB\bin\matlab.exe" (
    set "MATLAB_PATH=E:\MATLAB\bin\matlab.exe"
    echo [FOUND] MATLAB at: !MATLAB_PATH!
    goto :matlab_found
)

:: Manual input if not found
:matlab_not_found
echo [WARNING] MATLAB not found automatically
set /p "MATLAB_PATH=Enter full path to matlab.exe: "
if not exist "!MATLAB_PATH!" (
    echo [ERROR] File not found: !MATLAB_PATH!
    goto :matlab_not_found
)

:matlab_found
echo [SUCCESS] MATLAB Path: !MATLAB_PATH!

:: Check if server directory exists
set "SERVER_DIR=%CD%"
if not exist "build\index.js" (
    echo [ERROR] MATLAB MCP Server not found in current directory
    echo Please run this script from the matlab-mcp-server directory
    pause
    exit /b 1
)

:: Install as Windows Service using nssm
echo [INFO] Installing Windows Service...

:: Download nssm if not exists
if not exist "nssm.exe" (
    echo [INFO] Downloading NSSM (Non-Sucking Service Manager)...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'; Expand-Archive 'nssm.zip' -DestinationPath '.'; Move-Item 'nssm-2.24\win64\nssm.exe' .; Remove-Item 'nssm.zip', 'nssm-2.24' -Recurse -Force"
)

:: Configure service
echo [INFO] Configuring service...
nssm install "MatlabMCPServer" "node" "build\index.js --sse --port=3000"
nssm set "MatlabMCPServer" AppDirectory "!SERVER_DIR!"
nssm set "MatlabMCPServer" AppEnvironmentExtra "MATLAB_PATH=!MATLAB_PATH!"
nssm set "MatlabMCPServer" DisplayName "MATLAB MCP Server"
nssm set "MatlabMCPServer" Description "MATLAB MCP Server for Claude Code integration"
nssm set "MatlabMCPServer" Start SERVICE_AUTO_START

:: Start service
echo [INFO] Starting service...
nssm start "MatlabMCPServer"

:: Verify service status
timeout /t 3 /nobreak >nul
sc query "MatlabMCPServer" | find "RUNNING" >nul
if %errorLevel% eql 0 (
    echo [SUCCESS] Service installed and started successfully
    echo.
    echo Service Management Commands:
    echo - Start:   nssm start MatlabMCPServer
    echo - Stop:    nssm stop MatlabMCPServer  
    echo - Remove:  nssm remove MatlabMCPServer confirm
    echo.
    echo Server is now running on: http://localhost:3000
) else (
    echo [ERROR] Service installation failed
    nssm remove "MatlabMCPServer" confirm >nul 2>&1
)

pause