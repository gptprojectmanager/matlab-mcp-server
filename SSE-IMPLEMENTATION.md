# SSE Transport Implementation for MATLAB MCP Server

## Overview
Added HTTP/SSE transport support to enable direct Claude Code connection without SSH tunnel.

## Changes Made

### 1. Dependencies (package.json)
```json
"express": "^4.18.2",
"cors": "^2.8.5",
"@types/express": "^4.17.21", 
"@types/cors": "^2.8.17"
```

### 2. New SSE Transport (src/sse-transport.ts)
- HTTP server with Express.js
- CORS enabled for cross-origin requests
- SSE endpoint for real-time communication
- MCP request/response handling

### 3. Dual-Mode Server (src/index.ts)
- Command line args: `--sse`, `--port=3000`
- Environment vars: `USE_SSE=true`, `PORT=3000`
- Full backward compatibility with stdio mode

## Usage

### Stdio Mode (Original)
```bash
node build/index.js
```

### SSE Mode (New)
```bash
node build/index.js --sse --port=3000
```

## Endpoints
- `GET /` - Server info
- `GET /health` - Health check
- `GET /sse` - SSE stream
- `POST /mcp` - MCP requests

## Claude Code Integration
```json
{
  "mcpServers": {
    "matlab-server": {
      "type": "sse",
      "url": "http://localhost:3000/sse"
    }
  }
}
```

## Benefits
- ✅ No SSH tunnel required
- ✅ Direct HTTP access
- ✅ Backward compatible
- ✅ Real-time communication
- ✅ Cross-origin support
