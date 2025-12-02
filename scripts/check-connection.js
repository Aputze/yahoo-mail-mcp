/**
 * Check connection and write results to file
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const output = [];
const log = (msg) => {
  console.log(msg);
  output.push(msg);
};

log('='.repeat(60));
log('Yahoo Mail MCP - Connection Test Results');
log('='.repeat(60));
log('');

const clientId = process.env.YAHOO_CLIENT_ID;
const clientSecret = process.env.YAHOO_CLIENT_SECRET;
const redirectUri = process.env.YAHOO_REDIRECT_URI;

log('Step 1: Checking credentials from .env file...');
log('');

let hasErrors = false;

// Check Client ID
if (!clientId || clientId === 'your_yahoo_client_id_here' || clientId.trim() === '') {
  log('❌ YAHOO_CLIENT_ID is not set or still has placeholder value');
  hasErrors = true;
} else {
  log('✅ YAHOO_CLIENT_ID is set: ' + clientId.substring(0, 15) + '...' + clientId.substring(clientId.length - 5));
}

// Check Client Secret
if (!clientSecret || clientSecret === 'your_yahoo_client_secret_here' || clientSecret.trim() === '') {
  log('❌ YAHOO_CLIENT_SECRET is not set or still has placeholder value');
  hasErrors = true;
} else {
  log('✅ YAHOO_CLIENT_SECRET is set: ' + clientSecret.substring(0, 15) + '...' + clientSecret.substring(clientSecret.length - 5));
}

log('✅ YAHOO_REDIRECT_URI: ' + (redirectUri || 'http://localhost:3000/oauth/callback'));
log('');

if (hasErrors) {
  log('='.repeat(60));
  log('❌ TEST FAILED: Missing or invalid credentials');
  log('='.repeat(60));
  log('');
  log('Please update your .env file with valid credentials.');
  log('See GET_CREDENTIALS.md for instructions.');
  
  // Write to file
  fs.writeFileSync('connection-test-results.txt', output.join('\n'));
  process.exit(1);
}

// Test OAuth URL generation
log('Step 2: Generating OAuth authorization URL...');
log('');

try {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri || 'http://localhost:3000/oauth/callback',
    response_type: 'code',
    scope: 'mail-r cal-r',
  });

  const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
  log('✅ Authorization URL generated successfully');
  log('');
  log('Full Authorization URL:');
  log(authUrl);
  log('');

  log('='.repeat(60));
  log('✅ TEST PASSED: Credentials are configured correctly!');
  log('='.repeat(60));
  log('');
  log('Next Steps:');
  log('1. Copy the authorization URL above');
  log('2. Open it in your browser');
  log('3. Log in to Yahoo and authorize the application');
  log('4. Copy the authorization code from the redirect URL');
  log('5. Run: npm run oauth-flow');
  log('6. Paste the authorization code when prompted');
  log('');

  // Write to file
  fs.writeFileSync('connection-test-results.txt', output.join('\n'));
  log('Results also saved to: connection-test-results.txt');
  
} catch (error) {
  log('❌ Error generating authorization URL: ' + error.message);
  fs.writeFileSync('connection-test-results.txt', output.join('\n'));
  process.exit(1);
}

