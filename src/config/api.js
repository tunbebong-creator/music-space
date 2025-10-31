// API Configuration
// Use environment variable or default to Render backend URL
const defaultApiUrl = 'https://music-space-server.onrender.com/api';
const defaultUploadBase = 'https://music-space-server.onrender.com';

// Check for common typos in environment variable and fix automatically
let envApiUrl = import.meta.env.VITE_API_URL;
if (envApiUrl && envApiUrl.includes('usic-space-server')) {
  console.error('❌ ERROR: VITE_API_URL contains typo "usic-space-server" (missing "m"). Auto-fixing...');
  // Auto-fix the typo
  envApiUrl = envApiUrl.replace('usic-space-server', 'music-space-server');
  console.warn('✅ Fixed URL:', envApiUrl);
}

// Calculate base URLs - always use correct URL even if env var has typo
let calculatedApiUrl = defaultApiUrl;
let calculatedUploadBase = defaultUploadBase;

if (envApiUrl && !envApiUrl.includes('usic-space-server')) {
  calculatedApiUrl = envApiUrl;
  calculatedUploadBase = envApiUrl.replace('/api', '');
} else {
  // Force use default if env var is wrong or missing
  console.warn('⚠️ Using default API URL because VITE_API_URL is incorrect or missing');
}

// Export the corrected URLs
export const API_BASE_URL = calculatedApiUrl;
export const API_UPLOAD_BASE = calculatedUploadBase;

// Final validation warning
if (API_BASE_URL.includes('usic-space-server') || API_UPLOAD_BASE.includes('usic-space-server')) {
  console.error('❌ CRITICAL: API URLs still contain typo after fix. This should not happen!');
  console.error('Current API_BASE_URL:', API_BASE_URL);
  console.error('Current API_UPLOAD_BASE:', API_UPLOAD_BASE);
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

