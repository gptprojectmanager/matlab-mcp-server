# SSE/HTTP Transport Implementation for MATLAB MCP Server

## Overview
This implementation adds **Streamable HTTP transport** support to the MATLAB MCP Server, enabling direct connection from Claude Code and other MCP clients without requiring SSH tunnels.

## Key Features Added

### ✅ Dual Transport Support
- **Stdio Mode** (original): Local subprocess communication
- **HTTP Mode** (new): Remote HTTP/SSE communication via Streamable HTTP protocol

### ✅ MCP Protocol Compliance
- Full MCP 2025-03-26 specification compliance
- Proper `initialize`/`initialized` lifecycle handling
- JSON-RPC 2.0 message format
- Protocol version negotiation

### ✅ Direct Claude Code Integration
- No SSH tunnel required
- OAuth-free operation (authless like stdio mode)
- Real-time tool execution over HTTP

## Usage

### Stdio Mode (Original)
```bash
node build/index.js
```

### HTTP Mode (New)
```bash
node build/index.js --sse --port=3000
```

### Environment Variables
- `MATLAB_PATH`: Path to MATLAB executable
- `USE_SSE=true`: Force HTTP mode
- `PORT=3000`: Set HTTP port

## Claude Code Configuration

```json
{
  "mcpServers": {
    "matlab-server": {
      "type": "http",
      "url": "http://YOUR_IP:3000/mcp"
    }
  }
}
```

## Available Endpoints

- `GET /` - Server information
- `GET /health` - Health check
- `GET /mcp` - MCP discovery endpoint
- `POST /mcp` - MCP requests (initialize, tools/list, tools/call)

## Tools Available

1. **execute_matlab_code** - Execute MATLAB code and return results
2. **generate_matlab_code** - Generate MATLAB code from natural language

## Implementation Details

### Files Modified
- `package.json` - Added Express.js and CORS dependencies
- `src/index.ts` - Added dual-mode support and HTTP message handling
- `src/streamable-http-transport.ts` - New HTTP transport implementation

### Protocol Flow
1. Client sends `initialize` request
2. Server responds with capabilities and server info
3. Client sends `notifications/initialized`
4. Normal tool operations (tools/list, tools/call)

### Backward Compatibility
- ✅ All existing stdio functionality preserved
- ✅ Same tool interface and capabilities
- ✅ No breaking changes to existing configurations

## Benefits

- **No Infrastructure**: Direct connection without SSH/VPN
- **Cross-Platform**: Works from any network-accessible device
- **Real-Time**: HTTP transport for immediate responses
- **Standard Compliant**: Full MCP specification adherence
- **Secure**: Same security model as stdio (file system permissions)

## Testing

```bash
# Test initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'

# Test tools list
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

## Architecture

```
┌─────────────────┐    HTTP/JSON-RPC    ┌─────────────────┐
│   Claude Code   │◄────────────────────►│  MATLAB Server  │
│   (Ubuntu LAN)  │                      │   (Windows)     │
└─────────────────┘                      └─────────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │ MATLAB Engine   │
                                         │   (Local)       │
                                         └─────────────────┘
```

This implementation bridges the gap between local MATLAB environments and remote AI agents, enabling powerful scientific computing workflows across networks.
