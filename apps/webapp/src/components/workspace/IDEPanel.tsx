import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  FolderOpen, FolderPlus, FilePlus, FileCode, Folder, ChevronRight, ChevronDown as ChevDown,
  X, Terminal as TermIcon, Trash2, Edit3, RefreshCw, Save,
} from 'lucide-react';
import { CodeFile, FolderEntry } from '../../types';
import { generateId } from '../../utils/helpers';
import { useDocumentStore } from '../../store/documentStore';
import { useThemeStore } from '../../store/themeStore';
import { SaveDialog, SaveFormat } from './SaveDialog';
import { downloadFile } from '../../utils/saveFile';

/* ─── language detection from extension ─── */
const EXT_LANG: Record<string, string> = {
  js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript',
  py:'python', go:'go', rs:'rust', cpp:'cpp', c:'c', java:'java',
  html:'html', css:'css', scss:'css', json:'json', md:'markdown',
  sql:'sql', yml:'yaml', yaml:'yaml', sh:'shell', txt:'plaintext',
  rb:'ruby', php:'php', swift:'swift', kt:'kotlin', cs:'csharp',
};
const extOf  = (name: string) => name.split('.').pop()?.toLowerCase() || '';
const langOf = (name: string) => EXT_LANG[extOf(name)] || 'plaintext';

/* ─── default project ─── */
function defaultFiles(): CodeFile[] {
  return [{
    id: generateId(), name: 'main.ts', language: 'typescript', path: 'main.ts',
    content: '// SkhoFlow IDE\n\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n',
  }];
}

function buildTree(files: CodeFile[]): FolderEntry[] {
  const root: FolderEntry[] = [];
  const dirs = new Map<string, FolderEntry>();

  const ensureDir = (pathParts: string[]): FolderEntry[] => {
    let target = root;
    let cumPath = '';
    for (const part of pathParts) {
      cumPath = cumPath ? `${cumPath}/${part}` : part;
      let existing = dirs.get(cumPath);
      if (!existing) {
        existing = { id: cumPath, name: part, path: cumPath, type: 'folder', children: [], expanded: true };
        dirs.set(cumPath, existing);
        target.push(existing);
      }
      target = existing.children!;
    }
    return target;
  };

  for (const f of files) {
    const parts = f.path.split('/');
    const dirParts = parts.slice(0, -1);
    const target = dirParts.length ? ensureDir(dirParts) : root;
    target.push({ id: f.id, name: f.name, path: f.path, type: 'file', fileId: f.id });
  }
  return root;
}

function parseContent(c: string): CodeFile[] {
  try { const p = JSON.parse(c); if (Array.isArray(p) && p.length > 0) return p; } catch { /**/ }
  return defaultFiles();
}

/* ─── colour per language ─── */
const LANG_COLOR: Record<string, string> = {
  typescript:'#3b82f6', javascript:'#f59e0b', python:'#22c55e',
  html:'#ef4444', css:'#a855f7', json:'#6b7280', markdown:'#60a5fa',
  rust:'#f97316', go:'#06b6d4', cpp:'#8b5cf6',
};
const fileColor = (name: string) => LANG_COLOR[langOf(name)] || '#6b7280';

interface Props { docId: string | null; isFocused: boolean; standaloneMode?: boolean }

export const IDEPanel: React.FC<Props> = ({ docId, isFocused, standaloneMode }) => {
  const { documents, updateDocument } = useDocumentStore();
  const { theme } = useThemeStore();
  const doc = docId ? documents.find(d => d.id === docId) : null;

  const [saveOpen, setSaveOpen]       = useState(false);
  const [projectName, setProjectName] = useState(doc?.title || 'Untitled Project');
  const [files, setFiles]             = useState<CodeFile[]>(() => parseContent(doc?.content || ''));
  const [openTabs, setOpenTabs]       = useState<string[]>([files[0]?.id ?? '']);
  const [activeTab, setActiveTab]     = useState(files[0]?.id ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [termOpen, setTermOpen]       = useState(false);
  const [termLines, setTermLines]     = useState<string[]>(['SkhoFlow Terminal — commands are simulated in-browser.']);
  const [termInput, setTermInput]     = useState('');
  const [expanded, setExpanded]       = useState<Set<string>>(new Set(['']));

  /* new-item creation state */
  const [creating, setCreating]       = useState<{ parentPath: string; type: 'file'|'folder' } | null>(null);
  const [createVal, setCreateVal]     = useState('');
  const createRef = useRef<HTMLInputElement>(null);

  /* rename state */
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [renameVal, setRenameVal]     = useState('');
  const renameRef = useRef<HTMLInputElement>(null);

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';
  const activeFile  = files.find(f => f.id === activeTab) ?? null;
  const tree        = buildTree(files);

  const persist = useCallback((f: CodeFile[]) => {
    if (docId) updateDocument(docId, { content: JSON.stringify(f), updatedAt: new Date() });
  }, [docId, updateDocument]);

  const setAndPersist = (f: CodeFile[]) => { setFiles(f); persist(f); };

  useEffect(() => { if (creating) setTimeout(() => createRef.current?.focus(), 30); }, [creating]);
  useEffect(() => { if (renamingId) setTimeout(() => { renameRef.current?.select(); }, 30); }, [renamingId]);

  /* keyboard */
  useEffect(() => {
    if (!isFocused) return;
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); setSaveOpen(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isFocused]);

  /* ── Open folder (File System Access API) ── */
  const openFolder = async () => {
    try {
      // @ts-ignore — File System Access API
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const loaded: CodeFile[] = [];
      const readDir = async (handle: any, basePath: string) => {
        for await (const [name, entry] of handle.entries()) {
          const entryPath = basePath ? `${basePath}/${name}` : name;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const content = await file.text();
            loaded.push({ id: generateId(), name, language: langOf(name), content, path: entryPath });
          } else if (entry.kind === 'directory') {
            await readDir(entry, entryPath);
          }
        }
      };
      await readDir(dirHandle, '');
      if (loaded.length > 0) {
        setProjectName(dirHandle.name);
        setAndPersist(loaded);
        setOpenTabs([loaded[0].id]);
        setActiveTab(loaded[0].id);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.error(err);
    }
  };

  /* ── Tab management ── */
  const openTab = (id: string) => {
    if (!openTabs.includes(id)) setOpenTabs(t => [...t, id]);
    setActiveTab(id);
  };
  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = openTabs.filter(t => t !== id);
    setOpenTabs(next);
    if (activeTab === id) setActiveTab(next[next.length - 1] || '');
  };

  /* ── File / folder creation ── */
  const startCreate = (parentPath: string, type: 'file'|'folder') => {
    setExpanded(s => new Set([...s, parentPath]));
    setCreating({ parentPath, type });
    setCreateVal('');
  };

  const commitCreate = () => {
    if (!creating || !createVal.trim()) { setCreating(null); return; }
    const { parentPath, type } = creating;
    const name = createVal.trim();
    const path = parentPath ? `${parentPath}/${name}` : name;
    if (type === 'file') {
      const f: CodeFile = { id: generateId(), name, language: langOf(name), content: '', path };
      const next = [...files, f];
      setAndPersist(next);
      openTab(f.id);
    } else {
      setExpanded(s => new Set([...s, path]));
    }
    setCreating(null);
  };

  /* ── Rename ── */
  const startRename = (file: CodeFile) => { setRenamingId(file.id); setRenameVal(file.name); };
  const commitRename = () => {
    if (renamingId && renameVal.trim()) {
      const next = files.map(f => f.id === renamingId ? {
        ...f, name: renameVal.trim(),
        language: langOf(renameVal.trim()),
        path: f.path.replace(/[^/]+$/, renameVal.trim()),
      } : f);
      setAndPersist(next);
    }
    setRenamingId(null);
  };

  /* ── Delete ── */
  const deleteFile = (id: string) => {
    const next = files.filter(f => f.id !== id);
    setAndPersist(next);
    const nextTabs = openTabs.filter(t => t !== id);
    setOpenTabs(nextTabs);
    if (activeTab === id) setActiveTab(nextTabs[nextTabs.length - 1] || '');
  };
  const deleteFolder = (folderPath: string) => {
    const next = files.filter(f => !f.path.startsWith(folderPath + '/') && f.path !== folderPath);
    setAndPersist(next);
    const ids = files.filter(f => f.path.startsWith(folderPath + '/')).map(f => f.id);
    const nextTabs = openTabs.filter(t => !ids.includes(t));
    setOpenTabs(nextTabs);
    if (ids.includes(activeTab)) setActiveTab(nextTabs[nextTabs.length - 1] || '');
  };

  /* ── Content update ── */
  const updateContent = (val: string | undefined) => {
    if (val === undefined || !activeTab) return;
    setAndPersist(files.map(f => f.id === activeTab ? { ...f, content: val, isModified: true } : f));
  };

  /* ── Save ── */
  const handleSave = (name: string, format: SaveFormat) => {
    const content = JSON.stringify(files);
    if (docId) updateDocument(docId, { title: name, content, updatedAt: new Date() });
    setProjectName(name);
    // clear modified flags
    setFiles(f => f.map(file => ({ ...file, isModified: false })));
    downloadFile(name, content, format, 'ide');
    setSaveOpen(false);
  };

  /* ── Terminal ── */
  const handleTerm = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const cmd = termInput.trim();
    let output = `'${cmd}': command not available in browser.`;
    if (cmd === 'clear') { setTermLines([]); setTermInput(''); return; }
    if (cmd === 'ls') output = files.map(f => f.path).join('\n');
    if (cmd === 'help') output = 'Available: ls, clear, help';
    setTermLines(p => [...p, `$ ${cmd}`, output]);
    setTermInput('');
  };

  /* ── Tree node renderer ── */
  const renderTree = (entries: FolderEntry[], depth = 0): React.ReactNode =>
    entries.map(entry => {
      const indent = depth * 12 + 8;
      if (entry.type === 'folder') {
        const isOpen = expanded.has(entry.path);
        return (
          <div key={entry.path}>
            <div className="group flex items-center gap-1 py-0.5 cursor-pointer transition-colors hover:opacity-80 pr-2"
              style={{ paddingLeft: indent, color: '#9ca3af' }}
              onClick={() => setExpanded(s => { const n = new Set(s); isOpen ? n.delete(entry.path) : n.add(entry.path); return n; })}>
              {isOpen ? <ChevDown size={10} style={{ flexShrink: 0 }} /> : <ChevronRight size={10} style={{ flexShrink: 0 }} />}
              <Folder size={11} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span className="flex-1 text-xs truncate" style={{ color: '#d1d5db' }}>{entry.name}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                <button onClick={e => { e.stopPropagation(); startCreate(entry.path, 'file'); }} title="New file"
                  className="p-0.5 rounded hover:text-white transition-colors"><FilePlus size={9} /></button>
                <button onClick={e => { e.stopPropagation(); startCreate(entry.path, 'folder'); }} title="New folder"
                  className="p-0.5 rounded hover:text-white transition-colors"><FolderPlus size={9} /></button>
                <button onClick={e => { e.stopPropagation(); deleteFolder(entry.path); }} title="Delete folder"
                  className="p-0.5 rounded hover:text-red-400 transition-colors"><Trash2 size={9} /></button>
              </div>
            </div>
            {isOpen && entry.children && renderTree(entry.children, depth + 1)}
            {/* inline creation input inside this folder */}
            {isOpen && creating?.parentPath === entry.path && (
              <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: indent + 20 }}>
                {creating.type === 'file' ? <FileCode size={10} style={{ color: '#60a5fa', flexShrink: 0 }} /> : <Folder size={10} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                <input ref={createRef} value={createVal} onChange={e => setCreateVal(e.target.value)}
                  onBlur={commitCreate}
                  onKeyDown={e => { if (e.key === 'Enter') commitCreate(); if (e.key === 'Escape') setCreating(null); }}
                  className="flex-1 text-xs rounded px-1.5 py-0.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #3b82f6', color: 'white', fontFamily: 'inherit', minWidth: 0 }}
                  placeholder={creating.type === 'file' ? 'filename.ts' : 'folder-name'} />
              </div>
            )}
          </div>
        );
      }
      /* file entry */
      const file = files.find(f => f.id === entry.fileId);
      if (!file) return null;
      const isActive = activeTab === file.id;
      return (
        <div key={file.id}
          className="group flex items-center gap-1 py-0.5 cursor-pointer pr-2 transition-colors"
          style={{ paddingLeft: indent + 10, background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent' }}
          onClick={() => openTab(file.id)}>
          <FileCode size={10} style={{ color: fileColor(file.name), flexShrink: 0 }} />
          {renamingId === file.id ? (
            <input ref={renameRef} value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onBlur={commitRename} onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null); }}
              className="flex-1 text-xs rounded px-1 py-0.5 outline-none min-w-0"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #3b82f6', color: 'white', fontFamily: 'inherit' }}
              onClick={e => e.stopPropagation()} />
          ) : (
            <span className="flex-1 text-xs truncate" style={{ color: isActive ? 'white' : '#9ca3af' }}>
              {file.name}{file.isModified ? <span style={{ color: '#f59e0b' }}> ●</span> : null}
            </span>
          )}
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
            <button onClick={e => { e.stopPropagation(); startRename(file); }} title="Rename"
              className="p-0.5 rounded hover:text-white transition-colors" style={{ color: '#6b7280' }}><Edit3 size={9} /></button>
            <button onClick={e => { e.stopPropagation(); deleteFile(file.id); }} title="Delete"
              className="p-0.5 rounded hover:text-red-400 transition-colors" style={{ color: '#6b7280' }}><Trash2 size={9} /></button>
          </div>
        </div>
      );
    });

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ fontFamily: '"Fira Code", Consolas, monospace' }}>
      <SaveDialog open={saveOpen} defaultName={projectName} type="ide" onSave={handleSave} onClose={() => setSaveOpen(false)} />

      {/* Standalone title bar */}
      {standaloneMode && (
        <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
          style={{ background: '#1a1a2e', borderBottom: '1px solid #2a2a3e' }}>
          <FolderOpen size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span className="text-sm font-bold truncate" style={{ color: 'white', fontFamily: 'Nunito, sans-serif' }}>
            {projectName}
            {files.some(f => f.isModified) && <span style={{ color: '#f59e0b' }}> ●</span>}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={openFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#9ca3af', fontFamily: 'Nunito, sans-serif', border: '1px solid #2a2a3e' }}>
              <FolderOpen size={12} /> Open Folder
            </button>
            <button onClick={() => setSaveOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
              style={{ background: '#3b82f6', color: 'white', fontFamily: 'Nunito, sans-serif' }}>
              <Save size={12} /> Save Archive
            </button>
          </div>
        </div>
      )}

      {/* Main IDE layout */}
      <div className="flex flex-1 overflow-hidden">

      {/* Activity bar */}
      <div className="w-9 flex-shrink-0 flex flex-col items-center gap-1 py-2"
        style={{ background: '#1a1a2e', borderRight: '1px solid #2a2a3e' }}>
        <button onClick={() => setSidebarOpen(s => !s)} title="Explorer"
          className="p-2 rounded transition-colors"
          style={{ color: sidebarOpen ? 'white' : '#6b7280', background: sidebarOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
          <FolderOpen size={14} />
        </button>
        <button onClick={openFolder} title="Open folder"
          className="p-2 rounded transition-colors hover:text-white" style={{ color: '#6b7280' }}>
          <RefreshCw size={14} />
        </button>
        <button onClick={() => setTermOpen(s => !s)} title="Terminal"
          className="p-2 rounded transition-colors"
          style={{ color: termOpen ? 'white' : '#6b7280', background: termOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
          <TermIcon size={14} />
        </button>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-52 flex-shrink-0 flex flex-col overflow-hidden"
          style={{ background: '#1a1a2e', borderRight: '1px solid #2a2a3e' }}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #2a2a3e' }}>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#6b7280' }}>Explorer</span>
            <div className="flex gap-0.5">
              <button onClick={() => startCreate('', 'file')} title="New file"
                className="p-1 rounded transition-colors hover:text-white" style={{ color: '#6b7280' }}><FilePlus size={12} /></button>
              <button onClick={() => startCreate('', 'folder')} title="New folder"
                className="p-1 rounded transition-colors hover:text-white" style={{ color: '#6b7280' }}><FolderPlus size={12} /></button>
              <button onClick={openFolder} title="Open folder"
                className="p-1 rounded transition-colors hover:text-white" style={{ color: '#6b7280' }}><FolderOpen size={12} /></button>
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto py-1">
            {renderTree(tree)}
            {/* root-level creation */}
            {creating?.parentPath === '' && (
              <div className="flex items-center gap-1 py-0.5 px-3">
                {creating.type === 'file' ? <FileCode size={10} style={{ color: '#60a5fa' }} /> : <Folder size={10} style={{ color: '#f59e0b' }} />}
                <input ref={createRef} value={createVal} onChange={e => setCreateVal(e.target.value)}
                  onBlur={commitCreate}
                  onKeyDown={e => { if (e.key === 'Enter') commitCreate(); if (e.key === 'Escape') setCreating(null); }}
                  className="flex-1 text-xs rounded px-1.5 py-0.5 outline-none"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #3b82f6', color: 'white', fontFamily: 'inherit', minWidth: 0 }}
                  placeholder={creating.type === 'file' ? 'filename.ts' : 'folder-name'} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Editor + terminal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center overflow-x-auto flex-shrink-0 min-h-[32px]"
          style={{ background: '#1a1a2e', borderBottom: '1px solid #2a2a3e' }}>
          {openTabs.map(id => {
            const f = files.find(f => f.id === id);
            if (!f) return null;
            const isActive = activeTab === id;
            return (
              <div key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 text-xs transition-colors"
                style={{
                  background: isActive ? '#2d2d44' : 'transparent',
                  color: isActive ? 'white' : '#6b7280',
                  borderRight: '1px solid #2a2a3e',
                  borderTop: `2px solid ${isActive ? fileColor(f.name) : 'transparent'}`,
                }}>
                <FileCode size={10} style={{ color: fileColor(f.name) }} />
                <span>{f.name}</span>
                {f.isModified && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />}
                <button onClick={e => closeTab(id, e)} className="ml-1 opacity-40 hover:opacity-100 transition-opacity"><X size={10} /></button>
              </div>
            );
          })}
          {openTabs.length === 0 && <span className="px-4 text-xs" style={{ color: '#4b5563' }}>No files open</span>}
        </div>

        {/* Monaco */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {activeFile ? (
            <Editor
              height="100%"
              theme={monacoTheme}
              language={activeFile.language}
              path={activeFile.path} /* ensures Monaco keeps separate model per file */
              value={activeFile.content}
              onChange={updateContent}
              options={{
                fontSize: 13,
                fontFamily: '"Fira Code", Consolas, monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                tabSize: 2,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                formatOnPaste: true,
                lineNumbers: 'on',
                padding: { top: 8 },
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4"
              style={{ background: '#12121f', color: '#4b5563' }}>
              <FileCode size={32} style={{ opacity: 0.3 }} />
              <p className="text-sm font-semibold">Open a file or create a new one</p>
              <div className="flex gap-2">
                <button onClick={() => startCreate('', 'file')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <FilePlus size={12} /> New file
                </button>
                <button onClick={openFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <FolderOpen size={12} /> Open folder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Terminal */}
        {termOpen && (
          <div className="flex-shrink-0 flex flex-col" style={{ height: 160, background: '#0d0d1a', borderTop: '1px solid #2a2a3e' }}>
            <div className="flex items-center justify-between px-3 py-1" style={{ borderBottom: '1px solid #2a2a3e' }}>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#6b7280' }}>
                <TermIcon size={10} /> Terminal
              </span>
              <button onClick={() => setTermOpen(false)} style={{ color: '#6b7280' }}><X size={12} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 text-xs leading-relaxed" style={{ color: '#4ade80', fontFamily: 'inherit' }}>
              {termLines.map((line, i) => (
                <div key={i} style={{ color: line.startsWith('$') ? '#86efac' : '#4b5563' }}>{line}</div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderTop: '1px solid #2a2a3e' }}>
              <span className="text-xs" style={{ color: '#4ade80' }}>$</span>
              <input value={termInput} onChange={e => setTermInput(e.target.value)} onKeyDown={handleTerm}
                className="flex-1 bg-transparent text-xs outline-none" style={{ color: 'white', fontFamily: 'inherit' }}
                placeholder="Enter command…" />
            </div>
          </div>
        )}
      </div>
      </div>{/* end main IDE layout */}
    </div>
  );
};

