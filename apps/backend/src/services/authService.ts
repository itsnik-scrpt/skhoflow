import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { config } from '../config/env';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    subscriptionTier: string;
  };
  token: string;
}

export const authService = {
  async register(email: string, password: string, name: string): Promise<AuthResult> {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create(email, passwordHash, name);

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
      },
      token,
    };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: user.subscription_tier,
      },
      token,
    };
  },
};
