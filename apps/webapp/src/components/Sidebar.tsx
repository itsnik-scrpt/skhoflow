import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '../store/documentStore';
import { formatDate } from '../utils/helpers';

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { documents, selectedDocument, setSelectedDocument } = useDocumentStore();

  return (
    <div className="relative flex">
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0"
          >
            <div className="w-60 h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Documents
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center mt-4">No documents yet</p>
                ) : (
                  documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocument(doc)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                        selectedDocument?.id === doc.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{formatDate(doc.updatedAt)}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-4 z-10 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <motion.svg
          animate={{ rotate: isOpen ? 0 : 180 }}
          className="w-3 h-3 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </motion.svg>
      </button>
    </div>
  );
};
