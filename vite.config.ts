import { defineConfig } from 'vite';
import react from '@vitejs.plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Set base to '/' for root domain deployment on Netlify
  base: '/',
  plugins: [react()],
});
