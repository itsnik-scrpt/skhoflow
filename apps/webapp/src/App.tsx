import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TopNav } from './components/TopNav';
import { ModeSelector } from './components/ModeSelector';
import { Sidebar } from './components/Sidebar';
import { WordMode } from './modes/WordMode';
import { CodingMode } from './modes/CodingMode';
import { PowerPointMode } from './modes/PowerPointMode';
import { useEditorStore } from './store/editorStore';

const modeComponents = {
  word: WordMode,
  coding: CodingMode,
  powerpoint: PowerPointMode,
};

function App() {
  const { currentMode } = useEditorStore();
  const ModeComponent = modeComponents[currentMode];

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <TopNav />

      <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <ModeSelector />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ModeComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
