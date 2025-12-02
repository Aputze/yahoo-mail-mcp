#!/usr/bin/env tsx
/**
 * Helper script to guide you through getting Yahoo OAuth2 credentials
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('Yahoo OAuth2 Credentials Setup');
  console.log('='.repeat(60));
  console.log('\n');

  console.log('STEP 1: Apply for Yahoo Developer Access');
  console.log('----------------------------------------');
  console.log('1. Visit: https://senders.yahooinc.com/developer/developer-access/');
  console.log('2. Fill out the application form');
  console.log('3. Wait for approval (this can take days or weeks)\n');

  const hasApproval = await question('Have you been approved for Yahoo Developer Access? (yes/no): ');
  
  if (hasApproval.toLowerCase() !== 'yes' && hasApproval.toLowerCase() !== 'y') {
    console.log('\n⚠️  You need Yahoo Developer approval first.');
    console.log('Please apply and come back once you have approval.\n');
    rl.close();
    process.exit(0);
  }

  console.log('\nSTEP 2: Create OAuth2 Application');
  console.log('-----------------------------------');
  console.log('1. Sign in to: https://developer.yahoo.com/');
  console.log('2. Go to "My Apps" or "App Management"');
  console.log('3. Click "Create App" or "Register Application"');
  console.log('4. Fill in the details:\n');
  console.log('   Application Name: Yahoo Mail MCP Server');
  console.log('   Description: MCP server for accessing Yahoo Mail and Calendar');
  console.log('   Home Page URL: http://localhost:3000 (or your URL)');
  console.log('   Redirect URI: http://localhost:3000/oauth/callback');
  console.log('   Scopes: Select "mail" and "calendar" permissions\n');

  console.log('After creating the app, you will receive:');
  console.log('  - Client ID (Application ID)');
  console.log('  - Client Secret\n');

  const clientId = await question('Enter your Client ID (or press Enter to skip): ');
  const clientSecret = await question('Enter your Client Secret (or press Enter to skip): ');
  const redirectUri = await question('Enter your Redirect URI (default: http://localhost:3000/oauth/callback): ') || 'http://localhost:3000/oauth/callback';

  if (!clientId || !clientSecret) {
    console.log('\n⚠️  Missing credentials. Please update .env file manually when you have them.\n');
    rl.close();
    process.exit(0);
  }

  // Update .env file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  } else {
    // Create from template
    envContent = `# Yahoo OAuth2 Credentials
YAHOO_CLIENT_ID=
YAHOO_CLIENT_SECRET=
YAHOO_REDIRECT_URI=

# Yahoo IMAP Settings (for fetching emails)
YAHOO_IMAP_HOST=imap.mail.yahoo.com
YAHOO_IMAP_PORT=993

# Yahoo CalDAV Settings (for fetching calendars)
YAHOO_CALDAV_URL=https://caldav.calendar.yahoo.com

# Yahoo SMTP Settings (for sending emails - Phase 2)
YAHOO_SMTP_HOST=smtp.mail.yahoo.com
YAHOO_SMTP_PORT=587

# MCP Server Configuration
MCP_SERVER_NAME=yahoo-mail-mcp
MCP_SERVER_VERSION=0.1.0
`;
  }

  // Update credentials
  envContent = envContent.replace(
    /YAHOO_CLIENT_ID=.*/,
    `YAHOO_CLIENT_ID=${clientId}`
  );
  envContent = envContent.replace(
    /YAHOO_CLIENT_SECRET=.*/,
    `YAHOO_CLIENT_SECRET=${clientSecret}`
  );
  envContent = envContent.replace(
    /YAHOO_REDIRECT_URI=.*/,
    `YAHOO_REDIRECT_URI=${redirectUri}`
  );

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Credentials saved to .env file!\n');
  console.log('Next steps:');
  console.log('1. Verify .env file has correct values');
  console.log('2. Run the OAuth flow to get access tokens');
  console.log('3. Test the IMAP/CalDAV connections\n');

  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});

