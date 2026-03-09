import { pool } from '../config/database';

export interface Document {
  id: string;
  title: string;
  content: string;
  mode: 'word' | 'powerpoint';
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export const DocumentModel = {
  async findByUserId(userId: string, page = 1, limit = 20): Promise<Document[]> {
    const offset = (page - 1) * limit;
    const result = await pool.query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findById(id: string, userId: string): Promise<Document | null> {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    return result.rows[0] || null;
  },

  async create(title: string, mode: string, userId: string, content = ''): Promise<Document> {
    const result = await pool.query(
      'INSERT INTO documents (title, content, mode, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, mode, userId]
    );
    return result.rows[0];
  },

  async update(id: string, userId: string, updates: Partial<Pick<Document, 'title' | 'content'>>): Promise<Document | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${idx++}`);
      values.push(updates.content);
    }
    values.push(id, userId);

    const result = await pool.query(
      `UPDATE documents SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 AND user_id = $2', [id, userId]);
    return (result.rowCount ?? 0) > 0;
  },
};
