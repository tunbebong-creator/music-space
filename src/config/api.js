// API Configuration
// Use environment variable or default to Render backend URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://music-space-server.onrender.com/api';
export const API_UPLOAD_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://music-space-server.onrender.com';

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

