#!/usr/bin/env node
/**
 * Yahoo Mail MCP Server - HTTP Version
 * Runs as Express HTTP server, aligned with Priority MCP structure
 */

import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import { ToolRegistry } from './mcp/registry.js';
import { MCPProtocolHandler } from './mcp/handler.js';
import { registerYahooMailTools } from './tools/register.js';
import { YahooOAuth2 } from './oauth2.js';
import { YahooIMAPClient } from './imap-client.js';
import { YahooCalDAVClient } from './caldav-client.js';
import type { YahooConfig } from './types.js';

// Load environment variables
dotenv.config();

// Initialize configuration
const config: YahooConfig = {
  clientId: process.env.YAHOO_CLIENT_ID || '',
  clientSecret: process.env.YAHOO_CLIENT_SECRET || '',
  redirectUri: process.env.YAHOO_REDIRECT_URI || 'https://localhost:3001/oauth/callback',
  imapHost: process.env.YAHOO_IMAP_HOST || 'imap.mail.yahoo.com',
  imapPort: parseInt(process.env.YAHOO_IMAP_PORT || '993', 10),
  caldavUrl: process.env.YAHOO_CALDAV_URL || 'https://caldav.calendar.yahoo.com',
  smtpHost: process.env.YAHOO_SMTP_HOST || 'smtp.mail.yahoo.com',
  smtpPort: parseInt(process.env.YAHOO_SMTP_PORT || '587', 10),
};

// Validate required configuration
if (!config.clientId || !config.clientSecret) {
  console.error('ERROR: YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

const port = parseInt(process.env.PORT || process.env.YAHOO_MCP_PORT || '3001', 10);
const serverName = 'Yahoo Mail MCP';
const serverVersion = process.env.MCP_SERVER_VERSION || '0.1.0';

// Initialize clients (lazy initialization)
let oauth2: YahooOAuth2 | null = null;
let imapClient: YahooIMAPClient | null = null;
let caldavClient: YahooCalDAVClient | null = null;
let emailAddress: string = '';

function getOAuth2(): YahooOAuth2 {
  if (!oauth2) {
    oauth2 = new YahooOAuth2(config);
  }
  return oauth2;
}

async function getIMAPClient(): Promise<YahooIMAPClient> {
  if (!imapClient) {
    const oauth = getOAuth2();
    emailAddress = process.env.YAHOO_EMAIL || (config.clientId.includes('@') ? config.clientId : '');
    if (!emailAddress) {
      throw new Error('Email address not found. Please set YAHOO_EMAIL in .env file');
    }
    imapClient = new YahooIMAPClient(oauth, emailAddress, config.imapHost, config.imapPort);
  }
  return imapClient;
}

async function getCalDAVClient(): Promise<YahooCalDAVClient> {
  if (!caldavClient) {
    const oauth = getOAuth2();
    caldavClient = new YahooCalDAVClient(oauth, config.caldavUrl);
  }
  return caldavClient;
}

// Initialize tool registry and handler
const tools = new ToolRegistry();
registerYahooMailTools(tools, getIMAPClient, getCalDAVClient);
const handler = new MCPProtocolHandler(tools, {
  serverName,
  serverVersion
});

// Create Express app
const app = express();

// Middleware
app.disable('x-powered-by');
const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({
    name: serverName,
    version: serverVersion,
    endpoints: {
      mcp: '/mcp',
      health: '/health',
      capabilities: '/capabilities'
    }
  });
});

app.get('/health', (req, res) => {
  try {
    res.json({
      status: 'ok',
      time: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message || 'unknown error' });
  }
});

app.get('/capabilities', (req, res) => {
  const toolList = tools.listTools();
  res.json({
    name: serverName,
    version: serverVersion,
    protocolVersion: '2024-11-05',
    serverInfo: {
      name: serverName,
      version: serverVersion
    },
    capabilities: {
      tools: {
        listChanged: false
      }
    },
    tools: {
      count: toolList.length,
      list: toolList.map(tool => ({
        name: tool.name,
        description: tool.description
      }))
    },
    transport: {
      type: 'http',
      version: '1.0',
      endpoints: {
        mcp: '/mcp',
        health: '/health',
        capabilities: '/capabilities'
      }
    }
  });
});

app.get('/mcp', (req, res) => {
  res.json({
    name: serverName,
    version: serverVersion,
    endpoint: '/mcp',
    protocol: 'JSON-RPC 2.0',
    method: 'POST',
    description: 'MCP (Model Context Protocol) endpoint for Yahoo Mail integration',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }
    },
    availableMethods: [
      'initialize',
      'tools/list',
      'tools/call'
    ],
    example: {
      listTools: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      },
      callTool: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'yahoo_mail_fetch_emails',
          arguments: {
            limit: 10
          }
        }
      }
    },
    documentation: 'See README.md for full API documentation'
  });
});

app.post('/mcp', async (req, res) => {
  const startTime = Date.now();
  const method = req.body?.method || 'unknown';
  const toolName = req.body?.params?.name || 'unknown';

  try {
    log(`[REQUEST] ${method}${toolName !== 'unknown' ? ` tool=${toolName}` : ''} id=${req.body?.id || 'null'}`);

    const response = await handler.handle(req.body);
    const duration = Date.now() - startTime;
    const hasError = response?.error;

    if (hasError) {
      log(`[RESPONSE] ${method} ERROR: ${response.error?.message || 'unknown'} (${duration}ms)`);
    } else {
      log(`[RESPONSE] ${method} SUCCESS (${duration}ms)`);
    }

    // Ensure clients like curl exit cleanly by closing the connection
    res.setHeader('Connection', 'close');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(response);
  } catch (err: any) {
    const duration = Date.now() - startTime;
    log(`[ERROR] ${method} EXCEPTION: ${err?.message || 'unknown'} (${duration}ms)`);
    res.setHeader('Connection', 'close');
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id ?? null,
      error: { code: -32000, message: err?.message || 'Internal error' }
    });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
const httpsOptions = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};

const server = https.createServer(httpsOptions, app).listen(port, '0.0.0.0', () => {
  log(`${serverName} listening on https://0.0.0.0:${port}`);
  log(`Available tools: ${tools.listTools().map(t => t.name).join(', ')}`);
});

// Force short/closed connections so CLI callers (curl) never appear to "hang"
try {
  server.keepAliveTimeout = 0; // disable keep-alive at the Node HTTP server level
  server.headersTimeout = 5000; // guard against slowloris
  // @ts-ignore - not always present, but set when available
  if ((server as any).requestTimeout !== undefined) {
    (server as any).requestTimeout = 15000;
  }
} catch (_e) {
  // noop - best-effort hardening
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully...');
  server.close(() => process.exit(0));
});

function log(line: string): void {
  console.error(`[yahoo-mail-mcp] ${line}`);
}
