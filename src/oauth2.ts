/**
 * OAuth2 Authentication Handler for Yahoo Mail
 * 
 * This is a skeleton implementation. You'll need to:
 * 1. Implement authorization URL generation
 * 2. Implement token exchange
 * 3. Implement token refresh
 * 4. Store tokens securely
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { YahooConfig, OAuthTokens } from './types.js';

export class YahooOAuth2 {
  private config: YahooConfig;
  private tokens?: OAuthTokens;

  constructor(config: YahooConfig) {
    this.config = config;
  }

  /**
   * Generate Yahoo OAuth2 authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'mail-r cal-r', // mail-r: read mail, cal-r: read calendar
      // Add mail-w cal-w for Phase 2 (send emails)
      ...(state && { state }),
    });

    return `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<OAuthTokens> {
    try {
      const response = await axios.post(
        'https://api.login.yahoo.com/oauth2/get_token',
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in, token_type } = response.data;

      this.tokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
        tokenType: token_type || 'Bearer',
      };

      // TODO: Store tokens securely (e.g., encrypted database, secure file storage)
      await this.saveTokens(this.tokens);

      return this.tokens;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<OAuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        'https://api.login.yahoo.com/oauth2/get_token',
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.tokens.refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in, token_type } = response.data;

      this.tokens = {
        accessToken: access_token,
        refreshToken: refresh_token || this.tokens.refreshToken, // Some providers don't return new refresh token
        expiresAt: Date.now() + expires_in * 1000,
        tokenType: token_type || 'Bearer',
      };

      // TODO: Update stored tokens
      await this.saveTokens(this.tokens);

      return this.tokens;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get current access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    // Load tokens if not in memory
    if (!this.tokens) {
      this.tokens = await this.loadTokens();
    }

    if (!this.tokens) {
      throw new Error('No tokens available. Please authenticate first.');
    }

    // Refresh if expired or expiring soon (within 5 minutes)
    if (Date.now() >= this.tokens.expiresAt - 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }

    return this.tokens.accessToken;
  }

  /**
   * Set tokens (e.g., after loading from storage)
   */
  setTokens(tokens: OAuthTokens): void {
    this.tokens = tokens;
  }

  /**
   * Get token storage path
   */
  private getTokenStoragePath(): string {
    // Support Docker deployments with custom token directory
    const tokenDir = process.env.YAHOO_TOKEN_DIR || path.join(os.homedir(), '.yahoo-mail-mcp');
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true, mode: 0o700 });
    }
    return path.join(tokenDir, 'tokens.json');
  }

  /**
   * Save tokens to secure storage
   */
  private async saveTokens(tokens: OAuthTokens): Promise<void> {
    try {
      const storagePath = this.getTokenStoragePath();
      // In production, encrypt this file
      fs.writeFileSync(storagePath, JSON.stringify(tokens, null, 2), {
        mode: 0o600, // Read/write for owner only
        flag: 'w',
      });
    } catch (error) {
      console.error('Failed to save tokens:', error);
      // Don't throw - tokens are still in memory
    }
  }

  /**
   * Load tokens from secure storage
   */
  private async loadTokens(): Promise<OAuthTokens | undefined> {
    try {
      const storagePath = this.getTokenStoragePath();
      if (!fs.existsSync(storagePath)) {
        return undefined;
      }
      const data = fs.readFileSync(storagePath, 'utf-8');
      const tokens = JSON.parse(data) as OAuthTokens;
      // Validate token structure
      if (tokens.accessToken && tokens.refreshToken && tokens.expiresAt) {
        return tokens;
      }
      return undefined;
    } catch (error) {
      console.error('Failed to load tokens:', error);
      return undefined;
    }
  }

  /**
   * Clear stored tokens
   */
  async clearTokens(): Promise<void> {
    this.tokens = undefined;
    try {
      const storagePath = this.getTokenStoragePath();
      if (fs.existsSync(storagePath)) {
        fs.unlinkSync(storagePath);
      }
    } catch (error) {
      console.error('Failed to remove tokens:', error);
    }
  }
}

