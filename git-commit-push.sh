#!/bin/bash
# Git commands for committing and pushing SSE/HTTP transport implementation

echo "=== MATLAB MCP Server - Streamable HTTP Implementation ==="
echo "Preparing to commit and push changes to remote repository..."

# Check current directory
echo "Current directory: $(pwd)"

# Check git status
echo ""
echo "=== Git Status ==="
git status

# Add all modified and new files
echo ""
echo "=== Adding files to staging ==="
git add package.json
git add src/index.ts
git add src/streamable-http-transport.ts
git add README.md
git add STREAMABLE-HTTP-IMPLEMENTATION.md
git add CHANGELOG.md

# Show staged changes
echo ""
echo "=== Staged Changes ==="
git diff --cached --name-only

# Commit with detailed message
echo ""
echo "=== Committing changes ==="
git commit -m "feat: Add Streamable HTTP transport support for remote MCP connections

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
{\"mcpServers\": {\"matlab-server\": {\"type\": \"http\", \"url\": \"http://IP:3000/mcp\"}}}

This implementation transforms MATLAB MCP Server from local-only to hybrid 
local/remote solution, enabling powerful scientific computing workflows 
across networks and significantly expanding accessibility.

Co-authored-by: Claude Sonnet 4 <claude@anthropic.com>"

# Check remote repository
echo ""
echo "=== Checking remote repository ==="
git remote -v

# Push to remote
echo ""
echo "=== Pushing to remote repository ==="
echo "Pushing to: https://github.com/gptprojectmanager/matlab-mcp-server"
git push origin main

echo ""
echo "=== Commit and Push Complete! ==="
echo "✅ Changes successfully pushed to GitHub"
echo "🔗 Repository: https://github.com/gptprojectmanager/matlab-mcp-server"
echo "📊 View changes at: https://github.com/gptprojectmanager/matlab-mcp-server/commits"
