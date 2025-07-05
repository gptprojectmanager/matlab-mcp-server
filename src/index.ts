#!/usr/bin/env node

/**
 * MATLAB MCP Server
 * 
 * This MCP server provides tools to:
 * 1. Execute MATLAB code
 * 2. Generate MATLAB code from natural language descriptions
 * 3. Access MATLAB documentation
 * 
 * Supports both stdio and SSE transports
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPTransport } from "./streamable-http-transport.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as matlab from "node-matlab";

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Configuration for MATLAB
interface MatlabConfig {
  executablePath: string;
  tempDir: string;
}

// Default configuration
const defaultConfig: MatlabConfig = {
  executablePath: process.env.MATLAB_PATH || "matlab", // Default to 'matlab' command if MATLAB_PATH not set
  tempDir: path.join(os.tmpdir(), "matlab-mcp")
};

// Ensure temp directory exists
if (!fs.existsSync(defaultConfig.tempDir)) {
  fs.mkdirSync(defaultConfig.tempDir, { recursive: true });
}

/**
 * Class to handle MATLAB operations
 */
class MatlabHandler {
  private config: MatlabConfig;

  constructor(config: MatlabConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * Execute MATLAB code
   * @param code MATLAB code to execute
   * @param saveScript Whether to save the MATLAB script
   * @param scriptPath Custom path to save the MATLAB script (optional)
   * @returns Result of execution
   */
  async executeCode(code: string, saveScript: boolean = false, scriptPath?: string): Promise<{ output: string; error?: string; scriptPath?: string }> {
    try {
      // Create a temporary .m file with ASCII-only code
      const tempFile = path.join(this.config.tempDir, `script_${Date.now()}.m`);
      
      // Convert any non-ASCII characters to their ASCII equivalents
      const asciiCode = code
        .replace(/[']/g, "'")  // Replace smart quotes
        .replace(/["]/g, '"')  // Replace smart quotes
        .replace(/[—]/g, '--') // Replace em dash
        .replace(/[–]/g, '-')  // Replace en dash
        .replace(/[…]/g, '...'); // Replace ellipsis
      
      fs.writeFileSync(tempFile, asciiCode);
      
      // If saveScript is true, save the script to the specified path or to the current directory
      let savedScriptPath: string | undefined;
      if (saveScript) {
        const targetPath = scriptPath || path.join(process.cwd(), `matlab_script_${Date.now()}.m`);
        fs.copyFileSync(tempFile, targetPath);
        savedScriptPath = targetPath;
      }
      
      // Execute the MATLAB script using a simple command
      const command = `"${this.config.executablePath}" -batch "run('${tempFile.replace(/\\/g, '/')}'); pause(1);"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      // Clean up the temporary file if not saving
      if (!saveScript) {
        fs.unlinkSync(tempFile);
      }
      
      return {
        output: stdout,
        error: stderr || undefined,
        scriptPath: savedScriptPath
      };
    } catch (error) {
      console.error("Error executing MATLAB code:", error);
      return {
        output: "",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate MATLAB code from natural language description
   * @param description Natural language description of what the code should do
   * @returns Generated MATLAB code
   */
  generateCode(description: string): string {
    // This is a placeholder. In a real implementation, this would use an LLM or other method
    // to generate MATLAB code from the description.
    // For now, we'll return a simple template based on the description.
    
    return `% MATLAB code generated from description: ${description}
% Generated on: ${new Date().toISOString()}

% Your code here:
% This is a placeholder implementation.
% In a real system, this would be generated based on the description.

function result = generatedFunction()
    % Based on description: ${description}
    disp('Executing function based on description: ${description}');
    
    % Placeholder implementation
    result = 'Function executed successfully';
end

% Call the function
generatedFunction()`;
  }

  /**
   * Check if MATLAB is available
   * @returns True if MATLAB is available, false otherwise
   */
  async checkMatlabAvailability(): Promise<boolean> {
    try {
      await execAsync(`"${this.config.executablePath}" -nosplash -nodesktop -r "disp('MATLAB is available'); exit;"`);
      return true;
    } catch (error) {
      console.error("MATLAB is not available:", error);
      return false;
    }
  }
}

/**
 * Main MCP Server class
 */
class MatlabMcpServer {
  private server: Server;
  private matlabHandler: MatlabHandler;
  private matlabAvailable: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: "matlab-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.matlabHandler = new MatlabHandler();
    
    // Setup request handlers
    this.setupResourceHandlers();
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Setup resource handlers
   */
  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: `matlab://documentation/getting-started`,
          name: `MATLAB Getting Started Guide`,
          mimeType: 'text/markdown',
          description: 'Basic guide for getting started with MATLAB through the MCP server',
        },
      ],
    }));

    // Read resource content
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const match = request.params.uri.match(
          /^matlab:\/\/documentation\/(.+)$/
        );
        
        if (!match) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            `Invalid URI format: ${request.params.uri}`
          );
        }
        
        const docType = match[1];
        
        if (docType === 'getting-started') {
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'text/markdown',
                text: `# MATLAB MCP Server - Getting Started

This MCP server allows you to interact with MATLAB directly from your AI assistant.

## Available Tools

1. **execute_matlab_code** - Execute MATLAB code and get the results
2. **generate_matlab_code** - Generate MATLAB code from a natural language description
3. **save_matlab_script** - Save MATLAB code to a file for future reference

## Examples

### Executing MATLAB Code

You can execute MATLAB code like this:

\`\`\`
% Create a simple plot
x = 0:0.1:2*pi;
y = sin(x);
plot(x, y);
title('Sine Wave');
xlabel('x');
ylabel('sin(x)');
\`\`\`

### Generating MATLAB Code

You can ask the AI to generate MATLAB code for specific tasks, such as:

- "Create a script to calculate the Fibonacci sequence"
- "Write code to perform image processing on a sample image"
- "Generate a function to solve a system of linear equations"

## Requirements

- MATLAB must be installed on your system
- The MATLAB executable must be in your PATH or specified via the MATLAB_PATH environment variable
`,
              },
            ],
          };
        }
        
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Documentation not found: ${docType}`
        );
      }
    );
  }

  /**
   * Setup tool handlers
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_matlab_code',
          description: 'Execute MATLAB code and return the results',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'MATLAB code to execute',
              },
              saveScript: {
                type: 'boolean',
                description: 'Whether to save the MATLAB script for future reference',
              },
              scriptPath: {
                type: 'string',
                description: 'Custom path to save the MATLAB script (optional)',
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'generate_matlab_code',
          description: 'Generate MATLAB code from a natural language description',
          inputSchema: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Natural language description of what the code should do',
              },
              saveScript: {
                type: 'boolean',
                description: 'Whether to save the generated MATLAB script',
              },
              scriptPath: {
                type: 'string',
                description: 'Custom path to save the MATLAB script (optional)',
              },
            },
            required: ['description'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Check MATLAB availability if not already checked
      if (!this.matlabAvailable) {
        this.matlabAvailable = await this.matlabHandler.checkMatlabAvailability();
        
        if (!this.matlabAvailable && request.params.name === 'execute_matlab_code') {
          return {
            content: [
              {
                type: 'text',
                text: `Error: MATLAB is not available. Please make sure MATLAB is installed and the path is correctly set in the environment variable MATLAB_PATH.`,
              },
            ],
            isError: true,
          };
        }
      }

      switch (request.params.name) {
        case 'execute_matlab_code': {
          const code = String(request.params.arguments?.code || '');
          const saveScript = Boolean(request.params.arguments?.saveScript || false);
          const scriptPath = request.params.arguments?.scriptPath as string | undefined;
          
          if (!code) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'MATLAB code is required'
            );
          }
          
          try {
            const result = await this.matlabHandler.executeCode(code, saveScript, scriptPath);
            
            let responseText = result.error 
              ? `Error executing MATLAB code:\n${result.error}`
              : `MATLAB execution result:\n${result.output}`;
            
            if (result.scriptPath) {
              responseText += `\n\nMATLAB script saved to: ${result.scriptPath}`;
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: responseText,
                },
              ],
              isError: !!result.error,
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error executing MATLAB code: ${error instanceof Error ? error.message : String(error)}`,
                },
              ],
              isError: true,
            };
          }
        }
        
        case 'generate_matlab_code': {
          const description = String(request.params.arguments?.description || '');
          const saveScript = Boolean(request.params.arguments?.saveScript || false);
          const scriptPath = request.params.arguments?.scriptPath as string | undefined;
          
          if (!description) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'Description is required'
            );
          }
          
          try {
            const generatedCode = this.matlabHandler.generateCode(description);
            
            let responseText = `Generated MATLAB code for: "${description}"\n\n\`\`\`matlab\n${generatedCode}\n\`\`\``;
            
            // Save the generated code if requested
            if (saveScript) {
              const targetPath = scriptPath || path.join(process.cwd(), `matlab_generated_${Date.now()}.m`);
              fs.writeFileSync(targetPath, generatedCode);
              responseText += `\n\nGenerated MATLAB script saved to: ${targetPath}`;
            }
            
            return {
              content: [
                {
                  type: 'text',
                  text: responseText,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error generating MATLAB code: ${error instanceof Error ? error.message : String(error)}`,
                },
              ],
              isError: true,
            };
          }
        }
        
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  /**
   * Handle tool calls for HTTP transport
   */
  private async handleToolCall(message: any): Promise<any> {
    const toolName = message.params?.name;
    const args = message.params?.arguments || {};

    // Check MATLAB availability if not already checked
    if (!this.matlabAvailable) {
      this.matlabAvailable = await this.matlabHandler.checkMatlabAvailability();
      
      if (!this.matlabAvailable && toolName === 'execute_matlab_code') {
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: 'Error: MATLAB is not available. Please make sure MATLAB is installed and the path is correctly set in the environment variable MATLAB_PATH.'
              }
            ],
            isError: true
          }
        };
      }
    }

    switch (toolName) {
      case 'execute_matlab_code': {
        const code = String(args.code || '');
        const saveScript = Boolean(args.saveScript || false);
        const scriptPath = args.scriptPath as string | undefined;
        
        if (!code) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32602,
              message: 'MATLAB code is required'
            }
          };
        }
        
        try {
          const result = await this.matlabHandler.executeCode(code, saveScript, scriptPath);
          
          let responseText = result.error 
            ? `Error executing MATLAB code:\n${result.error}`
            : `MATLAB execution result:\n${result.output}`;
          
          if (result.scriptPath) {
            responseText += `\n\nMATLAB script saved to: ${result.scriptPath}`;
          }
          
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: responseText
                }
              ],
              isError: !!result.error
            }
          };
        } catch (error) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Error executing MATLAB code: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              isError: true
            }
          };
        }
      }
      
      case 'generate_matlab_code': {
        const description = String(args.description || '');
        const saveScript = Boolean(args.saveScript || false);
        const scriptPath = args.scriptPath as string | undefined;
        
        if (!description) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32602,
              message: 'Description is required'
            }
          };
        }
        
        try {
          const generatedCode = this.matlabHandler.generateCode(description);
          
          let responseText = `Generated MATLAB code for: "${description}"\n\n\`\`\`matlab\n${generatedCode}\n\`\`\``;
          
          // Save the generated code if requested
          if (saveScript) {
            const targetPath = scriptPath || path.join(process.cwd(), `matlab_generated_${Date.now()}.m`);
            fs.writeFileSync(targetPath, generatedCode);
            responseText += `\n\nGenerated MATLAB script saved to: ${targetPath}`;
          }
          
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: responseText
                }
              ]
            }
          };
        } catch (error) {
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Error generating MATLAB code: ${error instanceof Error ? error.message : String(error)}`
                }
              ],
              isError: true
            }
          };
        }
      }
      
      default:
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${toolName}`
          }
        };
    }
  }

  /**
   * Start the server with dual-mode support (stdio or SSE)
   */
  async run() {
    const args = process.argv.slice(2);
    const useHTTP = args.includes('--http') || args.includes('--sse') || process.env.USE_HTTP === 'true';
    const port = parseInt(process.env.PORT || args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '3000');

    if (useHTTP) {
      console.error(`[HTTP] Starting MATLAB MCP server in HTTP mode on port ${port}`);
      
      const httpTransport = new StreamableHTTPTransport(port);
      
      const mockTransport = {
        send: (message: any) => Promise.resolve(),
        close: () => Promise.resolve(),
        start: () => Promise.resolve()
      };

      await this.server.connect(mockTransport);
      
      // Set up message handler for HTTP transport
      httpTransport.setMessageHandler(async (message: any) => {
        try {
          console.error('[HTTP] Processing message:', message.method);
          
          // Handle MCP protocol messages directly
          switch (message.method) {
            case 'initialize':
              return {
                jsonrpc: '2.0',
                id: message.id,
                result: {
                  protocolVersion: message.params?.protocolVersion || '2025-03-26',
                  capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {}
                  },
                  serverInfo: {
                    name: 'matlab-server',
                    version: '0.1.0'
                  },
                  instructions: 'MATLAB MCP Server - Execute MATLAB code and generate scripts'
                }
              };
              
            case 'notifications/initialized':
              // Notification - no response needed
              console.error('[HTTP] Client initialized');
              return null;
              
            case 'tools/list':
              return {
                jsonrpc: '2.0',
                id: message.id,
                result: {
                  tools: [
                    {
                      name: 'execute_matlab_code',
                      description: 'Execute MATLAB code and return the results',
                      inputSchema: {
                        type: 'object',
                        properties: {
                          code: {
                            type: 'string',
                            description: 'MATLAB code to execute'
                          },
                          saveScript: {
                            type: 'boolean',
                            description: 'Whether to save the MATLAB script for future reference'
                          },
                          scriptPath: {
                            type: 'string',
                            description: 'Custom path to save the MATLAB script (optional)'
                          }
                        },
                        required: ['code']
                      }
                    },
                    {
                      name: 'generate_matlab_code',
                      description: 'Generate MATLAB code from a natural language description',
                      inputSchema: {
                        type: 'object',
                        properties: {
                          description: {
                            type: 'string',
                            description: 'Natural language description of what the code should do'
                          },
                          saveScript: {
                            type: 'boolean',
                            description: 'Whether to save the generated MATLAB script'
                          },
                          scriptPath: {
                            type: 'string',
                            description: 'Custom path to save the MATLAB script (optional)'
                          }
                        },
                        required: ['description']
                      }
                    }
                  ]
                }
              };
              
            case 'tools/call':
              // Handle tool calls
              return await this.handleToolCall(message);
              
            default:
              return {
                jsonrpc: '2.0',
                id: message.id,
                error: {
                  code: -32601,
                  message: `Method not found: ${message.method}`
                }
              };
          }
        } catch (error) {
          console.error('[HTTP] Error processing message:', error);
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32603,
              message: 'Internal error',
              data: error instanceof Error ? error.message : String(error)
            }
          };
        }
      });
      
      await httpTransport.start();
      
      process.on('SIGINT', async () => {
        await httpTransport.stop();
        process.exit(0);
      });
      
    } else {
      console.error('[STDIO] Starting MATLAB MCP server in stdio mode');
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('MATLAB MCP server running on stdio');
    }
  }
}

// Parse command line and environment
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
MATLAB MCP Server

Usage:
  node build/index.js [options]

Options:
  --http             Use HTTP transport instead of stdio
  --sse              Use HTTP transport (alias for --http)
  --port=<number>    Port for HTTP mode (default: 3000)
  --help, -h         Show this help message

Environment Variables:
  USE_HTTP=true      Use HTTP transport
  PORT=<number>      Port for HTTP mode
  MATLAB_PATH        Path to MATLAB executable

Examples:
  # Stdio mode (default)
  node build/index.js
  
  # HTTP mode
  node build/index.js --http
  node build/index.js --http --port=3001
  
  # Using environment variables
  USE_HTTP=true PORT=3000 node build/index.js
`);
  process.exit(0);
}

// Create and run the server
const server = new MatlabMcpServer();
server.run().catch(console.error);
