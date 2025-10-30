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
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads/')) return `${API_UPLOAD_BASE}${path}`;
  return `${API_UPLOAD_BASE}/uploads/${path}`;
};

