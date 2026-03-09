import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import { motion } from 'framer-motion';
import { useEditorStore } from '../store/editorStore';
import { debounce } from '../utils/helpers';

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

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
    ],
    content: '<p>Start writing your document...</p>',
    onUpdate: () => {
      setUnsavedChanges(true);
    },
  });

  const autoSave = useCallback(
    debounce(() => {
      setUnsavedChanges(false);
    }, 2000),
    []
  );

  useEffect(() => {
    if (editor) {
      editor.on('update', autoSave);
    }
  }, [editor, autoSave]);

  if (!editor) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          •≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          1≡
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          ⬛
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Undo"
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Redo"
        >
          ↪
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <span>{editor.storage.characterCount?.words() || 0} words</span>
          <span>{editor.storage.characterCount?.characters() || 0} chars</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm p-12 min-h-[842px]">
          <EditorContent
            editor={editor}
            className="prose dark:prose-invert max-w-none focus:outline-none text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
    </motion.div>
  );
};
