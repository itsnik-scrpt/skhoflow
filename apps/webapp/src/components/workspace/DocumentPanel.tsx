import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Undo2, Redo2, Highlighter, Link2,
} from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { debounce } from '../../utils/helpers';
import { SaveDialog, SaveFormat } from './SaveDialog';
import { downloadFile } from '../../utils/saveFile';

interface Props { docId: string | null; isFocused: boolean }

const FONT_SIZES = ['10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];
const FONTS = ['Nunito', 'Georgia', 'Times New Roman', 'Arial', 'Courier New', 'Verdana'];

const ToolBtn: React.FC<{ onClick: () => void; active?: boolean; title: string; children: React.ReactNode; danger?: boolean }> = ({
  onClick, active, title, children, danger,
}) => (
  <button onClick={onClick} title={title}
    className="p-1.5 rounded-md transition-all hover:opacity-80 flex-shrink-0"
    style={{ background: active ? 'var(--accent-soft)' : 'transparent', color: active ? 'var(--accent)' : danger ? '#ef4444' : 'var(--text-3)' }}>
    {children}
  </button>
);

const Sep = () => <div className="w-px h-4 mx-0.5 flex-shrink-0 self-center" style={{ background: 'var(--border)' }} />;

export const DocumentPanel: React.FC<Props> = ({ docId, isFocused }) => {
  const { documents, updateDocument } = useDocumentStore();
  const doc = docId ? documents.find(d => d.id === docId) : null;
  const [saveOpen, setSaveOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
    ],
    content: doc?.content || `<h1>Untitled Document</h1><p>Start writing here…</p>`,
  });

  useEffect(() => {
    if (editor && doc?.content && editor.getHTML() !== doc.content)
      editor.commands.setContent(doc.content, false);
  }, [docId]);

  const autoSave = useCallback(
    debounce(() => {
      if (!editor || !docId) return;
      updateDocument(docId, { content: editor.getHTML(), updatedAt: new Date() });
    }, 1200),
    [editor, docId]
  );

  useEffect(() => {
    if (!editor) return;
    editor.on('update', autoSave);
    return () => { editor.off('update', autoSave); };
  }, [editor, autoSave]);

  useEffect(() => {
    if (!isFocused || !editor) return;
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 's') { e.preventDefault(); setSaveOpen(true); }
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); editor.commands.undo(); }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); editor.commands.redo(); }
      if (e.key === 'b') { e.preventDefault(); editor.chain().focus().toggleBold().run(); }
      if (e.key === 'i') { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }
      if (e.key === 'u') { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isFocused, editor]);

  const handleSave = (name: string, format: SaveFormat) => {
    const content = editor?.getHTML() ?? '';
    if (docId) updateDocument(docId, { title: name, content, updatedAt: new Date() });
    downloadFile(name, content, format, 'document');
    setSaveOpen(false);
  };

  if (!editor) return null;

  const words = editor.storage.characterCount?.words() ?? 0;
  const chars = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <SaveDialog open={saveOpen} defaultName={doc?.title || 'Untitled Document'} type="document" onSave={handleSave} onClose={() => setSaveOpen(false)} />

      {/* ── Ribbon toolbar ── */}
      <div className="flex-shrink-0" style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
        {/* Row 1: font controls */}
        <div className="flex items-center gap-1 px-3 py-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Font family */}
          <select
            onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="text-xs rounded-lg px-2 py-1 outline-none"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif', maxWidth: 120 }}>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {/* Font size via marks */}
          <select
            className="text-xs rounded-lg px-2 py-1 outline-none w-16"
            style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-2)', fontFamily: 'Nunito, sans-serif' }}
            onChange={e => editor.chain().focus().setMark('textStyle', { fontSize: `${e.target.value}pt` }).run()}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <Sep />

          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)"><Bold size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)"><Italic size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)"><UnderlineIcon size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={13} /></ToolBtn>

          <Sep />

          {/* Text colour */}
          <label title="Text color" className="flex items-center cursor-pointer">
            <div className="w-5 h-5 rounded flex items-center justify-center relative" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-2)' }}>A</span>
              <input type="color" className="absolute opacity-0 w-full h-full cursor-pointer"
                onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
            </div>
          </label>

          <Sep />

          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight size={13} /></ToolBtn>

          <Sep />

          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={13} /></ToolBtn>

          <Sep />

          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={13} /></ToolBtn>

          <Sep />

          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={13} /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={13} /></ToolBtn>

          {/* Zoom */}
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--text-3)', background: 'var(--bg-3)' }}>−</button>
            <span className="text-xs font-bold w-10 text-center" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--text-3)', background: 'var(--bg-3)' }}>+</button>
          </div>
        </div>
      </div>

      {/* ── Page canvas ── */}
      <div className="flex-1 overflow-auto py-8 px-4"
        style={{ background: 'var(--bg-3)' }}>
        {/* Paper page */}
        <div
          className="mx-auto shadow-xl"
          style={{
            width: `${(210 / 297) * 100 * (zoom / 100)}mm`,
            minHeight: `${297 * (zoom / 100)}mm`,
            maxWidth: '100%',
            background: 'white',
            padding: `${20 * (zoom / 100)}mm ${25 * (zoom / 100)}mm`,
            transform: 'none',
            color: '#111',
            borderRadius: 2,
          }}>
          <style>{`
            .ProseMirror { outline: none; min-height: 200px; }
            .ProseMirror h1 { font-size: 2em; font-weight: 800; margin: 0 0 .4em; }
            .ProseMirror h2 { font-size: 1.5em; font-weight: 700; margin: 0 0 .35em; }
            .ProseMirror h3 { font-size: 1.17em; font-weight: 600; margin: 0 0 .3em; }
            .ProseMirror p  { margin: 0 0 .6em; line-height: 1.7; }
            .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; margin: 0 0 .6em; }
            .ProseMirror blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; color: #6b7280; margin: 0 0 .6em; }
            .ProseMirror code { background: #f3f4f6; padding: .1em .3em; border-radius: 3px; font-family: monospace; font-size:.9em; }
          `}</style>
          <EditorContent editor={editor} style={{ fontFamily: 'Nunito, sans-serif', fontSize: `${11 * (zoom / 100)}pt`, color: '#111' }} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-1"
        style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>{words} words</span>
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>{chars} chars</span>
        <span className="ml-auto text-[10px] font-semibold" style={{ color: 'var(--text-3)', fontFamily: 'Nunito, sans-serif' }}>A4 · {zoom}%</span>
      </div>
    </div>
  );
};

