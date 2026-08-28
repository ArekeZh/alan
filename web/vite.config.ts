import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { yandexProxyPlugin } from './vite.yandex-proxy.ts';

export default defineConfig({
  plugins: [react(), yandexProxyPlugin()],
});
