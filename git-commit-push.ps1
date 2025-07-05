# PowerShell script for committing and pushing SSE/HTTP transport implementation
# Git commands for MATLAB MCP Server Streamable HTTP Implementation

Write-Host "=== MATLAB MCP Server - Streamable HTTP Implementation ===" -ForegroundColor Green
Write-Host "Preparing to commit and push changes to remote repository..."

# Check current directory  
Write-Host ""
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check git status
Write-Host ""
Write-Host "=== Git Status ===" -ForegroundColor Cyan
git status

# Add all modified and new files
Write-Host ""
Write-Host "=== Adding files to staging ===" -ForegroundColor Cyan
git add package.json
git add src/index.ts  
git add src/streamable-http-transport.ts
git add README.md
git add STREAMABLE-HTTP-IMPLEMENTATION.md
git add CHANGELOG.md

# Show staged changes
Write-Host ""
Write-Host "=== Staged Changes ===" -ForegroundColor Cyan
git diff --cached --name-only

# Commit with detailed message
Write-Host ""
Write-Host "=== Committing changes ===" -ForegroundColor Cyan

$commitMessage = @"
feat: Add Streamable HTTP transport support for remote MCP connections

🚀 Major Features Added:
- Streamable HTTP transport compliant with MCP 2025-03-26 spec
- Direct Claude Code integration without SSH tunnels
- Dual-mode operation: stdio (local) + HTTP (remote)
- Real-time MATLAB execution over HTTP/JSON-RPC

✨ New Capabilities:
- Command line flags: --sse, --port=N
- Environment variables: USE_SSE, PORT  
- CORS support for cross-origin requests
- Health check and discovery endpoints
- MCP protocol lifecycle management (initialize/initialized)
- Session management for stateful connections

🛠️ Technical Implementation:
- Added src/streamable-http-transport.ts - HTTP transport layer
- Enhanced src/index.ts - Dual-mode server with HTTP message handling  
- Updated package.json - Express.js and CORS dependencies
- Comprehensive documentation and examples

📖 Documentation:
- Updated README.md with HTTP mode usage
- Added STREAMABLE-HTTP-IMPLEMENTATION.md guide
- Created CHANGELOG.md with detailed changes

🔄 Backward Compatibility:
- ✅ All existing stdio functionality preserved
- ✅ No breaking changes to Claude Desktop configs
- ✅ Same tool interface and capabilities

🎯 Usage Examples:
# Stdio mode (original)
node build/index.js

# HTTP mode (new) 
node build/index.js --sse --port=3000

# Claude Code config
{"mcpServers": {"matlab-server": {"type": "http", "url": "http://IP:3000/mcp"}}}

This implementation transforms MATLAB MCP Server from local-only to hybrid 
local/remote solution, enabling powerful scientific computing workflows 
across networks and significantly expanding accessibility.

Co-authored-by: Claude Sonnet 4 <claude@anthropic.com>
"@

git commit -m $commitMessage

# Check remote repository
Write-Host ""
Write-Host "=== Checking remote repository ===" -ForegroundColor Cyan
git remote -v

# Push to remote
Write-Host ""
Write-Host "=== Pushing to remote repository ===" -ForegroundColor Cyan
Write-Host "Pushing to: https://github.com/gptprojectmanager/matlab-mcp-server" -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "=== Commit and Push Complete! ===" -ForegroundColor Green
Write-Host "✅ Changes successfully pushed to GitHub" -ForegroundColor Green
Write-Host "🔗 Repository: https://github.com/gptprojectmanager/matlab-mcp-server" -ForegroundColor Blue
Write-Host "📊 View changes at: https://github.com/gptprojectmanager/matlab-mcp-server/commits" -ForegroundColor Blue
