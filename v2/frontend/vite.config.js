import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Runs alongside v1 (port 5173) without collision!
  },
});
