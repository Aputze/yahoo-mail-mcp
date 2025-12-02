# Manual Connection Test

Since automated test output may not display properly, here's how to manually test your connection:

## Step 1: Verify Your .env File

Open your `.env` file and verify it contains:

```env
YAHOO_CLIENT_ID=your_actual_client_id_here
YAHOO_CLIENT_SECRET=your_actual_client_secret_here
YAHOO_REDIRECT_URI=http://localhost:3000/oauth/callback
```

**Important**: 
- ✅ Values should NOT be `your_yahoo_client_id_here` or `your_yahoo_client_secret_here`
- ✅ Values should be your actual credentials from Yahoo Developer Console

## Step 2: Test Credentials

Run one of these commands in your terminal:

```bash
# Option 1: Simple test
npm run test-creds

# Option 2: Detailed test  
npm run check-connection

# Option 3: Direct Node.js
node test-credentials.js

# Option 4: Batch file (Windows)
test-connection.bat
```

## Step 3: Check Results

You should see output like:

```
============================================================
Yahoo Mail MCP - Credential Check
============================================================

✅ YAHOO_CLIENT_ID is set: dj0yJmk9aX...XyZ1
✅ YAHOO_CLIENT_SECRET is set: a1b2c3d4e5f...xyz
✅ YAHOO_REDIRECT_URI: http://localhost:3000/oauth/callback

✅ Authorization URL generated successfully

Full URL:
https://api.login.yahoo.com/oauth2/request_auth?client_id=...
```

## Step 4: If Test Passes

1. Copy the **authorization URL** from the output
2. Open it in your browser
3. Log in to Yahoo and authorize the application
4. You'll be redirected to your redirect URI with a `code` parameter
5. Copy that authorization code
6. Run: `npm run oauth-flow`
7. Paste the code when prompted

## Step 5: If Test Fails

### "Client ID not set or placeholder"
- Open `.env` file
- Make sure `YAHOO_CLIENT_ID=` has your actual Client ID
- Make sure it's NOT `your_yahoo_client_id_here`

### "Client Secret not set or placeholder"  
- Open `.env` file
- Make sure `YAHOO_CLIENT_SECRET=` has your actual Client Secret
- Make sure it's NOT `your_yahoo_client_secret_here`

### No output from commands
- Make sure Node.js is installed: `node --version`
- Make sure you're in the project directory
- Try installing dependencies: `npm install`
- Check that `.env` file exists in project root

## Quick Verification

You can also manually verify by checking these:

1. **File exists**: `.env` file should be in project root
2. **Format**: Each line should be `KEY=value` (no spaces around `=`)
3. **Values**: Should be actual credentials, not placeholders
4. **No quotes**: Values should NOT be in quotes (unless needed)

Example of CORRECT format:
```env
YAHOO_CLIENT_ID=dj0yJmk9aX...
YAHOO_CLIENT_SECRET=a1b2c3d4e5f...
```

Example of WRONG format:
```env
YAHOO_CLIENT_ID="dj0yJmk9aX..."  ❌ (quotes)
YAHOO_CLIENT_ID = dj0yJmk9aX...  ❌ (spaces)
YAHOO_CLIENT_ID=your_yahoo_client_id_here  ❌ (placeholder)
```

## Getting Credentials

If you don't have credentials yet:
1. See `GET_CREDENTIALS.md` for step-by-step instructions
2. Apply for Yahoo Developer Access
3. Create OAuth2 application in Yahoo Developer Console
4. Copy Client ID and Client Secret to `.env` file

