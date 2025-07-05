/**
 * Server-Sent Events Transport for MCP Server
 * Provides HTTP/SSE interface as alternative to stdio
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Server as HttpServer } from 'http';
import { 
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
} from '@modelcontextprotocol/sdk/types.js';

export class SSEServerTransport {
  private app: Express;
  private server: HttpServer | null = null;
  private connections: Map<string, Response> = new Map();
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
      console.error(`[SSE] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/mcp', (req: Request, res: Response) => {
      // MCP Streamable HTTP discovery endpoint
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

    this.app.post('/mcp', async (req: Request, res: Response) => {
      await this.handleMCPRequest(req, res);
    });

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

  private handleSSEConnection(req: Request, res: Response) {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    this.connections.set(connectionId, res);
    console.error(`[SSE] New connection: ${connectionId}`);

    this.sendSSEEvent(res, 'connected', { connectionId });

    req.on('close', () => {
      console.error(`[SSE] Connection closed: ${connectionId}`);
      this.connections.delete(connectionId);
    });

    const keepAlive = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(keepAlive);
        return;
      }
      this.sendSSEEvent(res, 'ping', { timestamp: Date.now() });
    }, 30000);

    req.on('close', () => clearInterval(keepAlive));
  }

  private async handleMCPRequest(req: Request, res: Response) {
    try {
      const message: JSONRPCMessage = req.body;
      console.error(`[SSE] Received MCP request:`, JSON.stringify(message, null, 2));

      if (!this.messageHandler) {
        return res.status(503).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Message handler not set' },
          id: 'id' in message ? message.id : null
        });
      }

      const response = await this.messageHandler(message);
      
      this.broadcastSSEEvent('mcp-response', response);
      res.json(response);

    } catch (error) {
      console.error('[SSE] Error processing MCP request:', error);
      
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

  private sendSSEEvent(res: Response, event: string, data: any) {
    if (res.writableEnded) return;
    
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(message);
  }

  private broadcastSSEEvent(event: string, data: any) {
    for (const [connectionId, res] of this.connections) {
      try {
        this.sendSSEEvent(res, event, data);
      } catch (error) {
        console.error(`[SSE] Error sending to ${connectionId}:`, error);
        this.connections.delete(connectionId);
      }
    }
  }

  public setMessageHandler(handler: (message: JSONRPCMessage) => Promise<JSONRPCMessage>) {
    this.messageHandler = handler;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.error(`[SSE] MATLAB MCP Server listening on port ${this.port}`);
        console.error(`[SSE] Endpoints:`);
        console.error(`[SSE]   Health: http://localhost:${this.port}/health`);
        console.error(`[SSE]   SSE: http://localhost:${this.port}/sse`);
        console.error(`[SSE]   MCP: http://localhost:${this.port}/mcp`);
        resolve();
      });

      if (this.server) {
        this.server.on('error', reject);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const [connectionId, res] of this.connections) {
        try {
          res.end();
        } catch (error) {
          console.error(`[SSE] Error closing connection ${connectionId}:`, error);
        }
      }
      this.connections.clear();

      if (this.server) {
        this.server.close(() => {
          console.error('[SSE] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
