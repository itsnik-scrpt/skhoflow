import React from 'react';
import { motion } from 'framer-motion';
import { AppMode } from '../types';
import { useEditorStore } from '../store/editorStore';

const modes: { id: AppMode; label: string; icon: string; description: string }[] = [
  { id: 'word', label: 'Word', icon: '📝', description: 'Document editor' },
  { id: 'coding', label: 'Code', icon: '💻', description: 'Code editor' },
  { id: 'powerpoint', label: 'Slides', icon: '📊', description: 'Presentation' },
];

export const ModeSelector: React.FC = () => {
  const { currentMode, setMode } = useEditorStore();

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
      {modes.map((mode) => (
        <motion.button
          key={mode.id}
          onClick={() => setMode(mode.id)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentMode === mode.id
              ? 'text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          whileTap={{ scale: 0.97 }}
        >
          {currentMode === mode.id && (
            <motion.div
              layoutId="active-mode"
              className="absolute inset-0 bg-blue-500 rounded-lg"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{mode.icon}</span>
          <span className="relative z-10">{mode.label}</span>
        </motion.button>
      ))}
    </div>
  );
};
