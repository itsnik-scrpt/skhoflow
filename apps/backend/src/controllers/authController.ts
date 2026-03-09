import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ status: 400, message: 'Email, password, and name are required', error: 'VALIDATION_ERROR' });
        return;
      }
      const result = await authService.register(email, password, name);
      res.status(201).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ status: 400, message, error: 'REGISTRATION_FAILED' });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ status: 400, message: 'Email and password are required', error: 'VALIDATION_ERROR' });
        return;
      }
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ status: 401, message, error: 'LOGIN_FAILED' });
    }
  },

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.userId!);
      if (!user) {
        res.status(404).json({ status: 404, message: 'User not found', error: 'NOT_FOUND' });
        return;
      }
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({ status: 500, message, error: 'INTERNAL_ERROR' });
    }
  },
};
