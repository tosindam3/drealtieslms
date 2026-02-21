import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-tiptap': [
              '@tiptap/react',
              '@tiptap/starter-kit',
              '@tiptap/extension-color',
              '@tiptap/extension-highlight',
              '@tiptap/extension-image',
              '@tiptap/extension-link',
              '@tiptap/extension-table',
              '@tiptap/extension-table-cell',
              '@tiptap/extension-table-header',
              '@tiptap/extension-table-row',
              '@tiptap/extension-text-align',
              '@tiptap/extension-text-style',
              '@tiptap/extension-underline'
            ],
            'vendor-charts': ['recharts'],
            'vendor-icons': ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 800
    }
  };
});
