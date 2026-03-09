import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import { useEditorStore } from '../store/editorStore';
import { debounce } from '../utils/helpers';

const Btn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded text-xs font-medium transition-colors min-w-[28px] ${
      active
        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />;

export const WordMode: React.FC = () => {
  const { setUnsavedChanges } = useEditorStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
    ],
    content: '<h1>Untitled Document</h1><p>Start writing here...</p>',
    onUpdate: () => setUnsavedChanges(true),
  });

  const autoSave = useCallback(debounce(() => setUnsavedChanges(false), 2000), []);
  useEffect(() => { if (editor) editor.on('update', autoSave); }, [editor, autoSave]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><strong>B</strong></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><span className="underline">U</span></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><span className="line-through">S</span></Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">&#8676;</Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center">&#8677;</Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">&#8677;</Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">&#8596;</Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">&#8226; List</Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">1. List</Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">&#8220; &#8221;</Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">&lt;/&gt;</Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">&#8617;</Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">&#8618;</Btn>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-12 px-8">
          <EditorContent editor={editor} className="prose prose-gray dark:prose-invert max-w-none focus:outline-none" />
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-4">
        <span className="text-xs text-gray-400">
          {editor.storage.characterCount?.characters() ?? 0} characters &nbsp;·&nbsp; {editor.storage.characterCount?.words() ?? 0} words
        </span>
      </div>
    </div>
  );
};
