#!/usr/bin/env node
/**
 * Yahoo Mail MCP Server - Simple HTTP Version
 * Runs as HTTP server on port 3001, compatible with Priority ERP MCP format
 */

import * as dotenv from 'dotenv';
import * as https from 'https';
import * as fs from 'fs';
import * as url from 'url';

// Load environment variables
dotenv.config();

// Import the tool handlers and definitions
import { tools, executeTool } from './tools/index.js';
import { YahooOAuth2 } from './oauth2.js';
import { YahooIMAPClient } from './imap-client.js';
import { YahooCalDAVClient } from './caldav-client.js';
import type { YahooConfig } from './types.js';

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

const port = process.env.PORT || process.env.YAHOO_MCP_PORT || 3001;

const httpsOptions = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};

const httpsServer = https.createServer(httpsOptions, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname;

  // Root and health check endpoints
  if (pathname === '/health' || pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      service: 'yahoo-mail-mcp',
      version: process.env.MCP_SERVER_VERSION || '0.1.0',
      tools: tools.map(t => t.name),
      endpoints: {
        mcp: '/mcp',
        health: '/health'
      }
    }));
    return;
  }

  // Handle GET request to /mcp - return tools list (for browser testing)
  if (pathname === '/mcp' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: { tools },
      service: 'yahoo-mail-mcp',
      version: process.env.MCP_SERVER_VERSION || '0.1.0'
    }));
    return;
  }

  // Handle POST request to /mcp - MCP JSON-RPC protocol
  if (pathname === '/mcp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const mcpRequest = JSON.parse(body);
        let response;

        if (mcpRequest.method === 'initialize') {
          // Handle initialization request from Cursor
          response = {
            jsonrpc: '2.0',
            id: mcpRequest.id || 1,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: 'yahoo-mail-mcp',
                version: process.env.MCP_SERVER_VERSION || '0.1.0'
              }
            }
          };
        } else if (mcpRequest.method === 'tools/list') {
          response = {
            jsonrpc: '2.0',
            id: mcpRequest.id || 1,
            result: { tools }
          };
        } else if (mcpRequest.method === 'tools/call') {
          try {
            const result = await executeTool(
              mcpRequest.params?.name,
              mcpRequest.params?.arguments || {},
              getIMAPClient,
              getCalDAVClient
            );
            response = {
              jsonrpc: '2.0',
              id: mcpRequest.id || 1,
              result: {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
              }
            };
          } catch (error) {
            response = {
              jsonrpc: '2.0',
              id: mcpRequest.id || 1,
              error: {
                code: -32603,
                message: error instanceof Error ? error.message : String(error)
              }
            };
          }
        } else {
          response = {
            jsonrpc: '2.0',
            id: mcpRequest.id || null,
            error: { code: -32601, message: 'Method not found' }
          };
        }

        res.writeHead(200);
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : String(error)
          }
        }));
      }
    });
    return;
  }

  // 404 for unknown endpoints
  res.writeHead(404);
  res.end(JSON.stringify({ 
    error: 'Not found',
    path: pathname,
    availableEndpoints: ['/mcp', '/health', '/']
  }));
});

httpsServer.listen(port, () => {
  console.error(`Yahoo Mail MCP Server running on https://localhost:${port}/mcp`);
  console.error(`Health check: https://localhost:${port}/health`);
  console.error(`Available tools: ${tools.map(t => t.name).join(', ')}`);
});

process.on('SIGTERM', () => {
  console.error('SIGTERM received, shutting down gracefully...');
  httpsServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.error('SIGINT received, shutting down gracefully...');
  httpsServer.close(() => process.exit(0));
});
