import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

export default defineConfig(async () => {
  const plugins = [react()];
  const attemptStorePath = fileURLToPath(new URL('../shared/attemptStore.js', import.meta.url));
  
  if (fs.existsSync(attemptStorePath)) {
    const { attemptStorePlugin } = await import(attemptStorePath);
    plugins.push(attemptStorePlugin('micro-mystery', fileURLToPath(new URL('.', import.meta.url))));
  }

  return { plugins };
});
