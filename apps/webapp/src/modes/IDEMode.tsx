import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FolderOpen, FileCode, Plus, X, ChevronRight, ChevronDown, Terminal as TermIcon } from 'lucide-react';
import { CodeFile } from '../types';
import { generateId } from '../utils/helpers';

const LANGS = ['javascript', 'typescript', 'python', 'go', 'rust', 'cpp', 'java', 'html', 'css', 'json', 'markdown', 'sql', 'yaml'];

const langIcon: Record<string, string> = {
  javascript: 'js', typescript: 'ts', python: 'py', go: 'go', rust: 'rs',
  cpp: 'cpp', java: 'java', html: 'html', css: 'css', json: 'json', markdown: 'md', sql: 'sql', yaml: 'yml',
};

const defaultFiles: CodeFile[] = [
  { id: '1', name: 'main.ts', path: 'main.ts', language: 'typescript', content: '// SkhoFlow IDE\n\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n' },
  { id: '2', name: 'index.html', path: 'index.html', language: 'html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Project</title>\n</head>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>\n' },
  { id: '3', name: 'styles.css', path: 'styles.css', language: 'css', content: 'body {\n  margin: 0;\n  font-family: sans-serif;\n}\n' },
];

export const IDEMode: React.FC = () => {
  const [files, setFiles] = useState<CodeFile[]>(defaultFiles);
  const [openTabs, setOpenTabs] = useState<string[]>(['1']);
  const [activeTab, setActiveTab] = useState('1');
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>(['SkhoFlow IDE Terminal — type commands below.']);
  const [termInput, setTermInput] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find(f => f.id === activeTab);

  const openFile = (id: string) => {
    if (!openTabs.includes(id)) setOpenTabs([...openTabs, id]);
    setActiveTab(id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = openTabs.filter(t => t !== id);
    setOpenTabs(next);
    if (activeTab === id) setActiveTab(next[next.length - 1] || '');
  };

  const updateContent = (val: string | undefined) => {
    if (!val === undefined || !activeTab) return;
    setFiles(files.map(f => f.id === activeTab ? { ...f, content: val ?? '', isModified: true } : f));
  };

  const newFile = () => {
    const f: CodeFile = { id: generateId(), name: 'untitled.js', path: 'untitled.js', language: 'javascript', content: '' };
    setFiles([...files, f]);
    openFile(f.id);
    startRename(f.id, f.name);
  };

  const deleteFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    setOpenTabs(openTabs.filter(t => t !== id));
    if (activeTab === id) {
      const remaining = openTabs.filter(t => t !== id);
      setActiveTab(remaining[remaining.length - 1] || '');
    }
  };

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameVal(current);
    setTimeout(() => renameRef.current?.select(), 50);
  };

  const commitRename = () => {
    if (renamingId && renameVal.trim()) {
      const ext = renameVal.split('.').pop() || '';
      const lang = Object.entries(langIcon).find(([, v]) => v === ext)?.[0] || 'plaintext';
      setFiles(files.map(f => f.id === renamingId ? { ...f, name: renameVal.trim(), language: lang } : f));
    }
    setRenamingId(null);
  };

  const handleTermInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setTerminalLines(prev => [...prev, `$ ${termInput}`, `Command '${termInput}' is not available in browser environment.`]);
      setTermInput('');
    }
  };

  const fileExt = (f: CodeFile) => langIcon[f.language] || f.name.split('.').pop() || 'txt';

  return (
    <div className="flex h-full bg-gray-950 text-gray-300 overflow-hidden" style={{ fontFamily: 'Consolas, "Fira Code", monospace' }}>
      {/* Activity bar */}
      <div className="w-10 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-2 gap-1">
        <button onClick={() => setExplorerOpen(!explorerOpen)}
          title="Explorer"
          className={`p-2 rounded transition-colors ${explorerOpen ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-white'}`}>
          <FolderOpen size={16} />
        </button>
        <button onClick={() => setTerminalOpen(!terminalOpen)}
          title="Terminal"
          className={`p-2 rounded transition-colors ${terminalOpen ? 'text-white bg-gray-800' : 'text-gray-500 hover:text-white'}`}>
          <TermIcon size={16} />
        </button>
      </div>

      {/* Explorer */}
      {explorerOpen && (
        <div className="w-48 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Explorer</span>
            <button onClick={newFile} title="New File" className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"><Plus size={13} /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            <div className="px-2">
              <div className="flex items-center gap-1 px-1 py-0.5 text-xs text-gray-400 font-semibold mb-1">
                <ChevronDown size={12} /><FolderOpen size={12} /> PROJECT
              </div>
              {files.map(f => (
                <div key={f.id}
                  className={`group flex items-center gap-1.5 px-3 py-0.5 rounded cursor-pointer text-xs transition-colors ${activeTab === f.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                  onClick={() => openFile(f.id)}
                  onDoubleClick={() => startRename(f.id, f.name)}>
                  <FileCode size={11} className="flex-shrink-0 text-blue-400" />
                  {renamingId === f.id ? (
                    <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
                      onBlur={commitRename} onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null); }}
                      className="flex-1 bg-gray-700 text-white text-xs px-1 rounded outline-none border border-blue-500 min-w-0"
                      onClick={e => e.stopPropagation()} />
                  ) : (
                    <span className="flex-1 truncate">{f.name}{f.isModified ? ' ●' : ''}</span>
                  )}
                  <button onClick={e => { e.stopPropagation(); deleteFile(f.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-500 hover:text-red-400 transition-all flex-shrink-0">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto flex-shrink-0">
          {openTabs.map(id => {
            const f = files.find(f => f.id === id);
            if (!f) return null;
            return (
              <div key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 py-2 border-r border-gray-800 cursor-pointer text-xs whitespace-nowrap transition-colors ${activeTab === id ? 'bg-gray-950 text-white border-t-2 border-t-blue-500' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
                <FileCode size={11} className="text-blue-400" />
                <span>{f.name}</span>
                {f.isModified && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60" />}
                <button onClick={e => closeTab(id, e)}
                  className="ml-1 p-0.5 rounded opacity-50 hover:opacity-100 hover:bg-gray-700 transition-all">
                  <X size={10} />
                </button>
              </div>
            );
          })}
          {openTabs.length === 0 && (
            <div className="px-4 py-2 text-xs text-gray-600">No files open</div>
          )}
          <div className="ml-auto flex items-center gap-2 px-3">
            <select value={theme} onChange={e => setTheme(e.target.value as 'vs-dark' | 'light')}
              className="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded px-2 py-1 focus:outline-none">
              <option value="vs-dark">Dark</option>
              <option value="light">Light</option>
            </select>
            {activeFile && (
              <select value={activeFile.language}
                onChange={e => setFiles(files.map(f => f.id === activeTab ? { ...f, language: e.target.value } : f))}
                className="text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded px-2 py-1 focus:outline-none">
                {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Monaco editor */}
        <div className="flex-1 overflow-hidden">
          {activeFile ? (
            <Editor
              height="100%"
              theme={theme}
              language={activeFile.language}
              value={activeFile.content}
              onChange={updateContent}
              options={{
                fontSize: 13,
                fontFamily: 'Consolas, "Fira Code", monospace',
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                tabSize: 2,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                formatOnPaste: true,
                suggest: { showIcons: true },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Open a file from the explorer
            </div>
          )}
        </div>

        {/* Terminal */}
        {terminalOpen && (
          <div className="h-48 flex-shrink-0 bg-gray-950 border-t border-gray-800 flex flex-col">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5"><TermIcon size={11} /> Terminal</span>
              <button onClick={() => setTerminalOpen(false)} className="text-gray-500 hover:text-white"><X size={13} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 text-xs text-green-400">
              {terminalLines.map((line, i) => <div key={i}>{line}</div>)}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-800">
              <span className="text-xs text-green-500">$</span>
              <input value={termInput} onChange={e => setTermInput(e.target.value)} onKeyDown={handleTermInput}
                className="flex-1 bg-transparent text-xs text-white outline-none"
                placeholder="Enter command..." />
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-10 right-0 h-5 bg-blue-700 flex items-center px-3 gap-4 text-xs text-blue-100">
        {activeFile && (
          <>
            <span>{activeFile.language}</span>
            <span>{activeFile.name}</span>
            <span className="ml-auto">UTF-8</span>
          </>
        )}
      </div>
    </div>
  );
};

