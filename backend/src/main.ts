import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/services/logger.service';
import { SecurityMiddleware } from './common/middleware/security.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global middleware
  app.use(new SecurityMiddleware().use);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('HR API')
    .setDescription('A production-ready HR management system for storing and matching resumes with job opportunities.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      message: 'AI Resume Management API is running',
      version: '1.0.0',
    });
  });

  // Root endpoint
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      message: 'Welcome to AI Resume Management API',
      docs: '/docs',
      health: '/health',
      endpoints: {
        resume_bank: '/api/v1/resume-bank',
        dashboard: '/api/v1/dashboard',
        jobs: '/api/v1/jobs',
        auth: '/api/v1/auth',
        meetings: '/api/v1/meetings',
        hiring_processes: '/api/v1/hiring-processes',
        job_applications: '/api/v1/job-applications',
      },
    });
  });

  const port = process.env.PORT || 8000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}

bootstrap();
