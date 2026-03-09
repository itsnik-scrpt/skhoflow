import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(error.message);
  res.status(500).json({
    status: 500,
    message: error.message || 'Internal server error',
    error: 'INTERNAL_ERROR',
  });
}
