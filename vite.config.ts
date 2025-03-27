import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '^/rendered/.*': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})
