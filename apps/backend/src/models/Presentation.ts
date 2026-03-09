import { pool } from '../config/database';

export interface Presentation {
  id: string;
  title: string;
  slides: unknown[];
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export const PresentationModel = {
  async findByUserId(userId: string): Promise<Presentation[]> {
    const result = await pool.query(
      'SELECT * FROM presentations WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findById(id: string, userId: string): Promise<Presentation | null> {
    const result = await pool.query('SELECT * FROM presentations WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rows[0] || null;
  },

  async create(title: string, userId: string): Promise<Presentation> {
    const result = await pool.query(
      'INSERT INTO presentations (title, user_id) VALUES ($1, $2) RETURNING *',
      [title, userId]
    );
    return result.rows[0];
  },

  async update(id: string, userId: string, updates: Partial<Pick<Presentation, 'title' | 'slides'>>): Promise<Presentation | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.slides !== undefined) {
      fields.push(`slides = $${idx++}`);
      values.push(JSON.stringify(updates.slides));
    }
    values.push(id, userId);

    const result = await pool.query(
      `UPDATE presentations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },
};
