import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 5173,      // Standard Vite port
        host: '0.0.0.0', // Allows network access
        proxy: {
          // Directs frontend /api calls to your Express backend
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      // Removed the 'define' block entirely to stop exposing keys to the client
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), 
        }
      }
    };
});
