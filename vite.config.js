import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxya alla API-anrop till den riktiga API-servern
      '/api': {
        target: 'https://mallbrf.vercel.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
}); 