import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'remotion': ['@remotion/player', '@remotion/renderer'],
          'framer': ['framer-motion'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@remotion/player', '@remotion/renderer', 'framer-motion']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})
