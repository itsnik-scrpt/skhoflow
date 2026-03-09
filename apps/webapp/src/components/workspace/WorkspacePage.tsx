import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Presentation, Code2, Plus, X, ChevronDown, GripVertical } from 'lucide-react';
import { useWorkspaceStore, PanelType, WorkspacePanel } from '../../store/workspaceStore';
import { useDocumentStore } from '../../store/documentStore';
import { useAuthStore } from '../../store/authStore';
import { generateId } from '../../utils/helpers';
import { DocumentPanel } from './DocumentPanel';
import { SlidesPanel } from './SlidesPanel';
import { IDEPanel } from './IDEPanel';

/* ── Meta ─────────────────────────────────────── */
const PANEL_META: Record<PanelType, { icon: React.ElementType; label: string; accent: string; soft: string }> = {
  document: { icon: FileText,     label: 'Document',     accent: 'var(--accent)',  soft: 'var(--accent-soft)'  },
  slides:   { icon: Presentation, label: 'Presentation', accent: 'var(--orange)',  soft: 'rgba(212,98,26,0.1)' },
  ide:      { icon: Code2,        label: 'IDE',          accent: 'var(--gold)',    soft: 'var(--gold-soft)'    },
};

/* ── Panel content router ─────────────────────── */
const PanelContent: React.FC<{ panel: WorkspacePanel; isFocused: boolean }> = ({ panel, isFocused }) => {
  if (panel.type === 'document') return <DocumentPanel docId={panel.docId} isFocused={isFocused} />;
  if (panel.type === 'slides')   return <SlidesPanel   docId={panel.docId} isFocused={isFocused} />;
  if (panel.type === 'ide')      return <IDEPanel       docId={panel.docId} isFocused={isFocused} />;
  return null;
};

/* ── Add panel dropdown ───────────────────────── */
const AddPanelButton: React.FC<{ onAdd: (type: PanelType) => void }> = ({ onAdd }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
        style={{ background: 'var(--text-1)', color: 'var(--bg)', fontFamily: 'Nunito, sans-serif' }}>
        <Plus size={13} strokeWidth={2.5} />
        Add panel
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full mt-2 w-52 rounded-2xl py-2 z-50"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
            {(Object.entries(PANEL_META) as [PanelType, typeof PANEL_META[PanelType]][]).map(([type, meta]) => {
              const Icon = meta.icon;
              return (
                <button key={type} onClick={() => { onAdd(type); setOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 transition-all hover:opacity-80 text-left">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.soft }}>
                    <Icon size={15} style={{ color: meta.accent }} strokeWidth={2} />
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>{meta.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Panel title bar ── */
const PanelChrome: React.FC<{
  panel: WorkspacePanel; isFocused: boolean;
  onFocus: () => void; onClose: () => void; onRename: (t: string) => void;
}> = ({ panel, isFocused, onFocus, onClose, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(panel.title);
  const meta = PANEL_META[panel.type];
  const Icon = meta.icon;
  const commit = () => { if (val.trim()) onRename(val.trim()); else setVal(panel.title); setEditing(false); };
  return (
    <div onMouseDown={onFocus} className="flex items-center gap-2 px-3 py-2 flex-shrink-0 select-none"
      style={{ background: isFocused ? 'var(--bg-2)' : 'var(--bg-3)', borderBottom: `2px solid ${isFocused ? meta.accent : 'var(--border)'}`, transition: 'background 0.15s, border-color 0.15s' }}>
      <div style={{ color: 'var(--text-3)' }} className="cursor-default flex-shrink-0"><GripVertical size={12} /></div>
      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: meta.soft }}>
        <Icon size={11} style={{ color: meta.accent }} strokeWidth={2.5} />
      </div>
      {editing ? (
        <input autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(panel.title); setEditing(false); } }}
          className="flex-1 text-xs font-semibold rounded px-1 py-0.5 outline-none"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--accent)', color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', minWidth: 0 }}
          onClick={e => e.stopPropagation()} />
      ) : (
        <span onDoubleClick={() => { setVal(panel.title); setEditing(true); }}
          className="flex-1 text-xs font-semibold truncate cursor-default"
          style={{ color: isFocused ? 'var(--text-1)' : 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
          {panel.title}
        </span>
      )}
      <button onClick={e => { e.stopPropagation(); onClose(); }} className="p-1 rounded-md transition-all hover:opacity-80 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
        <X size={11} />
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   RESIZABLE SPLITTER
   Uses setPointerCapture so drag works even when cursor
   leaves the divider element at high speed.
══════════════════════════════════════════════════════ */
interface SplitterProps {
  direction: 'horizontal' | 'vertical';
  /** initial size of the first pane as percent (0-100) */
  initial?: number;
  children: [React.ReactNode, React.ReactNode];
}

const Splitter: React.FC<SplitterProps> = ({ direction, initial = 50, children }) => {
  const isH = direction === 'horizontal';
  const [split, setSplit] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef   = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos  = isH ? e.clientX - rect.left : e.clientY - rect.top;
    const total = isH ? rect.width : rect.height;
    const pct  = Math.min(85, Math.max(15, (pos / total) * 100));
    setSplit(pct);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div ref={containerRef} className="flex h-full w-full" style={{ flexDirection: isH ? 'row' : 'column' }}>
      {/* Pane A */}
      <div style={{ [isH ? 'width' : 'height']: `${split}%`, [isH ? 'height' : 'width']: '100%', overflow: 'hidden', flexShrink: 0 }}>
        {children[0]}
      </div>

      {/* Drag handle */}
      <div
        ref={dividerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="group flex-shrink-0 flex items-center justify-center z-20 select-none"
        style={{
          [isH ? 'width' : 'height']: 10,
          [isH ? 'height' : 'width']: '100%',
          cursor: isH ? 'col-resize' : 'row-resize',
          touchAction: 'none',
        }}>
        <div
          className="rounded-full transition-all duration-150"
          style={{
            [isH ? 'width' : 'height']: 3,
            [isH ? 'height' : 'width']: 36,
            background: 'var(--accent)',
            opacity: 0.25,
            borderRadius: 99,
            transition: 'opacity 0.15s',
          }}
        />
      </div>

      {/* Pane B */}
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
        {children[1]}
      </div>
    </div>
  );
};

/* ── Panel card ── */
const PanelCard: React.FC<{ panel: WorkspacePanel; isFocused: boolean; onFocus: () => void; onClose: () => void; onRename: (t: string) => void }> = ({
  panel, isFocused, onFocus, onClose, onRename,
}) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    className="flex flex-col h-full w-full"
    style={{ border: `1.5px solid ${isFocused ? PANEL_META[panel.type].accent : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}
    onClick={onFocus}>
    <PanelChrome panel={panel} isFocused={isFocused} onFocus={onFocus} onClose={onClose} onRename={onRename} />
    <div className="flex-1 overflow-hidden"><PanelContent panel={panel} isFocused={isFocused} /></div>
  </motion.div>
);

/* ══ Build tree of Splitters from flat panels array ══
   1 panel  → just the card
   2 panels → Splitter H [A | B]
   3 panels → Splitter H [Splitter H [A | B] | C]  — or V top/bottom
   4 panels → Splitter V [ Splitter H [A|B] | Splitter H [C|D] ]
   etc. — recursive halving
*/
function buildTree(
  panels: WorkspacePanel[],
  focusedId: string | null,
  handlers: { focus: (id: string) => void; remove: (id: string) => void; rename: (id: string, t: string) => void },
  depth = 0
): React.ReactNode {
  if (panels.length === 0) return null;
  if (panels.length === 1) {
    const p = panels[0];
    return (
      <PanelCard key={p.id} panel={p} isFocused={focusedId === p.id}
        onFocus={() => handlers.focus(p.id)}
        onClose={() => handlers.remove(p.id)}
        onRename={t => handlers.rename(p.id, t)} />
    );
  }
  const half = Math.ceil(panels.length / 2);
  const left  = panels.slice(0, half);
  const right = panels.slice(half);
  // Alternate H/V splits per depth level for a natural tiling feel
  const dir: 'horizontal' | 'vertical' = depth % 2 === 0 ? 'horizontal' : 'vertical';
  return (
    <Splitter key={`split-${depth}-${panels.map(p => p.id).join('')}`} direction={dir} initial={50}>
      {buildTree(left, focusedId, handlers, depth + 1) as React.ReactElement}
      {buildTree(right, focusedId, handlers, depth + 1) as React.ReactElement}
    </Splitter>
  );
}

/* ══ WorkspacePage ══ */
export const WorkspacePage: React.FC = () => {
  const { panels, focusedPanelId, addPanel, removePanel, updatePanel, setFocused } = useWorkspaceStore();
  const { addDocument } = useDocumentStore();
  const { user } = useAuthStore();

  const handlers = {
    focus:  useCallback((id: string) => setFocused(id), [setFocused]),
    remove: useCallback((id: string) => removePanel(id), [removePanel]),
    rename: useCallback((id: string, t: string) => updatePanel(id, { title: t }), [updatePanel]),
  };

  const handleAddPanel = useCallback((type: PanelType) => {
    const now  = new Date();
    const mode = (type === 'document' ? 'word' : type === 'slides' ? 'slides' : 'ide') as 'word' | 'slides' | 'ide';
    const meta = PANEL_META[type];
    const doc  = { id: generateId(), title: `Untitled ${meta.label}`, content: '', mode, createdAt: now, updatedAt: now, userId: user?.id || 'local' };
    addDocument(doc);
    addPanel(type, doc.id, doc.title);
  }, [addPanel, addDocument, user]);

  /* ── Empty state ── */
  if (panels.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-3"
            style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>Workspace</p>
          <h2 className="font-extrabold mb-2"
            style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Open multiple files,<br />
            <em style={{ fontFamily: '"Cormorant Garamond",serif', fontStyle: 'italic', color: 'var(--accent)' }}>side by side.</em>
          </h2>
          <p className="text-sm font-medium" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
            Add panels to start — drag the dividers to resize freely.
          </p>
        </div>
        <AddPanelButton onAdd={handleAddPanel} />
        <div className="grid grid-cols-3 gap-4 mt-2">
          {(Object.entries(PANEL_META) as [PanelType, typeof PANEL_META[PanelType]][]).map(([type, meta]) => {
            const Icon = meta.icon;
            return (
              <motion.button key={type} onClick={() => handleAddPanel(type)}
                whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="flex flex-col items-center gap-2 px-8 py-5 rounded-2xl"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: meta.soft }}>
                  <Icon size={20} style={{ color: meta.accent }} strokeWidth={2} />
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>{meta.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5"
        style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Workspace</p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
          {panels.length} open
        </span>
        <div className="ml-auto">
          <AddPanelButton onAdd={handleAddPanel} />
        </div>
      </div>

      {/* Tiling panel area */}
      <div className="flex-1 overflow-hidden p-2" style={{ userSelect: 'none' }}>
        {buildTree(panels, focusedPanelId, handlers)}
      </div>
    </div>
  );
};

