import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { yandexProxyPlugin } from './vite.yandex-proxy.ts';

export default defineConfig({
  plugins: [react(), yandexProxyPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
