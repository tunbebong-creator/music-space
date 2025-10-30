// Entry point for Render.com deployment
// Import server.js which contains the Express app
import('./server.js').catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});


