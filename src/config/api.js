// API Configuration
// Use environment variable or default to Render backend URL
// NOTE: Backend is actually running on usic-space-server.onrender.com (without 'm')
// For local development, use localhost:3001
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost 
  ? 'http://localhost:3001/api' 
  : 'https://usic-space-server.onrender.com/api';
const defaultUploadBase = isLocalhost
  ? 'http://localhost:3001'
  : 'https://usic-space-server.onrender.com';

// Use environment variable if provided, otherwise use default
let envApiUrl = import.meta.env.VITE_API_URL;

// Calculate base URLs
let calculatedApiUrl = envApiUrl || defaultApiUrl;
let calculatedUploadBase = envApiUrl 
  ? envApiUrl.replace('/api', '') 
  : defaultUploadBase;

// Normalize URL - handle both music-space and usic-space
if (calculatedApiUrl.includes('music-space-server')) {
  // If env var has 'music-space', but backend is actually 'usic-space', fix it
  calculatedApiUrl = calculatedApiUrl.replace('music-space-server', 'usic-space-server');
  calculatedUploadBase = calculatedUploadBase.replace('music-space-server', 'usic-space-server');
  console.warn('⚠️ Fixed URL to match actual backend: usic-space-server.onrender.com');
}

// Export the corrected URLs
export const API_BASE_URL = calculatedApiUrl;
export const API_UPLOAD_BASE = calculatedUploadBase;

// Log final URLs for debugging
console.log('🔗 API Configuration:', {
  API_BASE_URL,
  API_UPLOAD_BASE
});

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// Helper function to get upload URL
export const getUploadUrl = (path) => {
  if (!path) {
    return '';
  }
  
  const trimmedPath = path.trim();
  
  // Already a full URL
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  
  // Path starts with /uploads/
  if (trimmedPath.startsWith('/uploads/')) {
    return `${API_UPLOAD_BASE}${trimmedPath}`;
  }
  
  // Path doesn't start with /uploads/ - add it
  return `${API_UPLOAD_BASE}/uploads/${trimmedPath}`;
};

