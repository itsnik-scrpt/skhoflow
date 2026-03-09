import { Response } from 'express';
import { documentService } from '../services/documentService';
import { AuthRequest } from '../middleware/auth';

export const documentController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const docs = await documentService.listDocuments(req.userId!, page);
      res.json(docs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list documents';
      res.status(500).json({ status: 500, message, error: 'INTERNAL_ERROR' });
    }
  },

  async get(req: AuthRequest, res: Response): Promise<void> {
    try {
      const doc = await documentService.getDocument(req.params.id, req.userId!);
      res.json(doc);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Not found';
      res.status(404).json({ status: 404, message, error: 'NOT_FOUND' });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, mode } = req.body;
      if (!title) {
        res.status(400).json({ status: 400, message: 'Title is required', error: 'VALIDATION_ERROR' });
        return;
      }
      const doc = await documentService.createDocument(title, mode || 'word', req.userId!);
      res.status(201).json(doc);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create document';
      res.status(500).json({ status: 500, message, error: 'INTERNAL_ERROR' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, content } = req.body;
      const doc = await documentService.updateDocument(req.params.id, req.userId!, { title, content });
      res.json(doc);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update document';
      res.status(404).json({ status: 404, message, error: 'NOT_FOUND' });
    }
  },

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await documentService.deleteDocument(req.params.id, req.userId!);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete document';
      res.status(404).json({ status: 404, message, error: 'NOT_FOUND' });
    }
  },
};
