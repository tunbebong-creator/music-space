import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Handle potential browser extension conflicts
try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  )
} catch (error) {
  console.error('Error rendering app:', error)
  // Fallback: try to render anyway
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Lỗi tải ứng dụng</h1><p>Vui lòng tắt các browser extension và refresh lại trang.</p><button onclick="window.location.reload()">Refresh</button></div>'
  }
} 