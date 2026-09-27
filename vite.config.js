import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let localPlugin = null;
try {
  const target = new URL('../shared/attemptStore.js', import.meta.url);
  const { attemptStorePlugin } = await import(target.href);
  localPlugin = attemptStorePlugin('micro-mystery', fileURLToPath(new URL('.', import.meta.url)));
} catch {
  // Gracefully bypassed on Vercel / standalone deployments
}

export default defineConfig({
  plugins: [
    react(),
    ...(localPlugin ? [localPlugin] : [])
  ],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-ui';
            if (id.includes('@supabase')) return 'vendor-supabase';
            return 'vendor';
          }
        }
      }
    }
  }
});
