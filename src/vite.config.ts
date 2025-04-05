import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://motage.onrender.com:8000',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/rendered': {
        target: 'https://motage.onrender.com:8000',
        changeOrigin: true,
        secure: true
      }
    }
  }
});


