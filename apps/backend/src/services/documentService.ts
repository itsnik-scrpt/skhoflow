import { DocumentModel } from '../models/Document';

export const documentService = {
  async listDocuments(userId: string, page = 1) {
    return DocumentModel.findByUserId(userId, page);
  },

  async getDocument(id: string, userId: string) {
    const doc = await DocumentModel.findById(id, userId);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  async createDocument(title: string, mode: string, userId: string) {
    return DocumentModel.create(title, mode, userId);
  },

  async updateDocument(id: string, userId: string, updates: { title?: string; content?: string }) {
    const doc = await DocumentModel.update(id, userId, updates);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  async deleteDocument(id: string, userId: string) {
    const deleted = await DocumentModel.delete(id, userId);
    if (!deleted) throw new Error('Document not found');
  },
};
