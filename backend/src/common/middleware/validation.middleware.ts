import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ValidationMiddleware implements NestMiddleware {
  // Use arrow function to preserve `this` when passed to Express
  use = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize request body
    if (req.body) {
      this.sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      this.sanitizeObject(req.query);
    }

    // Validate content type for POST/PUT/PATCH requests only
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new BadRequestException('Content-Type must be application/json');
      }
    }

    next();
  };

  private sanitizeObject = (obj: any): void => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeObject(obj[key]);
      }
    }
  };
}
