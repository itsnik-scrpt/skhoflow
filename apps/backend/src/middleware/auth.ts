import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 401, message: 'No token provided', error: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (err) {
    const isExpired = err instanceof Error && err.name === 'TokenExpiredError';
    const message = isExpired ? 'Token has expired' : 'Invalid token';
    res.status(401).json({ status: 401, message, error: 'UNAUTHORIZED' });
  }
}
