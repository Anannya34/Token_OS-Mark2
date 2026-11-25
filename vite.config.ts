import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'clsx',
      'tailwind-merge',
      'framer-motion',
      'lucide-react',
      'recharts',
      '@supabase/supabase-js',
    ],
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/Token-OS/**', '**/dist/**', '**/.git/**', '**/node_modules/**'],
    },
    proxy: {
      '/api/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, ''),
      },
      '/api/groq': {
        target: 'https://api.groq.com/openai/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/groq/, ''),
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com/v1beta',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      },
      '/api/ml': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ml/, ''),
      },
    },
  },
});
