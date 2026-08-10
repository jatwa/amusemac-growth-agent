/**
 * Environment-based configuration module
 * Decouples hardcoded localhost URLs and manages OAuth client parameters for production deployment.
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

export const API_URL = (env as any).VITE_API_URL || 'http://localhost:3001';
export const APP_URL = (env as any).VITE_APP_URL || 'http://localhost:3000';
export const MARKETING_URL = (env as any).VITE_MARKETING_URL || 'https://amusemacgrowth.com';
export const APP_DOMAIN = 'app.amusemacgrowth.com';

// OAuth Provider Configuration
export const OAUTH_CONFIG = {
  GOOGLE: {
    clientId: (env as any).VITE_GOOGLE_CLIENT_ID || 'google-client-id-dev',
    authScope: 'openid profile email',
    mailboxScope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly',
    redirectUri: `${APP_URL}/auth/google/callback`
  },
  MICROSOFT: {
    clientId: (env as any).VITE_MICROSOFT_CLIENT_ID || 'microsoft-client-id-dev',
    authScope: 'openid profile email User.Read',
    mailboxScope: 'Mail.Send Mail.Read',
    redirectUri: `${APP_URL}/auth/microsoft/callback`
  },
  APPLE: {
    clientId: (env as any).VITE_APPLE_CLIENT_ID || 'apple-client-id-dev',
    redirectUri: `${APP_URL}/auth/apple/callback`
  },
  ZOHO: {
    clientId: (env as any).VITE_ZOHO_CLIENT_ID || 'zoho-client-id-dev',
    mailboxScope: 'ZohoMail.messages.ALL',
    redirectUri: `${APP_URL}/auth/zoho/callback`
  }
};

export const IS_PRODUCTION = (env as any).PROD || false;
export const IS_DEV = (env as any).DEV || true;
