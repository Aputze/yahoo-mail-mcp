# Yahoo Mail MCP Server

An MCP (Model Context Protocol) server for integrating with Yahoo Mail to fetch emails and calendars, with future support for sending emails.

## Overview

This MCP server provides tools to interact with Yahoo Mail services via:
- **IMAP** for fetching emails (with OAuth2 authentication)
- **CalDAV** for fetching calendar events (with OAuth2 authentication)
- **SMTP** for sending emails (Phase 2 - future)

## Prerequisites

### 1. Yahoo Developer Access

Yahoo Mail does not provide a direct REST API. Instead, you must:
- Apply for developer access at: https://senders.yahooinc.com/developer/developer-access/
- Get approval for IMAP/CalDAV access
- Demonstrate compliance with Yahoo's security and privacy policies

### 2. OAuth2 Credentials

Once approved, you'll need:
- **Client ID** - Your application's client identifier
- **Client Secret** - Your application's client secret
- **Redirect URI** - URL where Yahoo will redirect after OAuth authorization

### 3. Technical Requirements

- **Node.js** 18+ or **Python** 3.10+
- **OAuth2** authentication flow implementation
- **IMAP client library** (for email fetching)
- **CalDAV client library** (for calendar fetching)
- **MCP Server SDK** (TypeScript: `@modelcontextprotocol/sdk` or Python equivalent)

## Yahoo Mail Server Details

### IMAP (Email Fetching)
- **Server:** `imap.mail.yahoo.com`
- **Port:** 993
- **Security:** SSL/TLS
- **Authentication:** OAuth2 (XOAUTH2)

### CalDAV (Calendar Fetching)
- **URL:** `https://caldav.calendar.yahoo.com`
- **Authentication:** OAuth2

### SMTP (Sending Emails - Phase 2)
- **Server:** `smtp.mail.yahoo.com`
- **Port:** 465 (SSL) or 587 (TLS)
- **Authentication:** OAuth2 (XOAUTH2)

## Project Structure

```
Yahoo_mail_MCP/
├── src/
│   ├── server.ts          # Main MCP server implementation
│   ├── oauth2.ts          # OAuth2 authentication handling
│   ├── imap-client.ts     # IMAP email fetching
│   ├── caldav-client.ts   # CalDAV calendar fetching
│   └── types.ts           # TypeScript type definitions
├── config/
│   └── config.example.ts  # Example configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Steps

### Phase 1: Email & Calendar Fetching

1. **Set up OAuth2 flow**
   - Implement authorization URL generation
   - Handle callback and token exchange
   - Store and refresh access tokens

2. **Implement IMAP client**
   - Connect to Yahoo IMAP server using OAuth2
   - Fetch emails with pagination support
   - Support filtering and searching

3. **Implement CalDAV client**
   - Connect to Yahoo CalDAV server using OAuth2
   - Fetch calendar events
   - Support date range queries

4. **Create MCP tools**
   - `fetch_emails` - List/fetch emails
   - `fetch_calendar_events` - List/fetch calendar events
   - `get_email` - Get specific email by ID
   - `search_emails` - Search emails by criteria

### Phase 2: Send Emails (Future)

5. **Implement SMTP client**
   - Connect to Yahoo SMTP server using OAuth2
   - Send emails with proper formatting

6. **Add MCP tools**
   - `send_email` - Send email via Yahoo SMTP

## Environment Variables

Create a `.env` file (see `.env.example`):

```env
YAHOO_CLIENT_ID=your_client_id
YAHOO_CLIENT_SECRET=your_client_secret
YAHOO_REDIRECT_URI=http://localhost:3000/callback
YAHOO_IMAP_HOST=imap.mail.yahoo.com
YAHOO_IMAP_PORT=993
YAHOO_CALDAV_URL=https://caldav.calendar.yahoo.com
YAHOO_SMTP_HOST=smtp.mail.yahoo.com
YAHOO_SMTP_PORT=587
```

## Key Libraries Needed

### TypeScript/Node.js Approach:
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "imap": "^0.8.19",
  "mailparser": "^3.6.5",
  "dav": "^1.11.0",  // For CalDAV
  "nodemailer": "^6.9.7",  // For SMTP (Phase 2)
  "oauth2": "latest",
  "dotenv": "^16.3.1"
}
```

### Python Approach:
```txt
mcp>=1.0.0
imaplib (built-in)
email (built-in)
caldav>=1.3.0
smtplib (built-in)
requests-oauthlib>=1.3.0
python-dotenv>=1.0.0
```

## OAuth2 Flow

1. **Authorization Request**: Redirect user to Yahoo OAuth authorization endpoint
2. **User Authorization**: User grants permissions
3. **Authorization Code**: Yahoo redirects with authorization code
4. **Token Exchange**: Exchange code for access token and refresh token
5. **API Access**: Use access token to authenticate IMAP/CalDAV requests
6. **Token Refresh**: Use refresh token when access token expires

## Security Considerations

- Store OAuth tokens securely (encrypted)
- Never commit `.env` files or credentials
- Implement proper token refresh logic
- Follow Yahoo's rate limiting guidelines
- Comply with Yahoo's privacy policies
- Use HTTPS for all OAuth redirects

## Testing

1. Set up test Yahoo account with developer access
2. Test OAuth2 flow
3. Test IMAP connection and email fetching
4. Test CalDAV connection and calendar fetching
5. Test error handling and edge cases

## Resources

- [Yahoo Developer Access Application](https://senders.yahooinc.com/developer/developer-access/)
- [Yahoo IMAP Documentation](https://senders.yahooinc.com/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [OAuth2 Specification](https://oauth.net/2/)

## Docker Deployment

The project includes Docker support for easy deployment.

### Quick Start with Docker

1. **Using Docker Compose** (Recommended):
   ```bash
   # Copy example env file
   cp .docker.env.example .env
   
   # Edit .env with your credentials
   # Then start the container
   docker-compose up -d
   ```

2. **Using Docker CLI**:
   ```bash
   docker build -t yahoo-mail-mcp:latest .
   docker run -d --name yahoo-mail-mcp --env-file .env yahoo-mail-mcp:latest
   ```

For detailed Docker deployment instructions, see [DOCKER.md](DOCKER.md).

### Docker Scripts

```bash
npm run docker:build    # Build Docker image
npm run docker:up       # Start with docker-compose
npm run docker:down     # Stop containers
npm run docker:logs     # View logs
npm run docker:dev      # Development mode with hot reload
```

## License

MIT

