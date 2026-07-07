import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://yhcfr2u9hg.execute-api.ap-northeast-1.amazonaws.com'
    }
  }
});
