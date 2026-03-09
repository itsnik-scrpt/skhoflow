import { create } from 'zustand';
import { AppMode } from '../types';

interface EditorState {
  currentMode: AppMode;
  unsavedChanges: boolean;
  autoSaveEnabled: boolean;
  setMode: (mode: AppMode) => void;
  setUnsavedChanges: (value: boolean) => void;
  setAutoSaveEnabled: (value: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentMode: 'word',
  unsavedChanges: false,
  autoSaveEnabled: true,
  setMode: (mode) => set({ currentMode: mode }),
  setUnsavedChanges: (value) => set({ unsavedChanges: value }),
  setAutoSaveEnabled: (value) => set({ autoSaveEnabled: value }),
}));
