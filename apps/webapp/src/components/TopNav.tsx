import React from 'react';
import { motion } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { useEditorStore } from '../store/editorStore';
import { useThemeStore } from '../store/themeStore';

export const TopNav: React.FC = () => {
  const { unsavedChanges } = useEditorStore();
  const { theme } = useThemeStore();
  const logoFilter = theme === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)';

  return (
    <nav className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-10">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="SkhoFlow" style={{ height: 28, width: 'auto', objectFit: 'contain', filter: logoFilter, transition: 'filter 0.2s' }} />
      </div>

      <div className="flex items-center gap-4">
        {unsavedChanges && (
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-amber-500 font-medium"
          >
            Unsaved changes
          </motion.span>
        )}
        <ThemeToggle />
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center cursor-pointer">
          <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">U</span>
        </div>
      </div>
    </nav>
  );
};
