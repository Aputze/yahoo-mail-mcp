# Testing Your Yahoo Credentials

## Quick Test

After updating your credentials in `.env`, run:

```bash
npm run test-creds
```

Or directly:
```bash
node test-credentials.js
```

This will:
- ✅ Verify your credentials are set (not placeholders)
- ✅ Generate the OAuth authorization URL
- ✅ Show you the next steps

## What the Test Checks

1. **Client ID** - Must be set and not the placeholder value
2. **Client Secret** - Must be set and not the placeholder value  
3. **Redirect URI** - Shows what's configured
4. **OAuth URL** - Generates the authorization URL you need

## Expected Output

If your credentials are set correctly, you should see:

```
============================================================
Yahoo Mail MCP - Credential Check
============================================================

Checking credentials from .env file...

✅ YAHOO_CLIENT_ID is set: dj0yJmk9aX...XyZ1
✅ YAHOO_CLIENT_SECRET is set: a1b2c3d4e5f...xyz
✅ YAHOO_REDIRECT_URI: http://localhost:3000/oauth/callback

Generating OAuth authorization URL...
✅ Authorization URL generated successfully

Full URL:
https://api.login.yahoo.com/oauth2/request_auth?client_id=...
```

## Next Steps After Successful Test

1. **Copy the authorization URL** from the output
2. **Open it in your browser**
3. **Log in to Yahoo** and authorize the application
4. **Copy the authorization code** from the redirect URL
5. **Run the OAuth flow**:
   ```bash
   npm run oauth-flow
   ```
6. **Paste the authorization code** when prompted
7. **Get your access tokens** for IMAP/CalDAV

## Troubleshooting

### "Client ID not set or placeholder"
- Open `.env` file
- Make sure `YAHOO_CLIENT_ID=` has your actual client ID (not `your_yahoo_client_id_here`)

### "Client Secret not set or placeholder"
- Open `.env` file
- Make sure `YAHOO_CLIENT_SECRET=` has your actual secret (not `your_yahoo_client_secret_here`)

### No output from command
- Make sure you're in the project directory
- Try: `node --version` to verify Node.js is installed
- Check that `.env` file exists in the project root

### Getting credentials
If you don't have credentials yet, see `GET_CREDENTIALS.md` for instructions on how to get them from Yahoo.

