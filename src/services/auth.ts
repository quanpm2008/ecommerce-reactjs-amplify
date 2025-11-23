import { config } from '../config';
import type { User, AuthTokens } from '../types/auth';

const TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'auth_user';

class AuthService {
  /**
   * Initiates the OAuth login flow by redirecting to Cognito Hosted UI
   */
  login(): void {
    const { domain, clientId, redirectUri } = config.cognito;
    const state = this.generateRandomString(32);
    sessionStorage.setItem('oauth_state', state);

    const authUrl = `https://${domain}/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=openid email phone`;

    console.log('Auth URL:', authUrl);
    console.log('Config:', { domain, clientId, redirectUri });
    window.location.href = authUrl;
  }

  /**
   * Handles the OAuth callback and exchanges the authorization code for tokens
   */
  async handleCallback(code: string, state: string): Promise<void> {
    const savedState = sessionStorage.getItem('oauth_state');
    
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    sessionStorage.removeItem('oauth_state');

    const { domain, clientId, redirectUri } = config.cognito;
    const tokenUrl = `https://${domain}/oauth2/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await response.json();
    this.setTokens({
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
    });

    // Decode and store user info
    const user = this.decodeIdToken(tokens.id_token);
    this.setUser(user);
  }

  /**
   * Logs out the user by clearing tokens and redirecting to Cognito logout
   */
  logout(): void {
    this.clearTokens();
    this.clearUser();

    const { domain, clientId, logoutUri } = config.cognito;
    const logoutUrl = `https://${domain}/logout?` +
      `client_id=${clientId}&` +
      `logout_uri=${encodeURIComponent(logoutUri)}`;

    window.location.href = logoutUrl;
  }

  /**
   * Returns the current access token
   */
  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Returns the current ID token
   */
  getIdToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.idToken || null;
  }

  /**
   * Returns the current user
   */
  getUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Checks if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Refreshes the access token using the refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    const tokens = this.getTokens();
    if (!tokens?.refreshToken) {
      return false;
    }

    const { domain, clientId } = config.cognito;
    const tokenUrl = `https://${domain}/oauth2/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('client_id', clientId);
    params.append('refresh_token', tokens.refreshToken);

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        return false;
      }

      const newTokens = await response.json();
      this.setTokens({
        accessToken: newTokens.access_token,
        idToken: newTokens.id_token,
        refreshToken: tokens.refreshToken, // Keep existing refresh token
        expiresIn: newTokens.expires_in,
        tokenType: newTokens.token_type,
      });

      // Update user info from new ID token
      const user = this.decodeIdToken(newTokens.id_token);
      this.setUser(user);

      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  /**
   * Stores tokens in localStorage
   */
  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  }

  /**
   * Retrieves tokens from localStorage
   */
  private getTokens(): AuthTokens | null {
    const tokensJson = localStorage.getItem(TOKEN_KEY);
    return tokensJson ? JSON.parse(tokensJson) : null;
  }

  /**
   * Clears tokens from localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Stores user in localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Clears user from localStorage
   */
  private clearUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Decodes the ID token to extract user information
   */
  private decodeIdToken(idToken: string): User {
    const payload = idToken.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    console.log('Decoded ID token:', decoded);
    
    return {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      username: decoded['cognito:username'] || decoded.preferred_username,
      groups: decoded['cognito:groups'] || [],
    };
  }

  /**
   * Generates a random string for OAuth state parameter
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const authService = new AuthService();
