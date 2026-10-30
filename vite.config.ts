import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { watch: { ignored: ['**/work/**', '**/test-results/**', '**/playwright-report/**'] } },
  // A demo build must never inherit a real API address from .env.local.
  define:
    mode === 'demo'
      ? {
          'import.meta.env.VITE_ENABLE_MOCK': JSON.stringify('true'),
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'),
        }
      : {},
}));
