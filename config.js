// Database Configuration
// Copy this to .env file and add your Neon database URL

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require',
  PORT: process.env.PORT || 3001
};

// Example Neon URL format:
// DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require















































