import {fileURLToPath, URL} from 'node:url';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Demo 应用配置：独立于库构建，通过别名直接引用模块源码，便于开发调试。
 */
export default defineConfig({
  root: 'demo',
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-cdk/overlay': fileURLToPath(new URL('./src/overlay/index.ts', import.meta.url)),
      'vue-cdk/a11y': fileURLToPath(new URL('./src/a11y/index.ts', import.meta.url)),
    },
  },
});
