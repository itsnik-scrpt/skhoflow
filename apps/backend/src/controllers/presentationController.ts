import { Response } from 'express';
import { PresentationModel } from '../models/Presentation';
import { AuthRequest } from '../middleware/auth';

export const presentationController = {
  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const presentations = await PresentationModel.findByUserId(req.userId!);
      res.json(presentations);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list presentations';
      res.status(500).json({ status: 500, message, error: 'INTERNAL_ERROR' });
    }
  },

  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title } = req.body;
      if (!title) {
        res.status(400).json({ status: 400, message: 'Title is required', error: 'VALIDATION_ERROR' });
        return;
      }
      const presentation = await PresentationModel.create(title, req.userId!);
      res.status(201).json(presentation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create presentation';
      res.status(500).json({ status: 500, message, error: 'INTERNAL_ERROR' });
    }
  },

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, slides } = req.body;
      const presentation = await PresentationModel.update(req.params.id, req.userId!, { title, slides });
      if (!presentation) {
        res.status(404).json({ status: 404, message: 'Presentation not found', error: 'NOT_FOUND' });
        return;
      }
      res.json(presentation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update presentation';
      res.status(500).json({ status: 500, message, error: 'INTERNAL_ERROR' });
    }
  },
};
