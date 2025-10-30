// OAuth Configuration
export const OAUTH_CONFIG = {
  GOOGLE: {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-abcdefghijklmnop.apps.googleusercontent.com',
    SCOPES: 'email profile'
  },
  FACEBOOK: {
    APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID || 'your-facebook-app-id',
    VERSION: 'v18.0',
    SCOPES: 'email,public_profile'
  }
};

// Backend API endpoints
export const API_ENDPOINTS = {
  GOOGLE_AUTH: 'http://localhost:3001/api/auth/google', // GET - get OAuth URL
  GOOGLE_CALLBACK: 'http://localhost:3001/api/auth/google/callback', // POST - handle callback
  FACEBOOK_AUTH: 'http://localhost:3001/api/auth/facebook',
  LOGIN: 'http://localhost:3001/api/auth/login',
  REGISTER: 'http://localhost:3001/api/auth/register'
};
