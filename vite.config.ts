/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base + HashRouter => works on any GitHub Pages path (user/repo, custom domain, previews)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        id: './',
        name: 'LifeVerse',
        short_name: 'LifeVerse',
        description: 'Your Life. Your Decisions. Your Consequences. A life simulation game.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0a0f20',
        theme_color: '#0a0f20',
        categories: ['games', 'simulation'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // The whole game runs in the browser, so caching the app shell makes it start instantly and work offline.
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'], navigateFallback: 'index.html', cleanupOutdatedCaches: true },
    }),
  ],
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
