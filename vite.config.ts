import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_URL || '/',
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  publicDir: 'public',
});
