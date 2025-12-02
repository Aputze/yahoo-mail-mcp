# Quick Start Guide

## What You Need to Build a Yahoo Mail MCP Server

### 1. **Yahoo Developer Access** ⚠️ REQUIRED FIRST STEP
   - Apply at: https://senders.yahooinc.com/developer/developer-access/
   - Wait for approval (can take days/weeks)
   - Create OAuth2 application
   - Get Client ID and Client Secret

### 2. **Technical Stack**

#### Core Dependencies:
- **MCP SDK**: `@modelcontextprotocol/sdk` - MCP server framework
- **IMAP**: `imap` + `mailparser` - For fetching emails
- **CalDAV**: `dav` or manual HTTP - For fetching calendars  
- **OAuth2**: `axios` + custom implementation - For authentication
- **SMTP** (Phase 2): `nodemailer` - For sending emails

#### Language Options:
- **TypeScript/Node.js** (recommended for MCP)
- **Python** (alternative: `mcp` Python SDK)

### 3. **Yahoo Mail Infrastructure**

#### Email (IMAP):
- Server: `imap.mail.yahoo.com:993`
- Protocol: IMAP with XOAUTH2 (OAuth2)
- Authentication: OAuth2 access token

#### Calendar (CalDAV):
- URL: `https://caldav.calendar.yahoo.com`
- Protocol: CalDAV with OAuth2
- Format: iCalendar (.ics)

#### Email Sending (SMTP - Phase 2):
- Server: `smtp.mail.yahoo.com:587` (TLS) or `:465` (SSL)
- Protocol: SMTP with XOAUTH2

### 4. **Key Implementation Steps**

#### Phase 1: Fetching
1. ✅ Set up OAuth2 flow (authorization → token exchange → refresh)
2. ✅ Implement IMAP client with XOAUTH2
3. ✅ Implement CalDAV client with OAuth2
4. ✅ Create MCP tools for:
   - `yahoo_mail_fetch_emails`
   - `yahoo_mail_get_email`
   - `yahoo_mail_search_emails`
   - `yahoo_calendar_fetch_events`
   - `yahoo_calendar_list_calendars`

#### Phase 2: Sending
5. ⏳ Implement SMTP client with XOAUTH2
6. ⏳ Add `yahoo_mail_send_email` tool

### 5. **Current Project Status**

✅ **Created:**
- Project structure with TypeScript
- Package.json with all dependencies
- Skeleton implementations for:
  - MCP server (`src/server.ts`)
  - OAuth2 handler (`src/oauth2.ts`)
  - IMAP client (`src/imap-client.ts`)
  - CalDAV client (`src/caldav-client.ts`)
  - Type definitions (`src/types.ts`)
- Configuration files (tsconfig.json, .gitignore, .env.example)
- Documentation (README, SETUP, IMPLEMENTATION_GUIDE)

⏳ **To Do:**
- Get Yahoo developer approval
- Complete OAuth2 token storage (currently stubbed)
- Test and fix IMAP XOAUTH2 authentication
- Test and fix CalDAV OAuth2 (may need manual HTTP implementation)
- Implement proper iCalendar parsing (consider `ical.js`)
- Add error handling and logging
- Write tests

### 6. **Next Actions**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Add your Yahoo OAuth2 credentials (after approval)

3. **Implement missing pieces:**
   - Secure token storage in `src/oauth2.ts`
   - Test IMAP connection in `src/imap-client.ts`
   - Test CalDAV connection in `src/caldav-client.ts`
   - Wire everything in `src/server.ts`

4. **Build and test:**
   ```bash
   npm run build
   npm start
   ```

### 7. **Common Challenges**

- **OAuth2**: Token refresh, secure storage, redirect URI matching
- **IMAP XOAUTH2**: Some libraries need custom OAuth2 implementation
- **CalDAV OAuth2**: May require manual HTTP requests instead of library
- **Yahoo Pagination**: Specific IMAP pagination requirements
- **iCalendar Parsing**: Use proper parser like `ical.js`

### 8. **Resources**

- [Yahoo Developer Access](https://senders.yahooinc.com/developer/developer-access/)
- [Yahoo IMAP Pagination Docs](https://senders.yahooinc.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [OAuth2 Spec](https://oauth.net/2/)

---

**Status**: Project skeleton ready. Waiting for Yahoo developer approval to proceed with testing.

