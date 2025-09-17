export const configuration = () => ({
  app: {
    name: process.env.APP_NAME || 'HR API',
    version: process.env.APP_VERSION || '1.0.0',
    port: parseInt(process.env.PORT, 10) || 8000,
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    mongodb: {
      uri: process.env.MONGODB_URL || 'mongodb://localhost:27017',
      database: process.env.DATABASE_NAME || 'resume_analysis',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    apiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.MAX_TOKENS, 10) || 2000,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.3,
    analysisTimeout: parseInt(process.env.ANALYSIS_TIMEOUT, 10) || 60,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    uploadFolder: process.env.UPLOAD_FOLDER || 'uploads',
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['application/pdf'],
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
});
