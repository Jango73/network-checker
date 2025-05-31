import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  root: 'src/renderer',
  publicDir: 'src/renderer/assets',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    assetsDir: 'assets',
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    electron({
      entry: 'src/main/index.ts',
      vite: {
        build: {
          outDir: '../../dist/main',
          rollupOptions: {
            output: {
              format: 'cjs',
            },
            external: [],
          },
        },
        resolve: {
          alias: {
            '@main': path.resolve(__dirname, 'src/main'),
            '@renderer': path.resolve(__dirname, 'src/renderer'),
            '@shared': path.resolve(__dirname, 'src/shared'),
            '@types': path.resolve(__dirname, 'src/types'),
            '@assets': path.resolve(__dirname, 'src/renderer/assets'),
          },
        },
      },
    }),
    electronRenderer(),
  ],
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/renderer/assets'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.mp3'],
});
