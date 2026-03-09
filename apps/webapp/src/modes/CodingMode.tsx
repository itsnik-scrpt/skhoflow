import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '../store/editorStore';
import { generateId } from '../utils/helpers';

interface Tab {
  id: string;
  name: string;
  language: string;
  content: string;
}

const defaultTabs: Tab[] = [
  {
    id: '1',
    name: 'main.js',
    language: 'javascript',
    content: '// Welcome to SkhoFlow Code Editor\nconsole.log("Hello, World!");\n',
  },
];

const LANGUAGES = ['javascript', 'typescript', 'python', 'cpp', 'java', 'html', 'css', 'json'];

export const CodingMode: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState('1');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const { setUnsavedChanges } = useEditorStore();

  const currentTab = tabs.find((t) => t.id === activeTab);

  const addTab = () => {
    const newTab: Tab = {
      id: generateId(),
      name: `file${tabs.length + 1}.js`,
      language: 'javascript',
      content: '',
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) setActiveTab(newTabs[0].id);
  };

  const updateContent = (value: string | undefined) => {
    if (value === undefined) return;
    setTabs(tabs.map((t) => (t.id === activeTab ? { ...t, content: value } : t)));
    setUnsavedChanges(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full bg-gray-900"
    >
      {/* Tab bar */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700 px-2 pt-2 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-t text-xs cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              className="ml-1 opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="px-2 py-1.5 text-gray-400 hover:text-white text-xs rounded hover:bg-gray-700"
        >
          +
        </button>

        <div className="ml-auto flex items-center gap-2 pb-1">
          <select
            value={currentTab?.language}
            onChange={(e) => setTabs(tabs.map((t) => (t.id === activeTab ? { ...t, language: e.target.value } : t)))}
            className="text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-2 py-1"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'vs-dark' | 'light')}
            className="text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-2 py-1"
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        {currentTab && (
          <Editor
            height="100%"
            language={currentTab.language}
            value={currentTab.content}
            theme={theme}
            onChange={updateContent}
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderLineHighlight: 'all',
              tabSize: 2,
            }}
          />
        )}
      </div>
    </motion.div>
  );
};
