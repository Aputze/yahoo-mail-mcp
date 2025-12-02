# Implementation Guide

This guide walks through building the Yahoo Mail MCP server step by step.

## Step 1: Apply for Yahoo Developer Access

1. Visit: https://senders.yahooinc.com/developer/developer-access/
2. Fill out the application form with:
   - Application purpose
   - Security and privacy compliance information
   - Expected usage patterns
3. Wait for approval (can take several days/weeks)

## Step 2: Set Up OAuth2 Application

Once approved:
1. Create an OAuth2 application in Yahoo Developer Console
2. Configure redirect URIs (e.g., `http://localhost:3000/oauth/callback`)
3. Note your Client ID and Client Secret
4. Update `.env` file with credentials

## Step 3: Implement OAuth2 Flow

### Key Components:

1. **Authorization URL Generation**
   ```typescript
   // Generate Yahoo OAuth authorization URL
   const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?
     client_id=${CLIENT_ID}&
     redirect_uri=${REDIRECT_URI}&
     response_type=code&
     scope=mail-r%20cal-r`;
   ```

2. **Token Exchange**
   - Exchange authorization code for access token
   - Store refresh token for token renewal
   - Implement token refresh logic

3. **Token Storage**
   - Store tokens securely (encrypted, environment-specific)
   - Never commit tokens to version control

## Step 4: Implement IMAP Client

### Using `imap` npm package:

```typescript
import Imap from 'imap';

// Connect with OAuth2
const imap = new Imap({
  user: emailAddress,
  xoauth2: accessToken,
  host: 'imap.mail.yahoo.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

// Fetch emails
imap.once('ready', () => {
  imap.openBox('INBOX', false, (err, box) => {
    // Fetch emails with pagination
  });
});
```

### Key Features to Implement:

1. **List Mailboxes** - Get all available folders
2. **Fetch Emails** - With pagination support (Yahoo has specific pagination requirements)
3. **Search Emails** - Filter by date, subject, sender, etc.
4. **Parse Email Content** - Use `mailparser` to parse email bodies

## Step 5: Implement CalDAV Client

### Using `dav` npm package:

```typescript
import { createDAVClient } from 'dav';

const client = createDAVClient({
  baseUrl: 'https://caldav.calendar.yahoo.com',
  credentials: {
    accessToken: accessToken
  }
});

// Fetch calendar events
const calendars = await client.fetchCalendars();
const events = await client.fetchCalendarObjects({
  calendar: calendar,
  timeRange: {
    start: startDate,
    end: endDate
  }
});
```

### Key Features to Implement:

1. **List Calendars** - Get user's calendars
2. **Fetch Events** - With date range filtering
3. **Parse iCalendar** - Parse .ics format events

## Step 6: Create MCP Server Structure

### MCP Tools to Implement:

1. **`yahoo_mail_fetch_emails`**
   - Parameters: folder, limit, offset, filters
   - Returns: List of emails with metadata

2. **`yahoo_mail_get_email`**
   - Parameters: emailId, folder
   - Returns: Full email content

3. **`yahoo_mail_search_emails`**
   - Parameters: query, folder, dateRange
   - Returns: Matching emails

4. **`yahoo_calendar_fetch_events`**
   - Parameters: calendarId, startDate, endDate
   - Returns: Calendar events

5. **`yahoo_calendar_list_calendars`**
   - Parameters: none
   - Returns: Available calendars

## Step 7: Error Handling

Implement robust error handling for:
- OAuth token expiration (auto-refresh)
- Network timeouts
- Yahoo API rate limits
- Invalid credentials
- IMAP/CalDAV connection failures

## Step 8: Testing

1. **Unit Tests** - Test individual components
2. **Integration Tests** - Test OAuth flow end-to-end
3. **MCP Protocol Tests** - Verify MCP tool responses
4. **Manual Testing** - Test with real Yahoo account

## Phase 2: Send Emails

### Implement SMTP Client:

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.yahoo.com',
  port: 587,
  secure: false,
  auth: {
    type: 'OAuth2',
    user: emailAddress,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: refreshToken,
    accessToken: accessToken
  }
});

await transporter.sendMail({
  from: emailAddress,
  to: recipient,
  subject: subject,
  text: textBody,
  html: htmlBody
});
```

### Add MCP Tool:

- **`yahoo_mail_send_email`**
  - Parameters: to, subject, body, htmlBody, attachments
  - Returns: Send status

## Common Challenges

1. **OAuth2 Token Refresh** - Implement automatic refresh before expiration
2. **IMAP Pagination** - Yahoo has specific pagination requirements (check their docs)
3. **CalDAV Authentication** - Some libraries may need custom OAuth2 implementation
4. **Error Handling** - Yahoo may return different error codes for different scenarios
5. **Rate Limiting** - Implement exponential backoff for rate limit errors

## Resources

- Yahoo IMAP Pagination: https://senders.yahooinc.com/static/Yahoo_Aol%20IMAP%20Pagination%20and%20Mail%20Sync-7564bd8d996168f4b38eee1440784515.pdf
- OAuth2 for Yahoo: Check Yahoo developer documentation
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk

