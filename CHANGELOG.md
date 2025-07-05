# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Streamable HTTP Transport Support** - Major new feature enabling remote MCP connections
  - HTTP/SSE transport implementation compliant with MCP 2025-03-26 specification
  - Direct Claude Code integration without SSH tunnels
  - Dual-mode operation: stdio (local) and HTTP (remote)
  - Command line flags: `--sse`, `--port=N`
  - Environment variables: `USE_SSE`, `PORT`
  - Cross-origin resource sharing (CORS) support
  - Real-time tool execution over HTTP
  - MCP protocol lifecycle management (initialize/initialized)
  - JSON-RPC 2.0 compliant message handling
  - Health check and discovery endpoints
  - Session management for stateful connections
  - Comprehensive error handling and timeout management

### Changed
- Updated `package.json` with Express.js and CORS dependencies
- Enhanced server initialization to support transport selection
- Modified message handling to support both stdio and HTTP protocols
- Updated documentation with HTTP mode usage examples
- Improved error messages and logging for better debugging

### Technical Details
- Added `src/streamable-http-transport.ts` - New HTTP transport implementation
- Modified `src/index.ts` - Dual-mode server support and HTTP message handling
- Enhanced message router to handle MCP protocol messages (initialize, tools/list, tools/call)
- Implemented protocol version negotiation
- Added proper JSON-RPC response formatting
- Removed hardcoded timeouts that caused connection issues

### Backward Compatibility
- ✅ All existing stdio functionality preserved
- ✅ Same tool interface and capabilities  
- ✅ No breaking changes to existing Claude Desktop configurations
- ✅ Existing command line usage unchanged

### Configuration Examples

#### Claude Desktop (Stdio Mode)
```json
{
  "mcpServers": {
    "matlab-server": {
      "command": "node",
      "args": ["/path/to/matlab-server/build/index.js"],
      "env": {
        "MATLAB_PATH": "/path/to/matlab/executable"
      }
    }
  }
}
```

#### Claude Code (HTTP Mode) 
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

### Architecture Impact
This update transforms the MATLAB MCP Server from a local-only tool to a hybrid solution supporting both local and remote deployments, significantly expanding its use cases and accessibility.

## [0.1.0] - Previous Release
- Initial implementation with stdio transport
- MATLAB code execution capabilities
- Code generation from natural language
- Documentation resources
- Basic MCP protocol support
