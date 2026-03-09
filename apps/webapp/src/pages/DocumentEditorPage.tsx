import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';

import {
  Bold, Italic, UnderlineIcon, Strikethrough, Superscript as SupIcon, Subscript as SubIcon,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Quote, Code, Table as TableIcon, Image as ImageIcon, Link as LinkIcon,
  Undo2, Redo2, Highlighter, FolderOpen, Save, FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SaveDialog, SaveFormat } from '../components/workspace/SaveDialog';
import { downloadFile } from '../utils/saveFile';

const FONTS      = ['Nunito', 'Arial', 'Calibri', 'Cambria', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

// ── A4 geometry ───────────────────────────────────────────────────────────────
const A4_W_MM   = 210;
const A4_H_MM   = 297;
const MARGIN_MM = 25;
const MM_PX     = 96 / 25.4;   // CSS px per mm at 96 dpi
const PAGE_GAP  = 20;           // px gap between page cards

// ── Toolbar helpers ───────────────────────────────────────────────────────────
const Btn: React.FC<{ onClick: () => void; active?: boolean; title: string; children: React.ReactNode }> = ({
  onClick, active, title, children,
}) => (
  <button onClick={onClick} title={title}
    className="p-1.5 rounded-md transition-all hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0"
    style={{ background: active ? 'var(--accent-soft,#e0e7ff)' : 'transparent', color: active ? 'var(--accent,#4f46e5)' : 'var(--text-3,#4b5563)' }}>
    {children}
  </button>
);
const Sep = () => <div className="w-px h-6 mx-1 flex-shrink-0 self-center" style={{ background: 'var(--border,#e5e7eb)' }} />;

// ── Main component ────────────────────────────────────────────────────────────
export const AdvancedDocumentEditor: React.FC = () => {
  const [fileName,    setFileName]    = useState('Untitled Document');
  const [zoom,        setZoom]        = useState(100);
  const [saveOpen,    setSaveOpen]    = useState(false);
  const [dirty,       setDirty]       = useState(false);
  const [pageCount,   setPageCount]   = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Derived geometry
  const scale      = zoom / 100;
  const pageWpx    = A4_W_MM   * MM_PX * scale;
  const pageHpx    = A4_H_MM   * MM_PX * scale;
  const marginPx   = MARGIN_MM * MM_PX * scale;
  const contentWpx = pageWpx   - marginPx * 2;
  const contentHpx = pageHpx   - marginPx * 2;

  // ── Editor ────────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: { depth: 100 } }),
      TextStyle, Color, Underline, FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Superscript, Subscript,
    ],
    content: '<h1>Untitled Document</h1><p>Start writing your masterpiece here…</p>',
    onUpdate: () => setDirty(true),
  });

  // ── Page-count recomputation ──────────────────────────────────────────────
  const recomputePages = useCallback(() => {
    const el = contentRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
    if (!el) return;
    setPageCount(Math.max(1, Math.ceil(el.scrollHeight / contentHpx)));
  }, [contentHpx]);

  useEffect(() => {
    const el = contentRef.current?.querySelector('.ProseMirror') as HTMLElement | null;
    if (!el) return;
    const ro = new ResizeObserver(recomputePages);
    ro.observe(el);
    recomputePages();
    return () => ro.disconnect();
  }, [editor, recomputePages]);

  useEffect(() => { recomputePages(); }, [zoom, recomputePages]);

  // ── Current-page tracking from scroll ────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      const p = Math.floor(el.scrollTop / (pageHpx + PAGE_GAP)) + 1;
      setCurrentPage(Math.min(p, pageCount));
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [pageHpx, pageCount]);

  // ── File ops ──────────────────────────────────────────────────────────────
  const openFile = async () => {
    try {
      // @ts-ignore
      const [fh] = await window.showOpenFilePicker({
        types: [{ description: 'Documents', accept: { 'text/html': ['.html'], 'application/json': ['.skho'], 'text/plain': ['.txt', '.md'] } }],
      });
      const file = await fh.getFile();
      const text = await file.text();
      setFileName(file.name.replace(/\.[^.]+$/, ''));
      let content = text;
      if (file.name.endsWith('.skho')) { try { content = JSON.parse(text).content || text; } catch { /**/ } }
      editor?.commands.setContent(content, false);
      setDirty(false);
    } catch (e: any) { if (e?.name !== 'AbortError') console.error(e); }
  };

  const handleSave = async (name: string, format: SaveFormat) => {
    setFileName(name);
    await downloadFile(name, editor?.getHTML() ?? '', format, 'document');
    setSaveOpen(false);
    setDirty(false);
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url  = window.prompt('URL', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;
  const words = editor.storage.characterCount?.words()      ?? 0;
  const chars = editor.storage.characterCount?.characters() ?? 0;

  // Total scrollable column height
  const totalColumnH = pageCount * pageHpx + (pageCount - 1) * PAGE_GAP;

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'system-ui,sans-serif', background: '#f0f0f0' }}>
      <SaveDialog open={saveOpen} defaultName={fileName} type="document" onSave={handleSave} onClose={() => setSaveOpen(false)} />

      {/* ── Title bar ── */}
      <div className="flex items-center gap-4 px-4 py-2 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 shadow-sm z-10 flex-shrink-0">
        <FileText size={20} className="text-blue-600 dark:text-blue-400" />
        <input value={fileName} onChange={e => { setFileName(e.target.value); setDirty(true); }}
          className="text-lg font-medium bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors w-64 text-gray-800 dark:text-gray-100" />
        {dirty && <span className="text-xs text-gray-400">● Unsaved changes</span>}
        <div className="ml-auto flex items-center gap-2">
          <motion.button onClick={openFile} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600 transition-colors">
            <FolderOpen size={16} /> Open
          </motion.button>
          <motion.button onClick={() => setSaveOpen(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
            <Save size={16} /> Save
          </motion.button>
        </div>
      </div>

      {/* ── Ribbon toolbar ── */}
      <div className="flex-shrink-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 z-10">
        <div className="flex items-center gap-1 px-4 py-2 flex-wrap">
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={16} /></Btn>
          <Sep />
          <select onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="text-sm rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 outline-none text-gray-700 dark:text-gray-200 w-32 cursor-pointer">
            <option value="">Default Font</option>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select onChange={e => editor.chain().focus().setMark('textStyle', { fontSize: `${e.target.value}pt` }).run()}
            className="text-sm rounded border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-2 py-1 outline-none text-gray-700 dark:text-gray-200 w-16 cursor-pointer ml-1">
            <option value="">Size</option>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleBold().run()}        active={editor.isActive('bold')}        title="Bold"><Bold size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()}      active={editor.isActive('italic')}      title="Italic"><Italic size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()}   active={editor.isActive('underline')}   title="Underline"><UnderlineIcon size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()}      active={editor.isActive('strike')}      title="Strikethrough"><Strikethrough size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleSubscript().run()}   active={editor.isActive('subscript')}   title="Subscript"><SubIcon size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript"><SupIcon size={16} /></Btn>
          <div className="relative flex items-center ml-1" title="Text Color">
            <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} className="w-6 h-6 p-0 border-0 rounded cursor-pointer" />
          </div>
          <Btn onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={16} /></Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()}    active={editor.isActive({ textAlign: 'left' })}    title="Left"><AlignLeft size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()}  active={editor.isActive({ textAlign: 'center' })}  title="Center"><AlignCenter size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()}   active={editor.isActive({ textAlign: 'right' })}   title="Right"><AlignRight size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustify size={16} /></Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1"><Heading1 size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2"><Heading2 size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3"><Heading3 size={16} /></Btn>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')}  title="Bullet List"><List size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleTaskList().run()}    active={editor.isActive('taskList')}    title="Checklist"><CheckSquare size={16} /></Btn>
          <Sep />
          <Btn onClick={setLink}   active={editor.isActive('link')} title="Link"><LinkIcon size={16} /></Btn>
          <Btn onClick={addImage}  title="Image"><ImageIcon size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table"><TableIcon size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()}  active={editor.isActive('codeBlock')}  title="Code Block"><Code size={16} /></Btn>
        </div>
      </div>

      {/* ── Scrollable canvas ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto" style={{ background: '#d0d0d0' }}>

        <style>{`
          .doc-pm .ProseMirror { outline: none; color: #111; min-height: 40px; }
          .doc-pm .ProseMirror p              { margin: 0 0 0.85em; line-height: 1.6; }
          .doc-pm .ProseMirror h1             { font-size: 2em;   font-weight: 700; margin: 1.3em 0 0.4em; }
          .doc-pm .ProseMirror h2             { font-size: 1.5em; font-weight: 600; margin: 1.1em 0 0.4em; }
          .doc-pm .ProseMirror h3             { font-size: 1.2em; font-weight: 600; margin: 0.9em 0 0.3em; }
          .doc-pm .ProseMirror a              { color: #2563eb; text-decoration: underline; cursor: pointer; }
          .doc-pm .ProseMirror img            { max-width: 100%; height: auto; border-radius: 4px; margin: 0.8em 0; display: block; }
          .doc-pm .ProseMirror table          { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1em 0; }
          .doc-pm .ProseMirror th,
          .doc-pm .ProseMirror td             { border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; }
          .doc-pm .ProseMirror th             { background: #f3f4f6; font-weight: 600; text-align: left; }
          .doc-pm ul[data-type="taskList"]    { list-style: none; padding: 0; }
          .doc-pm ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5em; margin-bottom: 0.4em; }
          .doc-pm .ProseMirror blockquote     { border-left: 4px solid #cbd5e1; padding-left: 1em; font-style: italic; color: #475569; margin: 1em 0; }
          .doc-pm .ProseMirror pre            { background: #1e293b; color: #f8fafc; padding: 1em; border-radius: 4px; font-family: monospace; overflow-x: auto; margin: 1em 0; }
          .doc-pm .ProseMirror code           { background: #f1f5f9; border-radius: 3px; padding: 0.15em 0.35em; font-size: 0.88em; font-family: monospace; }
        `}</style>

        {/*
          ─────────────────────────────────────────────────────────────────────
          LAYOUT  (identical to Google Docs / LibreOffice Web)
          ─────────────────────────────────────────────────────────────────────
          • A single centred column, width = A4 page width.
          • Absolutely-positioned white page-card divs sit at
              top = i * (pageHpx + PAGE_GAP)
            for i = 0 … pageCount-1, each sized exactly A4, z-index 0.
          • Grey gutter strips sit BETWEEN each pair of cards, z-index 2,
            background = canvas colour → they visually cut the editor at
            each page boundary (the editor itself keeps flowing freely).
          • The real TipTap editor is absolutely-positioned at
              top = marginPx, left = marginPx
            with width = contentWpx. z-index 1. No height constraint.
          • As the user types and the editor grows, ResizeObserver fires
            → pageCount increases → more cards and gutters are added.
          ─────────────────────────────────────────────────────────────────────
        */}
        <div
          style={{
            position:   'relative',
            width:      pageWpx,
            minHeight:  totalColumnH + PAGE_GAP * 2,
            margin:     `${PAGE_GAP}px auto`,
          }}
        >
          {/* ── Page cards (white backgrounds) ── */}
          {Array.from({ length: pageCount }, (_, i) => (
            <div
              key={`card-${i}`}
              style={{
                position:  'absolute',
                top:       i * (pageHpx + PAGE_GAP),
                left:      0,
                width:     pageWpx,
                height:    pageHpx,
                background: '#ffffff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.20), 0 3px 16px rgba(0,0,0,0.10)',
                borderRadius: 1,
                zIndex:    0,
                pointerEvents: 'none',
              }}
            >
              {/* Page number */}
              <span style={{
                position: 'absolute', bottom: -18, right: 4,
                fontSize: 11, color: '#aaa', fontFamily: 'system-ui,sans-serif', userSelect: 'none',
              }}>
                {i + 1}
              </span>
            </div>
          ))}

          {/* ── Gutter strips between pages ── */}
          {Array.from({ length: pageCount - 1 }, (_, i) => (
            <div
              key={`gutter-${i}`}
              style={{
                position:   'absolute',
                top:        (i + 1) * pageHpx + i * PAGE_GAP,
                left:       -80,          // extend far past page edges
                right:      -80,
                height:     PAGE_GAP,
                background: '#d0d0d0',
                zIndex:     2,            // above editor (1) → clips it visually
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* ── The single interactive editor ── */}
          <div
            ref={contentRef}
            style={{
              position:   'absolute',
              top:        marginPx,
              left:       marginPx,
              width:      contentWpx,
              zIndex:     1,
            }}
          >
            <div className="doc-pm" style={{ fontSize: `${11 * scale}pt`, fontFamily: 'Arial, sans-serif' }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 text-xs text-gray-500 dark:text-gray-400 z-10">
        <div className="flex gap-4">
          <span>Page {currentPage} of {pageCount}</span>
          <span>{words} words</span>
          <span>{chars} characters</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="uppercase tracking-wider">A4 Format</span>
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-700 rounded border border-gray-200 dark:border-zinc-600 px-1">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="px-2 hover:text-blue-600">−</button>
            <span className="w-12 text-center font-medium select-none">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="px-2 hover:text-blue-600">+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DocumentEditorPage = AdvancedDocumentEditor;
