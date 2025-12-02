#!/usr/bin/env node
/**
 * Yahoo Mail MCP Server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
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
  redirectUri: process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
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

/**
 * Get or create OAuth2 client
 */
function getOAuth2(): YahooOAuth2 {
  if (!oauth2) {
    oauth2 = new YahooOAuth2(config);
  }
  return oauth2;
}

/**
 * Get or create IMAP client
 */
async function getIMAPClient(): Promise<YahooIMAPClient> {
  if (!imapClient) {
    const oauth = getOAuth2();
    // Get email from environment or extract from client ID
    emailAddress = process.env.YAHOO_EMAIL || (config.clientId.includes('@') ? config.clientId : '');
    if (!emailAddress) {
      throw new Error('Email address not found. Please set YAHOO_EMAIL in .env file');
    }
    imapClient = new YahooIMAPClient(oauth, emailAddress, config.imapHost, config.imapPort);
  }
  return imapClient;
}

/**
 * Get or create CalDAV client
 */
async function getCalDAVClient(): Promise<YahooCalDAVClient> {
  if (!caldavClient) {
    const oauth = getOAuth2();
    caldavClient = new YahooCalDAVClient(oauth, config.caldavUrl);
  }
  return caldavClient;
}

/**
 * Initialize MCP Server
 */
const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'yahoo-mail-mcp',
    version: process.env.MCP_SERVER_VERSION || '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Define MCP Tools
 */
const tools: Tool[] = [
  {
    name: 'yahoo_mail_fetch_emails',
    description: 'Fetch emails from Yahoo Mail inbox or specified folder. Supports pagination and filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        folder: {
          type: 'string',
          description: 'Mailbox folder name (e.g., "INBOX", "Sent", "Drafts"). Defaults to INBOX.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of emails to fetch. Default: 50',
        },
        offset: {
          type: 'number',
          description: 'Number of emails to skip for pagination. Default: 0',
        },
        since: {
          type: 'string',
          description: 'ISO 8601 date string. Only fetch emails after this date.',
        },
        unreadOnly: {
          type: 'boolean',
          description: 'Only fetch unread emails. Default: false',
        },
      },
    },
  },
  {
    name: 'yahoo_mail_get_email',
    description: 'Get full content of a specific email by ID or UID.',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: {
          type: 'string',
          description: 'Email UID or message ID',
        },
        folder: {
          type: 'string',
          description: 'Folder containing the email. Defaults to INBOX.',
        },
      },
      required: ['emailId'],
    },
  },
  {
    name: 'yahoo_mail_search_emails',
    description: 'Search emails by query, sender, subject, or date range.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        folder: {
          type: 'string',
          description: 'Folder to search in. Defaults to INBOX.',
        },
        from: {
          type: 'string',
          description: 'Filter by sender email address',
        },
        subject: {
          type: 'string',
          description: 'Filter by subject line',
        },
        dateRange: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
            },
            end: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results. Default: 50',
        },
      },
    },
  },
  {
    name: 'yahoo_calendar_list_calendars',
    description: 'List all available Yahoo calendars for the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'yahoo_calendar_fetch_events',
    description: 'Fetch calendar events from Yahoo Calendar within a date range.',
    inputSchema: {
      type: 'object',
      properties: {
        calendarId: {
          type: 'string',
          description: 'Specific calendar ID. If not provided, fetches from all calendars.',
        },
        startDate: {
          type: 'string',
          description: 'Start date (ISO 8601 format)',
          format: 'date-time',
        },
        endDate: {
          type: 'string',
          description: 'End date (ISO 8601 format)',
          format: 'date-time',
        },
      },
      required: ['startDate', 'endDate'],
    },
  },
];

/**
 * Handle ListTools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

/**
 * Handle CallTool request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'yahoo_mail_fetch_emails': {
        const client = await getIMAPClient();
        const params = {
          folder: args?.folder as string | undefined,
          limit: args?.limit as number | undefined,
          offset: args?.offset as number | undefined,
          since: args?.since ? new Date(args.since as string) : undefined,
          unreadOnly: args?.unreadOnly as boolean | undefined,
        };
        
        const emails = await client.fetchEmails(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: emails.length,
                emails: emails.map(email => ({
                  id: email.id,
                  uid: email.uid,
                  subject: email.subject,
                  from: email.from,
                  to: email.to,
                  date: email.date.toISOString(),
                  unread: !email.flags?.includes('\\Seen'),
                  snippet: email.text?.substring(0, 200) || email.html?.substring(0, 200) || '',
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'yahoo_mail_get_email': {
        const client = await getIMAPClient();
        const emailId = args?.emailId as string;
        const folder = (args?.folder as string) || 'INBOX';
        
        const email = await client.getEmail(emailId, folder);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                email: {
                  id: email.id,
                  uid: email.uid,
                  messageId: email.messageId,
                  subject: email.subject,
                  from: email.from,
                  to: email.to,
                  cc: email.cc,
                  bcc: email.bcc,
                  date: email.date.toISOString(),
                  text: email.text,
                  html: email.html,
                  attachments: email.attachments?.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: att.size,
                  })),
                  flags: email.flags,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'yahoo_mail_search_emails': {
        const client = await getIMAPClient();
        const params: any = {
          query: args?.query as string | undefined,
          folder: args?.folder as string | undefined,
          from: args?.from as string | undefined,
          subject: args?.subject as string | undefined,
          limit: args?.limit as number | undefined,
        };
        
        if (args?.dateRange) {
          const dateRange = args.dateRange as { start?: string; end?: string };
          params.dateRange = {
            start: dateRange.start ? new Date(dateRange.start) : undefined,
            end: dateRange.end ? new Date(dateRange.end) : undefined,
          };
        }
        
        const emails = await client.searchEmails(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: emails.length,
                emails: emails.map(email => ({
                  id: email.id,
                  uid: email.uid,
                  subject: email.subject,
                  from: email.from,
                  to: email.to,
                  date: email.date.toISOString(),
                  snippet: email.text?.substring(0, 200) || email.html?.substring(0, 200) || '',
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'yahoo_calendar_list_calendars': {
        const client = await getCalDAVClient();
        const calendars = await client.listCalendars();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: calendars.length,
                calendars: calendars.map(cal => ({
                  id: cal.id,
                  name: cal.name,
                  description: cal.description,
                  color: cal.color,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'yahoo_calendar_fetch_events': {
        const client = await getCalDAVClient();
        const calendarId = args?.calendarId as string | undefined;
        const startDate = new Date(args?.startDate as string);
        const endDate = new Date(args?.endDate as string);
        
        const events = await client.fetchEvents({
          calendarId,
          startDate,
          endDate,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: events.length,
                events: events.map(event => ({
                  id: event.id,
                  summary: event.summary,
                  description: event.description,
                  start: event.start.toISOString(),
                  end: event.end.toISOString(),
                  location: event.location,
                  organizer: event.organizer,
                  status: event.status,
                })),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`Error in tool ${name}:`, errorMessage, errorStack);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: 'Tool execution failed',
            tool: name,
            message: errorMessage,
            ...(errorStack && { stack: errorStack }),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Yahoo Mail MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
