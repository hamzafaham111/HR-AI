import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(8000),
  APP_NAME: Joi.string().default('HR API'),
  APP_VERSION: Joi.string().default('1.0.0'),

  // Database
  MONGODB_URL: Joi.string().default('mongodb://localhost:27017'),
  DATABASE_NAME: Joi.string().default('resume_analysis'),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // OpenAI
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_API_BASE: Joi.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: Joi.string().default('gpt-3.5-turbo'),
  MAX_TOKENS: Joi.number().default(2000),
  TEMPERATURE: Joi.number().default(0.3),
  ANALYSIS_TIMEOUT: Joi.number().default(60),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760),
  UPLOAD_FOLDER: Joi.string().default('uploads'),
  ALLOWED_FILE_TYPES: Joi.string().default('application/pdf'),

  // Email
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  FROM_EMAIL: Joi.string().email().default('noreply@yourcompany.com'),

  // CORS
  CORS_ORIGINS: Joi.string().optional(),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
});
