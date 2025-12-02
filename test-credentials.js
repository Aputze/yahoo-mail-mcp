/**
 * Simple test to verify credentials are set in .env
 */

require('dotenv').config();

console.log('='.repeat(60));
console.log('Yahoo Mail MCP - Credential Check');
console.log('='.repeat(60));
console.log('\n');

const clientId = process.env.YAHOO_CLIENT_ID;
const clientSecret = process.env.YAHOO_CLIENT_SECRET;
const redirectUri = process.env.YAHOO_REDIRECT_URI;

console.log('Checking credentials from .env file...\n');

if (!clientId || clientId === 'your_yahoo_client_id_here' || clientId.trim() === '') {
  console.error('❌ YAHOO_CLIENT_ID is not set or still has placeholder value');
  process.exit(1);
} else {
  console.log('✅ YAHOO_CLIENT_ID is set:', clientId.substring(0, 15) + '...' + clientId.substring(clientId.length - 5));
}

if (!clientSecret || clientSecret === 'your_yahoo_client_secret_here' || clientSecret.trim() === '') {
  console.error('❌ YAHOO_CLIENT_SECRET is not set or still has placeholder value');
  process.exit(1);
} else {
  console.log('✅ YAHOO_CLIENT_SECRET is set:', clientSecret.substring(0, 15) + '...' + clientSecret.substring(clientSecret.length - 5));
}

console.log('✅ YAHOO_REDIRECT_URI:', redirectUri || 'http://localhost:3000/oauth/callback');
console.log('\n');

// Test OAuth URL generation
console.log('Generating OAuth authorization URL...');
const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri || 'http://localhost:3000/oauth/callback',
  response_type: 'code',
  scope: 'mail-r cal-r',
});

const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
console.log('✅ Authorization URL generated successfully');
console.log('\nFull URL:');
console.log(authUrl);
console.log('\n');

console.log('='.repeat(60));
console.log('Next Steps:');
console.log('='.repeat(60));
console.log('1. Copy the authorization URL above');
console.log('2. Open it in your browser');
console.log('3. Authorize the application');
console.log('4. Copy the authorization code from the redirect URL');
console.log('5. Run: npm run oauth-flow');
console.log('\n');

