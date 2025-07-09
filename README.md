# MATLAB MCP Server

![GitHub Logo](https://github.com/WilliamCloudQi/matlab-mcp-server/blob/main/-------matlab-mcp-----.png)

## A powerful MCP server that integrates MATLAB with AI, supporting both local and remote connections

**🆕 Now with Streamable HTTP support for direct Claude Code integration!**

A comprehensive MCP server that integrates MATLAB with AI assistants, allowing you to execute MATLAB code, generate MATLAB scripts from natural language descriptions, and access MATLAB documentation. Supports both stdio (local) and HTTP (remote) transports.

<a href="https://glama.ai/mcp/servers/t3mmsdxvmd">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/t3mmsdxvmd/badge" alt="MATLAB Server MCP server" />
</a>

## Features

### 🚀 Dual Transport Support
- **Stdio Mode**: Traditional local subprocess communication (original)
- **HTTP Mode**: Remote Streamable HTTP transport (new) - connect from anywhere!

### 📚 Resources
- Access MATLAB documentation via `matlab://documentation/getting-started` URI
- Get started guide with examples and usage instructions

### 🛠️ Tools
- `execute_matlab_code` - Execute MATLAB code and get results
  - Run any MATLAB commands or scripts
  - Option to save scripts for future reference
  - View output directly in your conversation
  
- `generate_matlab_code` - Generate MATLAB code from natural language
  - Describe what you want to accomplish in plain language
  - Get executable MATLAB code in response
  - Option to save generated scripts

### 🌐 Remote Access
- Direct connection from Claude Code without SSH tunnels
- Cross-platform remote MATLAB execution
- Real-time communication via HTTP/JSON-RPC

## Usage

### HTTP Mode (Remote)
```bash
# Start HTTP server on default port 3000
node build/index.js --sse

# Start on custom port
node build/index.js --sse --port=3001

# Using environment variables
USE_SSE=true PORT=3000 MATLAB_PATH="/path/to/matlab" node build/index.js
```

### Stdio Mode (Local)
```bash
# Standard local execution
node build/index.js

# With custom MATLAB path
MATLAB_PATH="/path/to/matlab" node build/index.js
```

### HTTP Endpoints
- `GET /health` - Health check endpoint
- `POST /mcp` - MCP requests (initialize, tools/list, tools/call)

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Requirements

- MATLAB installed on your system
- Node.js (v14 or higher)

## Installation

### Installing via Smithery

To install MATLAB MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@WilliamCloudQi/matlab-mcp-server):

```bash
npx -y @smithery/cli install @WilliamCloudQi/matlab-mcp-server --client claude
```

### 1. Install the package

```bash
npm install -g matlab-mcp-server
```

Or clone the repository and build it yourself:

```bash
git clone https://github.com/username/matlab-mcp-server.git
cd matlab-mcp-server
npm install
npm run build
```

### 2. Configure your MCP client

#### For Claude Desktop (Stdio Mode)

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "matlab-server": {
      "command": "node",
      "args": ["/path/to/matlab-server/build/index.js"],
      "env": {
        "MATLAB_PATH": "/path/to/matlab/executable"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### For Claude Code (HTTP Mode) 🆕

```json
{
  "mcpServers": {
    "matlab-server": {
      "type": "http",
      "url": "http://YOUR_SERVER_IP:3000/mcp"
    }
  }
}
```

**Example for remote connection:**
```json
{
  "mcpServers": {
    "matlab-server": {
      "type": "http", 
      "url": "http://192.168.1.100:3000/mcp"
    }
  }
}
```

#### Path Configuration

### Testing HTTP Mode

You can test the HTTP mode server using curl:

```bash
# Test server health
curl http://localhost:3000/health

# Test MCP initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'

# Test tools list
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

### Troubleshooting

**HTTP Mode Issues:**
- Ensure firewall allows connections on the specified port
- Check that MATLAB_PATH environment variable is set correctly
- Verify the server IP is accessible from client machine
- For Claude Code, use `"type": "http"` (not "sse" or "streamable-http")

**Common MATLAB Path Locations:**
- Windows: `C:\\Program Files\\MATLAB\\R2023b\\bin\\matlab.exe`
- Windows (custom): `E:\\MATLAB\\bin\\matlab.exe`
- macOS: `/Applications/MATLAB_R2023b.app/bin/matlab`
- Linux: `/usr/local/MATLAB/R2023b/bin/matlab`

**Note:** The installation script automatically detects MATLAB in standard and custom locations (C:, E: drives).

## Windows Service Installation

**Automatic Installation (Recommended):**
1. Open PowerShell/Command Prompt as **Administrator**
2. Navigate to `matlab-mcp-server` directory
3. Run: `install-service.bat`

The script will:
- Auto-detect MATLAB installation
- Install as Windows Service
- Configure auto-start on boot
- Start the service immediately

**Manual Start (Development):**
```cmd
cd C:\Users\%USERNAME%\matlab-mcp-server
set MATLAB_PATH=E:\MATLAB\bin\matlab.exe
node build\index.js --sse --port=3000
```

**Service Management:**
```cmd
# Start service
nssm start MatlabMCPServer

# Stop service  
nssm stop MatlabMCPServer

# Remove service
nssm remove MatlabMCPServer confirm
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Documentation

- [Streamable HTTP Implementation Guide](./STREAMABLE-HTTP-IMPLEMENTATION.md) - Detailed documentation of the new HTTP transport features
- [MCP Protocol Specification](https://modelcontextprotocol.io/specification/2025-03-26) - Official MCP protocol documentation

## Contributing

We welcome contributions from everyone! This project now supports both local and remote MATLAB execution, making it more accessible across different deployment scenarios.

## License

This project is licensed under the MIT License.

[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/williamcloudqi-matlab-mcp-server-badge.png)](https://mseep.ai/app/williamcloudqi-matlab-mcp-server)

[![smithery badge](https://smithery.ai/badge/@WilliamCloudQi/matlab-mcp-server)](https://smithery.ai/server/@WilliamCloudQi/matlab-mcp-server)
