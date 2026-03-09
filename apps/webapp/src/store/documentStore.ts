import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Document } from '../types';

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  isLoading: boolean;
  setDocuments: (documents: Document[]) => void;
  setSelectedDocument: (document: Document | null) => void;
  setIsLoading: (loading: boolean) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documents: [],
      selectedDocument: null,
      isLoading: false,
      setDocuments: (documents) => set({ documents }),
      setSelectedDocument: (document) => set({ selectedDocument: document }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      addDocument: (document) =>
        set((state) => ({ documents: [document, ...state.documents] })),
      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id ? { ...doc, ...updates } : doc
          ),
        })),
      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((doc) => doc.id !== id),
        })),
    }),
    {
      name: 'skhoflow-documents',
    }
  )
);
