import { API_BASE_URL } from './api.js';

const API_BASE = API_BASE_URL.replace('/api', '');

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
export const OAUTH_ENDPOINTS = {
  GOOGLE_AUTH: `${API_BASE}/api/auth/google`, // GET - get OAuth URL
  GOOGLE_CALLBACK: `${API_BASE}/api/auth/google/callback`, // POST - handle callback
  FACEBOOK_AUTH: `${API_BASE}/api/auth/facebook`,
  LOGIN: `${API_BASE}/api/auth/login`,
  REGISTER: `${API_BASE}/api/auth/register`
};

// Legacy export for backward compatibility
export const API_ENDPOINTS = OAUTH_ENDPOINTS;
