import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact(), pluginTailwindcss()],
  html: {
    title: 'Aktualności',
  },
  server: {
    // In dev the API runs separately (npm run server); forward /api calls to it.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
