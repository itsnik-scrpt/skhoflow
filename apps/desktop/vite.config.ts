import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
})
