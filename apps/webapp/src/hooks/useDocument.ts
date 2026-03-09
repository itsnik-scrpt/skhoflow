import { useDocumentStore } from '../store/documentStore';
import { apiClient } from '../services/api';
import { Document } from '../types';

export function useDocument() {
  const { documents, selectedDocument, isLoading, setDocuments, setSelectedDocument, setIsLoading, addDocument, updateDocument, removeDocument } = useDocumentStore();

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await apiClient.get<Document[]>('/documents');
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDocument = async (title: string, mode: 'word' | 'powerpoint') => {
    const newDoc = await apiClient.post<Document>('/documents', { title, mode, content: '' });
    addDocument(newDoc);
    return newDoc;
  };

  const saveDocument = async (id: string, content: string) => {
    const updated = await apiClient.put<Document>(`/documents/${id}`, { content });
    updateDocument(id, updated);
    return updated;
  };

  const deleteDocument = async (id: string) => {
    await apiClient.delete(`/documents/${id}`);
    removeDocument(id);
  };

  return {
    documents,
    selectedDocument,
    isLoading,
    setSelectedDocument,
    fetchDocuments,
    createDocument,
    saveDocument,
    deleteDocument,
  };
}
