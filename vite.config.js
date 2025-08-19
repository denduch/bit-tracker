import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'assets',
          dest: '.'
        },
        {
          src: 'mocks',
          dest: '.'
        },
        {
          src: 'popup/popup.html',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    minify: false,
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'background/service-worker.ts'),
        popup: resolve(__dirname, 'popup/popup.ts'),
        popup_css: resolve(__dirname, 'popup/popup.css'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
