#!/bin/bash
# GitHub Fork and Push Script for MATLAB MCP Server SSE Implementation

echo "=== MATLAB MCP Server SSE Implementation Setup ==="

# Variables
ORIGINAL_REPO="https://github.com/WilliamCloudQi/matlab-mcp-server"
YOUR_USERNAME="gptprojectmanager"
YOUR_EMAIL="gptprojectmanager@gmail.com"
YOUR_REPO="https://github.com/$YOUR_USERNAME/matlab-mcp-server"

echo "1. Configure Git"
git config --global user.name "$YOUR_USERNAME"
git config --global user.email "$YOUR_EMAIL"

echo "2. Go to GitHub and fork: $ORIGINAL_REPO"
echo "   Then clone your fork:"
echo "   git clone $YOUR_REPO"
echo "   cd matlab-mcp-server"

echo "3. Add upstream remote"
echo "   git remote add upstream $ORIGINAL_REPO"

echo "4. Commit and push changes"
cat << 'EOF'
git add .
git commit -m "Add SSE transport support for direct HTTP/SSE access

Features:
- Dual-mode server: stdio (original) + SSE (new)
- HTTP endpoints: /health, /mcp, /sse
- Express.js with CORS support
- Command line: --sse --port=3000
- Full backward compatibility
- Direct Claude Code connection without SSH tunnel

Files modified:
- package.json: Added express, cors dependencies
- src/index.ts: Dual-mode support with CLI args
- src/sse-transport.ts: New SSE transport implementation

Usage:
  stdio: node build/index.js
  SSE:   node build/index.js --sse --port=3000"

git push origin main
EOF

echo "=== Setup Complete ==="
