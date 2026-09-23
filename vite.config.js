import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { attemptStorePlugin } from '../shared/attemptStore.js';

export default defineConfig({
  plugins: [react(), attemptStorePlugin('micro-mystery', fileURLToPath(new URL('.', import.meta.url)))],
});
