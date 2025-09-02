// Environment configuration - centralized access point
export const config = {
  database: {
    uri: process.env.MONGODB_URI || '',
    name: process.env.MONGODB_DB_NAME || 'synfind',
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET || '',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  app: {
    name: 'Synfind',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
  },
} as const;

// Validate required environment variables
export const validateConfig = () => {
  const required = [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};