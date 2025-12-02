# How to Get Your Yahoo OAuth2 Credentials

## Quick Guide

### Option 1: Use the Interactive Script (Recommended)

```bash
npm install  # If you haven't already
npm run get-credentials
```

This will guide you through the process step-by-step.

### Option 2: Manual Setup

## Step-by-Step Instructions

### Step 1: Apply for Yahoo Developer Access

1. **Visit**: https://senders.yahooinc.com/developer/developer-access/
2. **Fill out the application form** with:
   - Application purpose: "MCP server for accessing Yahoo Mail and Calendar via IMAP/CalDAV"
   - Your contact information
   - Compliance with Yahoo's security and privacy policies
3. **Wait for approval** (this can take days or weeks)

### Step 2: Create an OAuth2 Application

Once approved:

1. **Sign in to Yahoo Developer Console**:
   - Go to: https://developer.yahoo.com/
   - Or search for "Yahoo Developer Network"

2. **Navigate to App Management**:
   - Look for "My Apps", "App Management", or "Create App" section
   - Click "Create App" or "Register Application"

3. **Fill in Application Details**:
   - **Application Name**: `Yahoo Mail MCP Server` (or any name you prefer)
   - **Description**: `MCP server for accessing Yahoo Mail and Calendar`
   - **Home Page URL**: `http://localhost:3000` (or your actual URL)
   - **Redirect URI**: `http://localhost:3000/oauth/callback`
     - ⚠️ **Important**: This must match exactly in your `.env` file
     - You can add multiple redirect URIs if needed

4. **Select API Permissions/Scopes**:
   - Check **"Mail"** (for IMAP access)
   - Check **"Calendar"** (for CalDAV access)
   - For Phase 2 (sending emails), you'll also need write permissions

5. **Submit and Get Credentials**:
   - After submitting, you'll receive:
     - **Client ID** (also called Application ID)
     - **Client Secret**
   - ⚠️ **Save these securely** - the Client Secret is shown only once!

### Step 3: Update Your .env File

1. **Open `.env` file** in the project root

2. **Fill in your credentials**:
   ```env
   YAHOO_CLIENT_ID=your_actual_client_id_here
   YAHOO_CLIENT_SECRET=your_actual_client_secret_here
   YAHOO_REDIRECT_URI=http://localhost:3000/oauth/callback
   ```

3. **Verify all settings** match your Yahoo Developer Console configuration

### Step 4: Test OAuth Flow

Run the OAuth flow helper:

```bash
npm run oauth-flow
```

This will:
1. Generate an authorization URL
2. Open it in your browser
3. Guide you through completing the authorization
4. Exchange the code for access tokens

## Troubleshooting

### "Application not found" or "Invalid client"
- Check that your Client ID and Secret are correct
- Verify you copied them without extra spaces
- Make sure your application is approved in Yahoo Developer Console

### "Redirect URI mismatch"
- The redirect URI in `.env` must **exactly match** the one in Yahoo Developer Console
- Check for trailing slashes, http vs https, etc.
- Common issues:
  - `http://localhost:3000/oauth/callback` vs `http://localhost:3000/oauth/callback/`
  - `http://` vs `https://`

### "Authorization code expired"
- Authorization codes expire quickly (usually within minutes)
- If you see this error, start the OAuth flow again and complete it quickly

### Can't find "Create App" in Yahoo Developer Console
- Yahoo's developer interface may have changed
- Look for:
  - "My Apps"
  - "App Management"
  - "Applications"
  - "Register App"
- If still not found, check Yahoo's current developer documentation

### Don't have Developer Access yet
- You must apply and be approved first
- The application process can take time
- Check your email for approval notification
- Re-apply if your application was denied

## Important Notes

1. **Never commit your `.env` file** - it contains secrets!
2. **Client Secret is shown only once** - save it immediately
3. **Redirect URI must match exactly** - check both places
4. **Authorization codes expire quickly** - complete the flow promptly
5. **Tokens need secure storage** - implement token storage in `src/oauth2.ts`

## Next Steps

After getting credentials:
1. ✅ Update `.env` file with your credentials
2. ✅ Run `npm run oauth-flow` to get access tokens
3. ✅ Implement secure token storage (see TODO in `src/oauth2.ts`)
4. ✅ Test IMAP connection
5. ✅ Test CalDAV connection

## Resources

- [Yahoo Developer Access Application](https://senders.yahooinc.com/developer/developer-access/)
- [Yahoo Developer Network](https://developer.yahoo.com/)
- [OAuth2 Documentation](https://oauth.net/2/)

