export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface User {
  sub: string;
  email?: string;
  username?: string;
  name?: string;
  groups?: string[];
}
