import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config: the React plugin lets Vite understand JSX.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
