import { pool } from '../config/database';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  subscription_tier: 'free' | 'student' | 'teacher' | 'enterprise';
  created_at: Date;
}

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(email: string, passwordHash: string, name: string): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, name]
    );
    return result.rows[0];
  },
};
