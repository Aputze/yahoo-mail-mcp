# Setup Instructions

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Yahoo OAuth2 credentials:
   ```env
   YAHOO_CLIENT_ID=your_client_id_here
   YAHOO_CLIENT_SECRET=your_client_secret_here
   YAHOO_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```

## Step 3: Get Yahoo Developer Access

1. Visit: https://senders.yahooinc.com/developer/developer-access/
2. Apply for IMAP/CalDAV access
3. Wait for approval
4. Create OAuth2 application in Yahoo Developer Console
5. Configure redirect URI
6. Get Client ID and Client Secret

## Step 4: Build the Project

```bash
npm run build
```

## Step 5: Implement Missing Components

The current code is a skeleton. You need to:

1. **Complete OAuth2 Implementation** (`src/oauth2.ts`)
   - Implement secure token storage
   - Test OAuth flow end-to-end

2. **Complete IMAP Client** (`src/imap-client.ts`)
   - Test XOAUTH2 authentication
   - Verify email fetching works
   - Handle Yahoo-specific pagination

3. **Complete CalDAV Client** (`src/caldav-client.ts`)
   - Implement OAuth2 authentication (might need manual HTTP requests)
   - Use proper iCalendar parser (consider `ical.js` library)
   - Test calendar fetching

4. **Wire Everything Together** (`src/server.ts`)
   - Initialize OAuth2, IMAP, and CalDAV clients
   - Implement tool handlers
   - Add error handling

## Step 6: Test OAuth Flow

1. Generate authorization URL:
   ```typescript
   const oauth2 = new YahooOAuth2(config);
   const authUrl = oauth2.getAuthorizationUrl();
   console.log('Visit:', authUrl);
   ```

2. Complete OAuth flow and get authorization code

3. Exchange code for tokens

4. Store tokens securely

## Step 7: Run the MCP Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Step 8: Connect MCP Client

Configure your MCP client (e.g., Cursor, Claude Desktop) to use this server:

```json
{
  "mcpServers": {
    "yahoo-mail": {
      "command": "node",
      "args": ["path/to/dist/server.js"],
      "env": {
        "YAHOO_CLIENT_ID": "...",
        "YAHOO_CLIENT_SECRET": "..."
      }
    }
  }
}
```

## Troubleshooting

### OAuth2 Issues
- Verify redirect URI matches exactly
- Check client ID and secret are correct
- Ensure Yahoo application is approved for IMAP/CalDAV

### IMAP Connection Issues
- Verify OAuth2 token is valid and not expired
- Check Yahoo IMAP server is accessible
- Review IMAP library XOAUTH2 implementation

### CalDAV Issues
- CalDAV might require manual HTTP implementation with OAuth2 headers
- Consider using `axios` directly for CalDAV requests
- Verify CalDAV URL and OAuth2 scopes

## Next Steps

- [ ] Complete OAuth2 token storage
- [ ] Test IMAP connection
- [ ] Test CalDAV connection
- [ ] Implement error handling
- [ ] Add logging
- [ ] Write tests
- [ ] Phase 2: Implement email sending

