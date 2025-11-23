export const config = {
  cognito: {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
    redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || 'http://localhost:3000/callback',
    logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI || 'http://localhost:3000',
  },
  graphql: {
    endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT || '',
  },
};
