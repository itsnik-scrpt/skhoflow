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
  Undo2, Redo2, Highlighter, FolderOpen, Save, FileText, Plus, Trash2, Copy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SaveDialog, SaveFormat } from '../components/workspace/SaveDialog';
import { downloadFile } from '../utils/saveFile';

const FONTS      = ['Nunito', 'Arial', 'Calibri', 'Cambria', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
const FONT_SIZES = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
const DEFAULT_TEXT_COLORS = ['#111827', '#334155', '#6b7280', '#c0392b', '#d4621a', '#c9962a', '#0f766e', '#2563eb', '#7c3aed'];
const DEFAULT_HIGHLIGHT_COLORS = ['#fef08a', '#fde68a', '#fca5a5', '#a7f3d0', '#bfdbfe', '#ddd6fe', '#fecaca', '#f9a8d4'];

// ── A4 geometry ───────────────────────────────────────────────────────────────
const A4_W_MM   = 210;
const A4_H_MM   = 297;
const MARGIN_MM = 25;
const MM_PX     = 96 / 25.4;   // CSS px per mm at 96 dpi
const PAGE_GAP  = 28;           // px gap between page cards

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
  const [textColor, setTextColor] = useState('#111827');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    ] as any,
    content: '<h1>Untitled Document</h1><p>Start writing your masterpiece here…</p>',
    onUpdate: () => setDirty(true),
  } as any);

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
    if (url && editor) (editor.chain().focus() as any).setImage({ src: url }).run();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    (editor.chain().focus() as any).setImage({ src: dataUrl, alt: file.name }).run();
    setDirty(true);
    e.target.value = '';
  };

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url  = window.prompt('URL', prev);
    if (url === null) return;
    if (url === '') { (editor.chain().focus().extendMarkRange('link') as any).unsetLink().run(); return; }
    (editor.chain().focus().extendMarkRange('link') as any).setLink({ href: url }).run();
  };

  const copySelection = async () => {
    if (!editor) return;
    const selectionText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, '\n').trim();
    if (!selectionText) return;
    try {
      await navigator.clipboard.writeText(selectionText);
      setCopyMessage('Copied');
      window.setTimeout(() => setCopyMessage(null), 1800);
    } catch (error) {
      console.error(error);
      setCopyMessage('Copy failed');
      window.setTimeout(() => setCopyMessage(null), 2200);
    }
  };

  if (!editor) return null;
  const words = editor.storage.characterCount?.words()      ?? 0;
  const chars = editor.storage.characterCount?.characters() ?? 0;

  // Total scrollable column height
  const totalColumnH = pageCount * pageHpx + (pageCount - 1) * PAGE_GAP;

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'Nunito, system-ui, sans-serif', background: 'var(--bg)' }}>
      <SaveDialog open={saveOpen} defaultName={fileName} type="document" onSave={handleSave} onClose={() => setSaveOpen(false)} />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {/* ── Title bar ── */}
      <div className="glass flex items-center gap-4 px-4 py-2.5 border-b z-10 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <FileText size={20} style={{ color: 'var(--accent)' }} />
        <input value={fileName} onChange={e => { setFileName(e.target.value); setDirty(true); }}
          className="text-lg font-medium bg-transparent outline-none border-b border-transparent w-64 transition-colors"
          style={{ color: 'var(--text-1)' }} />
        {dirty && <span className="text-xs" style={{ color: 'var(--text-3)' }}>● Unsaved changes</span>}
        <div className="ml-auto flex items-center gap-2">
          <motion.button onClick={openFile} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            <FolderOpen size={16} /> Open
          </motion.button>
          <motion.button onClick={() => setSaveOpen(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors"
            style={{ background: 'var(--accent)' }}>
            <Save size={16} /> Save
          </motion.button>
        </div>
      </div>

      {/* ── Ribbon toolbar ── */}
      <div className="glass flex-shrink-0 border-b z-10" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1 px-4 py-2 flex-wrap">
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={16} /></Btn>
          <Btn onClick={copySelection} title="Copy Selection"><Copy size={16} /></Btn>
          <Sep />
          <select onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="text-sm rounded-xl px-2 py-1 outline-none w-32 cursor-pointer"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            <option value="">Default Font</option>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select onChange={e => editor.chain().focus().setMark('textStyle', { fontSize: `${e.target.value}pt` }).run()}
            className="text-sm rounded-xl px-2 py-1 outline-none w-16 cursor-pointer ml-1"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            <option value="">Size</option>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Sep />
          <Btn onClick={() => editor.chain().focus().toggleBold().run()}        active={editor.isActive('bold')}        title="Bold"><Bold size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()}      active={editor.isActive('italic')}      title="Italic"><Italic size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()}   active={editor.isActive('underline')}   title="Underline"><UnderlineIcon size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()}      active={editor.isActive('strike')}      title="Strikethrough"><Strikethrough size={16} /></Btn>
          <Btn onClick={() => (editor.chain().focus() as any).toggleSubscript().run()}   active={editor.isActive('subscript')}   title="Subscript"><SubIcon size={16} /></Btn>
          <Btn onClick={() => (editor.chain().focus() as any).toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript"><SupIcon size={16} /></Btn>
          <div className="flex items-center ml-1 gap-1.5" title="Text Color">
            <input
              type="color"
              value={textColor}
              onChange={e => { setTextColor(e.target.value); editor.chain().focus().setColor(e.target.value).run(); }}
              className="w-7 h-7 p-0 border-0 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-1">
              {DEFAULT_TEXT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => { setTextColor(color); editor.chain().focus().setColor(color).run(); }}
                  className="w-4 h-4 rounded-full border"
                  style={{ background: color, borderColor: color === textColor ? 'var(--text-1)' : 'var(--border)' }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Btn onClick={() => editor.chain().focus().toggleHighlight({ color: highlightColor }).run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={16} /></Btn>
            <div className="flex items-center gap-1">
              {DEFAULT_HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setHighlightColor(color)}
                  className="w-4 h-4 rounded-sm border"
                  style={{ background: color, borderColor: color === highlightColor ? 'var(--text-1)' : 'var(--border)' }}
                />
              ))}
            </div>
          </div>
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
          <Btn onClick={() => (editor.chain().focus() as any).toggleTaskList().run()}    active={editor.isActive('taskList')}    title="Checklist"><CheckSquare size={16} /></Btn>
          <Sep />
          <Btn onClick={setLink}   active={editor.isActive('link')} title="Link"><LinkIcon size={16} /></Btn>
          <Btn onClick={addImage}  title="Image URL"><ImageIcon size={16} /></Btn>
          <Btn onClick={() => imageInputRef.current?.click()}  title="Upload image"><Plus size={16} /></Btn>
          <Btn onClick={() => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table"><TableIcon size={16} /></Btn>
          <Btn onClick={() => (editor.chain().focus() as any).addRowAfter().run()} title="Add row"><Plus size={16} /></Btn>
          <Btn onClick={() => (editor.chain().focus() as any).addColumnAfter().run()} title="Add column"><Plus size={16} /></Btn>
          <Btn onClick={() => (editor.chain().focus() as any).deleteTable().run()} title="Delete table"><Trash2 size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={16} /></Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()}  active={editor.isActive('codeBlock')}  title="Code Block"><Code size={16} /></Btn>
        </div>
      </div>

      {/* ── Scrollable canvas ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto" style={{ background: 'linear-gradient(180deg, var(--bg-3), var(--bg))' }}>

        <style>{`
          .doc-pm .ProseMirror { outline: none; color: #111; min-height: 40px; }
          .doc-pm .ProseMirror p              { margin: 0 0 0.85em; line-height: 1.6; }
          .doc-pm .ProseMirror h1             { font-size: 2em;   font-weight: 700; margin: 1.3em 0 0.4em; }
          .doc-pm .ProseMirror h2             { font-size: 1.5em; font-weight: 600; margin: 1.1em 0 0.4em; }
          .doc-pm .ProseMirror h3             { font-size: 1.2em; font-weight: 600; margin: 0.9em 0 0.3em; }
           .doc-pm .ProseMirror a              { color: var(--accent); text-decoration: underline; cursor: pointer; }
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
                 boxShadow: '0 16px 38px rgba(15, 23, 42, 0.16), 0 3px 8px rgba(15, 23, 42, 0.08)',
                 borderRadius: 12,
                 transition: 'top 120ms ease-out',
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
                 background: 'var(--bg-3)',
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
      <div className="glass flex-shrink-0 flex items-center justify-between px-4 py-1.5 border-t text-xs z-10" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
        <div className="flex gap-4">
          <span>Page {currentPage} of {pageCount}</span>
          <span>{words} words</span>
          <span>{chars} characters</span>
          {copyMessage && <span>{copyMessage}</span>}
        </div>

        <div className="flex items-center gap-3">
          <span className="uppercase tracking-wider">A4 Format</span>
          <div className="flex items-center gap-1 rounded-xl px-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="px-2">−</button>
            <span className="w-12 text-center font-medium select-none">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="px-2">+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DocumentEditorPage = AdvancedDocumentEditor;
