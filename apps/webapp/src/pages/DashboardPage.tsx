import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Presentation, Code2, Clock,
  Plus, LayoutDashboard, Search, ChevronDown,
  Trash2, Edit3, X, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDocumentStore } from '../store/documentStore';
import { generateId } from '../utils/helpers';

/* ─── Types ────────────────────────────────────────────── */
type NavId = 'overview' | 'documents' | 'slides' | 'ide';

/* ─── Constants ─────────────────────────────────────────── */
const NAV: { icon: typeof LayoutDashboard; label: string; id: NavId }[] = [
  { icon: LayoutDashboard, label: 'Overview',      id: 'overview'   },
  { icon: FileText,        label: 'Documents',     id: 'documents'  },
  { icon: Presentation,    label: 'Presentations', id: 'slides'     },
  { icon: Code2,           label: 'IDE Projects',  id: 'ide'        },
];

const TOOL_META = {
  word:   { label: 'Document',     icon: FileText,     accent: 'var(--accent)',  soft: 'var(--accent-soft)',  route: '/editor/document', badge: 'Doc'    },
  slides: { label: 'Presentation', icon: Presentation, accent: 'var(--orange)',  soft: 'rgba(212,98,26,0.1)', route: '/editor/slides',   badge: 'Slides' },
  ide:    { label: 'IDE Project',  icon: Code2,        accent: 'var(--gold)',    soft: 'var(--gold-soft)',    route: '/editor/ide',      badge: 'IDE'    },
} as const;

const CREATE_OPTIONS = [
  { mode: 'word'   as const, label: 'Document',     desc: 'Rich text, headings, export-ready.' },
  { mode: 'slides' as const, label: 'Presentation', desc: 'Drag-and-drop slide canvas.'        },
  { mode: 'ide'    as const, label: 'IDE Project',  desc: 'Multi-file editor + terminal.'      },
];

/* ─── Animations ─────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };

/* ─── Helpers ────────────────────────────────────────────── */
const SIDEBAR_RECENT_LIMIT = 6;

function timeAgo(date: Date | string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60)     return 'Just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDate(docs: ReturnType<typeof useDocumentStore.getState>['documents']) {
  const now = Date.now();
  const groups: Record<string, typeof docs> = { Today: [], 'This week': [], 'This month': [], Older: [] };
  docs.forEach(d => {
    const ms = now - new Date(d.updatedAt).getTime();
    if (ms < 86400000)        groups['Today'].push(d);
    else if (ms < 604800000)  groups['This week'].push(d);
    else if (ms < 2592000000) groups['This month'].push(d);
    else                      groups['Older'].push(d);
  });
  return groups;
}

/* ═══════════════════════════════════════════════════════════ */
export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { documents, addDocument, removeDocument, updateDocument } = useDocumentStore();
  const navigate = useNavigate();

  const [activeNav, setActiveNav]     = useState<NavId>('overview');
  const [search, setSearch]           = useState('');
  const [newOpen, setNewOpen]         = useState(false);
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [menuOpenId, setMenuOpenId]   = useState<string | null>(null);

  const newRef = useRef<HTMLDivElement>(null);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (newRef.current && !newRef.current.contains(e.target as Node)) setNewOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Create ── */
  const createFile = (mode: 'word' | 'slides' | 'ide') => {
    const meta = TOOL_META[mode];
    const now  = new Date();
    addDocument({ id: generateId(), title: `Untitled ${meta.label}`, content: '', mode, createdAt: now, updatedAt: now, userId: user?.id || 'local' });
    setNewOpen(false);
    navigate(meta.route);
  };

  /* ── Filter / group ── */
  const modeFilter: Record<NavId, string | null> = { overview: null, documents: 'word', slides: 'slides', ide: 'ide' };

  const filtered = documents
    .filter(d => !modeFilter[activeNav] || d.mode === modeFilter[activeNav])
    .filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const grouped = groupByDate(filtered);

  // Sidebar recents — always all docs, most recent first, capped
  const sidebarRecents = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, SIDEBAR_RECENT_LIMIT);

  /* ── Rename ── */
  const startRename  = (id: string, title: string) => { setRenamingId(id); setRenameValue(title); setMenuOpenId(null); };
  const commitRename = (id: string) => { if (renameValue.trim()) updateDocument(id, { title: renameValue.trim() }); setRenamingId(null); };

  return (
    <div className="h-full flex overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <aside className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--border)' }}>

        {/* Greeting */}
        <div className="px-6 pt-8 pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] mb-1.5"
            style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>{greeting}</p>
          <p className="font-extrabold text-xl leading-none"
            style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', letterSpacing: '-0.025em' }}>
            {firstName}<em style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: 'var(--accent)' }}>.</em>
          </p>
        </div>

        {/* Workspace nav */}
        <nav className="px-3 mb-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mb-1.5"
            style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Workspace</p>
          {NAV.map(({ icon: Icon, label, id }) => {
            const active = activeNav === id;
            const count  = id === 'overview' ? documents.length : documents.filter(d => d.mode === modeFilter[id]).length;
            return (
              <button key={id} onClick={() => setActiveNav(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                style={{ background: active ? 'var(--bg-3)' : 'transparent', color: active ? 'var(--text-1)' : 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? 'var(--accent)' : 'var(--text-3)', flexShrink: 0 }} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: active ? 'var(--accent-soft)' : 'var(--bg-3)', color: active ? 'var(--accent)' : 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mx-6 my-3" style={{ borderTop: '1px solid var(--border)' }} />

        {/* Recent files in sidebar */}
        <div className="px-3 flex-1 min-h-0 flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] px-3 mb-1.5"
            style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Recent</p>

          {sidebarRecents.length === 0 ? (
            <p className="px-3 text-xs font-medium" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
              No files yet
            </p>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-0.5">
                {sidebarRecents.map(doc => {
                  const meta = TOOL_META[doc.mode as keyof typeof TOOL_META] ?? TOOL_META.word;
                  const Icon = meta.icon;
                  return (
                    <Link key={doc.id} to={meta.route}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                      style={{ color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}>
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: meta.soft }}>
                        <Icon size={12} style={{ color: meta.accent }} strokeWidth={2} />
                      </span>
                      <span className="flex-1 text-xs font-semibold truncate">{doc.title}</span>
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-3)' }}>{timeAgo(doc.updatedAt)}</span>
                    </Link>
                  );
                })}
              </div>

              {documents.length > SIDEBAR_RECENT_LIMIT && (
                <button onClick={() => setActiveNav('overview')}
                  className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all hover:opacity-80"
                  style={{ color: 'var(--accent)', fontFamily: 'Nunito, sans-serif' }}>
                  <ArrowRight size={12} />
                  View all {documents.length} files
                </button>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ══ MAIN ════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>

        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-10 px-8 py-4 flex items-center gap-3"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-3)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full pl-10 pr-8 py-2 rounded-xl text-sm font-medium outline-none"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-3)' }}><X size={13} /></button>
            )}
          </div>

          {/* Single "New" dropdown button */}
          <div ref={newRef} className="relative">
            <motion.button onClick={() => setNewOpen(o => !o)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'var(--text-1)', color: 'var(--bg)', fontFamily: 'Nunito, sans-serif' }}>
              <Plus size={15} strokeWidth={2.5} />
              New
              <ChevronDown size={13} className={`transition-transform duration-200 ${newOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {newOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 z-50"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 16px 48px rgba(0,0,0,0.14)' }}>
                  {CREATE_OPTIONS.map(({ mode, label, desc }) => {
                    const meta = TOOL_META[mode];
                    const Icon = meta.icon;
                    return (
                      <button key={mode} onClick={() => createFile(mode)}
                        className="flex items-start gap-3 w-full px-4 py-3 transition-all hover:opacity-80 text-left"
                        style={{ fontFamily: 'Nunito, sans-serif' }}>
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: meta.soft }}>
                          <Icon size={15} style={{ color: meta.accent }} strokeWidth={2} />
                        </span>
                        <div>
                          <p className="text-sm font-bold leading-none mb-0.5" style={{ color: 'var(--text-1)' }}>{label}</p>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── File list ── */}
        <div className="px-8 py-6">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--bg-2)', border: '1px dashed var(--border)' }}>
                <Clock size={20} style={{ color: 'var(--text-3)' }} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}>
                {search ? 'No results found' : 'No files yet'}
              </p>
              <p className="text-xs font-medium" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                {search ? 'Try a different keyword' : 'Use the New button above to create your first file'}
              </p>
            </motion.div>
          ) : (
            <div>
              {/* Column headers */}
              <div className="flex items-center gap-4 px-4 pb-2 mb-1"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-8 flex-shrink-0" />
                <p className="flex-1 text-[11px] font-black uppercase tracking-[0.14em]"
                  style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Name</p>
                <p className="w-24 text-[11px] font-black uppercase tracking-[0.14em] text-right hidden md:block"
                  style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Type</p>
                <p className="w-28 text-[11px] font-black uppercase tracking-[0.14em] text-right"
                  style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>Modified</p>
                <div className="w-8 flex-shrink-0" />
              </div>

              {/* Grouped rows */}
              {Object.entries(grouped).map(([group, docs]) => {
                if (docs.length === 0) return null;
                return (
                  <div key={group} className="mb-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] px-4 py-2.5"
                      style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>{group}</p>
                    <motion.div variants={stagger} initial="hidden" animate="show">
                      {docs.map((doc) => {
                        const meta       = TOOL_META[doc.mode as keyof typeof TOOL_META] ?? TOOL_META.word;
                        const Icon       = meta.icon;
                        const isRenaming = renamingId === doc.id;

                        return (
                          <motion.div key={doc.id} variants={fadeUp}
                            className="group flex items-center gap-4 px-4 py-2.5 rounded-xl transition-colors"
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>

                            {/* File icon */}
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: meta.soft }}>
                              <Icon size={15} style={{ color: meta.accent }} strokeWidth={2} />
                            </div>

                            {/* Title / rename input */}
                            <div className="flex-1 min-w-0">
                              {isRenaming ? (
                                <input autoFocus value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  onBlur={() => commitRename(doc.id)}
                                  onKeyDown={e => { if (e.key === 'Enter') commitRename(doc.id); if (e.key === 'Escape') setRenamingId(null); }}
                                  className="w-full rounded-lg px-2 py-0.5 text-sm font-semibold outline-none"
                                  style={{ background: 'var(--bg-3)', border: '1px solid var(--accent)', color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif', boxShadow: '0 0 0 3px var(--accent-soft)' }}
                                  onClick={e => e.stopPropagation()} />
                              ) : (
                                <Link to={meta.route}
                                  className="block text-sm font-semibold truncate hover:opacity-80"
                                  style={{ color: 'var(--text-1)', fontFamily: 'Nunito, sans-serif' }}>
                                  {doc.title}
                                </Link>
                              )}
                            </div>

                            {/* Type badge */}
                            <span className="w-24 text-right hidden md:block">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                                style={{ background: meta.soft, color: meta.accent, fontFamily: 'Nunito, sans-serif' }}>
                                {meta.badge}
                              </span>
                            </span>

                            {/* Time */}
                            <span className="w-28 text-right text-xs font-medium flex-shrink-0"
                              style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>
                              {timeAgo(doc.updatedAt)}
                            </span>

                            {/* Inline action buttons — visible on row hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); startRename(doc.id, doc.title); }}
                                title="Rename"
                                className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                style={{ background: 'var(--bg-3)', color: 'var(--text-3)' }}>
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); removeDocument(doc.id); }}
                                title="Delete"
                                className="p-1.5 rounded-lg transition-all hover:opacity-80"
                                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
