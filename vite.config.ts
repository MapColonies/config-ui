import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import replace from '@rollup/plugin-replace';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, '') },
    },
  },
  // hotfix based on https://github.com/JS-DevTools/ono/issues/19#issuecomment-1719659002 - not ideal but works
  build: {
    rollupOptions: {
      plugins: [
        replace({
          delimiters: ['', ''],
          preventAssignment: true,
          values: {
            'if (typeof module === "object" && typeof module.exports === "object") {':
              'if (typeof module === "object" && typeof module.exports === "object" && typeof module.exports.default === "object") {',
          },
        }),
      ],
    },
  },
});
