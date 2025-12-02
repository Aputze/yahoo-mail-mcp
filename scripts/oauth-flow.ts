#!/usr/bin/env tsx
/**
 * OAuth2 Flow Helper - Interactive script to complete OAuth2 authorization
 */

import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { YahooOAuth2 } from '../src/oauth2.js';
import type { YahooConfig } from '../src/types.js';

dotenv.config();

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
  console.log('Yahoo OAuth2 Authorization Flow');
  console.log('='.repeat(60));
  console.log('\n');

  // Check for credentials
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;

  if (!clientId || !clientSecret || clientId === 'your_yahoo_client_id_here') {
    console.error('❌ Missing or invalid credentials in .env file');
    console.log('\nPlease run: npm run get-credentials');
    console.log('Or manually update .env file with your Client ID and Secret\n');
    rl.close();
    process.exit(1);
  }

  const config: YahooConfig = {
    clientId,
    clientSecret,
    redirectUri: redirectUri || 'http://localhost:3000/oauth/callback',
    imapHost: process.env.YAHOO_IMAP_HOST || 'imap.mail.yahoo.com',
    imapPort: parseInt(process.env.YAHOO_IMAP_PORT || '993', 10),
    caldavUrl: process.env.YAHOO_CALDAV_URL || 'https://caldav.calendar.yahoo.com',
    smtpHost: process.env.YAHOO_SMTP_HOST || 'smtp.mail.yahoo.com',
    smtpPort: parseInt(process.env.YAHOO_SMTP_PORT || '587', 10),
  };

  const oauth2 = new YahooOAuth2(config);

  console.log('STEP 1: Generate Authorization URL');
  console.log('-----------------------------------\n');
  
  const authUrl = oauth2.getAuthorizationUrl();
  
  console.log('Open this URL in your browser:');
  console.log('\n' + authUrl + '\n');
  console.log('You will be redirected to Yahoo to authorize the application.');
  console.log('After authorization, Yahoo will redirect you to:');
  console.log(redirectUri);
  console.log('\nThe redirect URL will contain a "code" parameter.');
  console.log('Example: http://localhost:3000/oauth/callback?code=ABC123...\n');

  const code = await question('Paste the authorization code from the redirect URL here: ');

  if (!code || code.trim().length === 0) {
    console.error('\n❌ No authorization code provided');
    rl.close();
    process.exit(1);
  }

  console.log('\nSTEP 2: Exchange Code for Tokens');
  console.log('----------------------------------\n');

  try {
    console.log('Exchanging authorization code for access token...');
    const tokens = await oauth2.exchangeCodeForToken(code.trim());

    console.log('✅ Successfully obtained tokens!\n');
    console.log('Access Token:', tokens.accessToken.substring(0, 20) + '...');
    console.log('Refresh Token:', tokens.refreshToken.substring(0, 20) + '...');
    console.log('Expires At:', new Date(tokens.expiresAt).toISOString());
    console.log('\n⚠️  Tokens are currently stored in memory only.');
    console.log('You need to implement secure token storage in src/oauth2.ts\n');
    
    // TODO: Save tokens to secure storage
    console.log('For now, you can manually save these tokens (see TODO in oauth2.ts)\n');

  } catch (error) {
    console.error('\n❌ Failed to exchange code for token:');
    if (error instanceof Error) {
      console.error(error.message);
      if (error.message.includes('invalid_grant')) {
        console.log('\n💡 This usually means:');
        console.log('   - The authorization code has expired (codes expire quickly)');
        console.log('   - The code has already been used');
        console.log('   - The redirect URI doesn\'t match');
        console.log('\nPlease start the flow again and use a fresh code.');
      }
    } else {
      console.error(error);
    }
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});

