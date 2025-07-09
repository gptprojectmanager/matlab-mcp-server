@echo off
echo Starting MATLAB MCP Server...
cd /d "C:\Users\%USERNAME%\matlab-mcp-server"
set MATLAB_PATH=C:\Program Files\MATLAB\R2023b\bin\matlab.exe
node build\index.js --sse --port=3000
pause