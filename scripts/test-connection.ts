#!/usr/bin/env tsx
/**
 * Test connection to Yahoo Mail using credentials from .env
 */

import * as dotenv from 'dotenv';
import axios from 'axios';
import { YahooOAuth2 } from '../src/oauth2.js';
import type { YahooConfig } from '../src/types.js';

dotenv.config();

async function testConnection() {
  console.log('='.repeat(60));
  console.log('Yahoo Mail MCP - Connection Test');
  console.log('='.repeat(60));
  console.log('\n');

  // Check if credentials are set
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  const redirectUri = process.env.YAHOO_REDIRECT_URI;

  console.log('Step 1: Checking credentials...');
  console.log('--------------------------------\n');

  if (!clientId || clientId === 'your_yahoo_client_id_here' || clientId.trim() === '') {
    console.error('❌ YAHOO_CLIENT_ID is not set or still has placeholder value');
    console.log('   Please update .env file with your Client ID\n');
    process.exit(1);
  }

  if (!clientSecret || clientSecret === 'your_yahoo_client_secret_here' || clientSecret.trim() === '') {
    console.error('❌ YAHOO_CLIENT_SECRET is not set or still has placeholder value');
    console.log('   Please update .env file with your Client Secret\n');
    process.exit(1);
  }

  console.log('✅ YAHOO_CLIENT_ID is set:', clientId.substring(0, 10) + '...');
  console.log('✅ YAHOO_CLIENT_SECRET is set:', clientSecret.substring(0, 10) + '...');
  console.log('✅ YAHOO_REDIRECT_URI:', redirectUri || 'http://localhost:3000/oauth/callback');
  console.log('');

  // Create config
  const config: YahooConfig = {
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: redirectUri || 'http://localhost:3000/oauth/callback',
    imapHost: process.env.YAHOO_IMAP_HOST || 'imap.mail.yahoo.com',
    imapPort: parseInt(process.env.YAHOO_IMAP_PORT || '993', 10),
    caldavUrl: process.env.YAHOO_CALDAV_URL || 'https://caldav.calendar.yahoo.com',
    smtpHost: process.env.YAHOO_SMTP_HOST || 'smtp.mail.yahoo.com',
    smtpPort: parseInt(process.env.YAHOO_SMTP_PORT || '587', 10),
  };

  console.log('Step 2: Testing OAuth2 configuration...');
  console.log('---------------------------------------\n');

  const oauth2 = new YahooOAuth2(config);

  try {
    // Test 1: Generate authorization URL
    console.log('Test 1: Generating authorization URL...');
    const authUrl = oauth2.getAuthorizationUrl('test-state');
    console.log('✅ Authorization URL generated successfully');
    console.log('   URL:', authUrl.substring(0, 80) + '...\n');

    // Test 2: Verify URL is valid
    const urlObj = new URL(authUrl);
    if (urlObj.hostname === 'api.login.yahoo.com' && urlObj.searchParams.has('client_id')) {
      console.log('✅ Authorization URL structure is valid');
      console.log('   Host:', urlObj.hostname);
      console.log('   Has client_id:', urlObj.searchParams.has('client_id'));
      console.log('   Has redirect_uri:', urlObj.searchParams.has('redirect_uri'));
      console.log('   Has response_type:', urlObj.searchParams.has('response_type'));
      console.log('   Scopes:', urlObj.searchParams.get('scope') || 'not set');
      console.log('');
    } else {
      console.error('❌ Authorization URL structure is invalid');
      process.exit(1);
    }

    // Test 3: Try to validate client credentials with Yahoo
    console.log('Step 3: Validating credentials with Yahoo...');
    console.log('---------------------------------------------\n');

    console.log('Note: To fully validate credentials, you need to complete OAuth flow.');
    console.log('This test verifies the configuration, but actual validation requires:');
    console.log('  1. Generating authorization URL (✅ done above)');
    console.log('  2. User authorization (needs browser)');
    console.log('  3. Token exchange (needs authorization code)');
    console.log('');

    // We can't fully test without user interaction, but we can check if the endpoints are reachable
    console.log('Test 2: Checking Yahoo OAuth endpoints accessibility...');
    try {
      const response = await axios.get('https://api.login.yahoo.com/', {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });
      console.log('✅ Yahoo OAuth endpoint is reachable');
      console.log('   Status:', response.status);
      console.log('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.error('❌ Cannot reach Yahoo OAuth endpoint');
          console.error('   Check your internet connection');
          process.exit(1);
        } else {
          // Other errors might be OK (like 404, which means server is up)
          console.log('⚠️  Yahoo OAuth endpoint response:', error.response?.status || error.message);
          console.log('   (This might be normal - endpoint exists but requires specific requests)\n');
        }
      }
    }

    // Summary
    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Credentials are configured');
    console.log('✅ OAuth2 client initialized');
    console.log('✅ Authorization URL generation works');
    console.log('✅ Yahoo endpoints are reachable');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Run: npm run oauth-flow');
    console.log('2. Complete the OAuth authorization in your browser');
    console.log('3. Get access tokens for IMAP/CalDAV connections');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during connection test:');
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

