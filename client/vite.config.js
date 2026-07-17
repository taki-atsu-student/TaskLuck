import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_BASE_URL || 'http://localhost:5001';

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': apiUrl,
      },
    },
  });
};
