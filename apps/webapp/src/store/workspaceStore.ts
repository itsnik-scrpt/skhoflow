import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../utils/helpers';

export type PanelType = 'document' | 'slides' | 'ide';

export interface WorkspacePanel {
  id: string;
  type: PanelType;
  docId: string | null; // null = new/blank
  title: string;
}

interface WorkspaceState {
  panels: WorkspacePanel[];
  focusedPanelId: string | null;
  addPanel: (type: PanelType, docId?: string | null, title?: string) => string;
  removePanel: (id: string) => void;
  updatePanel: (id: string, patch: Partial<WorkspacePanel>) => void;
  setFocused: (id: string | null) => void;
  clearPanels: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      panels: [],
      focusedPanelId: null,

      addPanel: (type, docId = null, title) => {
        const id = generateId();
        const defaultTitle = type === 'document' ? 'Document' : type === 'slides' ? 'Presentation' : 'IDE Project';
        set(s => ({
          panels: [...s.panels, { id, type, docId, title: title ?? defaultTitle }],
          focusedPanelId: id,
        }));
        return id;
      },

      removePanel: (id) =>
        set(s => {
          const remaining = s.panels.filter(p => p.id !== id);
          const focused = s.focusedPanelId === id
            ? (remaining[remaining.length - 1]?.id ?? null)
            : s.focusedPanelId;
          return { panels: remaining, focusedPanelId: focused };
        }),

      updatePanel: (id, patch) =>
        set(s => ({ panels: s.panels.map(p => p.id === id ? { ...p, ...patch } : p) })),

      setFocused: (id) => set({ focusedPanelId: id }),

      clearPanels: () => set({ panels: [], focusedPanelId: null }),
    }),
    { name: 'skhoflow-workspace' }
  )
);

