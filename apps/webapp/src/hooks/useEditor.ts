import { useEditorStore } from '../store/editorStore';
import { AppMode } from '../types';

export function useEditor() {
  const { currentMode, unsavedChanges, autoSaveEnabled, setMode, setUnsavedChanges } = useEditorStore();

  const switchMode = (mode: AppMode) => {
    setMode(mode);
  };

  const markDirty = () => setUnsavedChanges(true);
  const markClean = () => setUnsavedChanges(false);

  return {
    currentMode,
    unsavedChanges,
    autoSaveEnabled,
    switchMode,
    markDirty,
    markClean,
  };
}
