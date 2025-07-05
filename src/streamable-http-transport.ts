/**
 * Streamable HTTP Transport for MCP Server
 * Provides HTTP interface compliant with MCP 2025-03-26 spec
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Server as HttpServer } from 'http';
import { 
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
} from '@modelcontextprotocol/sdk/types.js';

export class StreamableHTTPTransport {
  private app: Express;
  private server: HttpServer | null = null;
  private port: number;
  private messageHandler: ((message: JSONRPCMessage) => Promise<JSONRPCMessage>) | null = null;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Accept']
    }));

    this.app.use(express.json({ limit: '10mb' }));
    
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.error(`[HTTP] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        transport: 'streamable-http',
        timestamp: new Date().toISOString() 
      });
    });

    // MCP Discovery endpoint
    this.app.get('/mcp', (req: Request, res: Response) => {
      res.json({
        version: '2025-03-26',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        serverInfo: {
          name: 'matlab-server', 
          version: '0.1.0'
        }
      });
    });

    // MCP Request endpoint
    this.app.post('/mcp', async (req: Request, res: Response) => {
      await this.handleMCPRequest(req, res);
    });

    // OAuth Discovery endpoints - "no auth required"
    this.app.get('/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers.host;
      res.json({
        resource: `${protocol}://${host}/mcp`,
        authorization_servers: [],
        // No authorization required
        protected: false
      });
    });

    this.app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
      // Return empty/minimal oauth server info to indicate no auth required
      res.json({
        issuer: "none",
        authorization_endpoint: "none", 
        token_endpoint: "none",
        registration_endpoint: "none",
        scopes_supported: [],
        response_types_supported: [],
        grant_types_supported: []
      });
    });

    this.app.post('/register', (req: Request, res: Response) => {
      // Dynamic client registration not required - return success with dummy client
      res.json({
        client_id: "no-auth-required",
        client_secret: "no-auth-required"
      });
    });

    // Root info
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'MATLAB MCP Server',
        version: '0.1.0',
        transport: 'Streamable HTTP',
        endpoints: {
          health: '/health',
          mcp: '/mcp'
        }
      });
    });
  }

  private async handleMCPRequest(req: Request, res: Response) {
    try {
      const message: JSONRPCMessage = req.body;
      console.error(`[HTTP] MCP Request:`, JSON.stringify(message, null, 2));

      if (!this.messageHandler) {
        return res.status(503).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Handler not ready' },
          id: 'id' in message ? message.id : null
        });
      }

      const response = await this.messageHandler(message);
      res.json(response);

    } catch (error) {
      console.error('[HTTP] Error:', error);
      
      const errorResponse = {
        jsonrpc: '2.0' as const,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        },
        id: null
      };

      res.status(500).json(errorResponse);
    }
  }

  public setMessageHandler(handler: (message: JSONRPCMessage) => Promise<JSONRPCMessage>) {
    this.messageHandler = handler;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.error(`[HTTP] MATLAB MCP Server (Streamable HTTP) on port ${this.port}`);
        console.error(`[HTTP] Endpoint: http://localhost:${this.port}/mcp`);
        resolve();
      });

      if (this.server) {
        this.server.on('error', reject);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.error('[HTTP] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
