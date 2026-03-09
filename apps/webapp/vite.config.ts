import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-text-style',
      '@tiptap/extension-color',
      '@tiptap/extension-underline',
      '@tiptap/extension-text-align',
      '@tiptap/extension-character-count',
      '@tiptap/extension-highlight',
      '@tiptap/extension-font-family',
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-header',
      '@tiptap/extension-table-cell',
      '@tiptap/extension-image',
      '@tiptap/extension-link',
      '@tiptap/extension-task-list',
      '@tiptap/extension-task-item',
      '@tiptap/extension-superscript',
      '@tiptap/extension-subscript',
      '@monaco-editor/react',
      'docx',
      'jspdf',
      'html2canvas',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
