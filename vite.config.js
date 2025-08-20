import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  minify: false,
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'assets',
          dest: '.'
        },
        {
          src: 'mocks',
          dest: '.'
        },
      ]
    }),
    webExtension
    ({
      manifest: 'manifest.json',
    }),
  ],
});
