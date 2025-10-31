// API Configuration
// Use environment variable or default to Render backend URL
let defaultApiUrl = 'https://music-space-server.onrender.com/api';
let defaultUploadBase = 'https://music-space-server.onrender.com';

// Check for common typos in environment variable
const envApiUrl = import.meta.env.VITE_API_URL;
if (envApiUrl && envApiUrl.includes('usic-space-server')) {
  console.error('❌ ERROR: VITE_API_URL contains typo "usic-space-server" (missing "m"). Please update on Render to "music-space-server"');
}

export const API_BASE_URL = envApiUrl || defaultApiUrl;
export const API_UPLOAD_BASE = envApiUrl?.replace('/api', '') || defaultUploadBase;

// Validate URLs don't contain typos
if (API_BASE_URL.includes('usic-space-server') || API_UPLOAD_BASE.includes('usic-space-server')) {
  console.error('❌ CRITICAL: API URLs contain typo "usic-space-server". Images will fail to load!');
  console.error('Current API_BASE_URL:', API_BASE_URL);
  console.error('Current API_UPLOAD_BASE:', API_UPLOAD_BASE);
  console.error('Please update VITE_API_URL on Render to: https://music-space-server.onrender.com/api');
}

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith('http')) return endpoint;
  return `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

// Helper function to get upload URL
export const getUploadUrl = (path) => {
  if (!path) {
    console.warn('⚠️ getUploadUrl: Empty path provided');
    return '';
  }
  
  const trimmedPath = path.trim();
  
  // Already a full URL
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    console.log(`✅ getUploadUrl: Already full URL: ${trimmedPath}`);
    return trimmedPath;
  }
  
  // Path starts with /uploads/
  if (trimmedPath.startsWith('/uploads/')) {
    const fullUrl = `${API_UPLOAD_BASE}${trimmedPath}`;
    console.log(`✅ getUploadUrl: /uploads/ path -> ${fullUrl}`);
    return fullUrl;
  }
  
  // Path doesn't start with /uploads/ - add it
  const fullUrl = `${API_UPLOAD_BASE}/uploads/${trimmedPath}`;
  console.log(`✅ getUploadUrl: Relative path "${trimmedPath}" -> ${fullUrl}`);
  return fullUrl;
};

