import {fileURLToPath, URL} from 'node:url';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * 文档应用配置：独立于库构建与 demo，通过别名直接引用模块源码，便于示例调试。
 *
 * base 使用相对路径并配合 hash 路由，构建产物可直接静态托管或从本地文件打开，
 * 无需服务端 SPA 回退配置。别名指向 packages/cdk 源码，改动库源码后无需构建即可生效。
 */
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      'vue-cdk/overlay': fileURLToPath(new URL('../../packages/cdk/src/overlay/index.ts', import.meta.url)),
      'vue-cdk/coercion': fileURLToPath(new URL('../../packages/cdk/src/coercion/index.ts', import.meta.url)),
      'vue-cdk/platform': fileURLToPath(new URL('../../packages/cdk/src/platform/index.ts', import.meta.url)),
      'vue-cdk/scrolling': fileURLToPath(new URL('../../packages/cdk/src/scrolling/index.ts', import.meta.url)),
      'vue-cdk/collections': fileURLToPath(new URL('../../packages/cdk/src/collections/index.ts', import.meta.url)),
      'vue-cdk/emitter': fileURLToPath(new URL('../../packages/cdk/src/emitter/index.ts', import.meta.url)),
      'vue-cdk/a11y': fileURLToPath(new URL('../../packages/cdk/src/a11y/index.ts', import.meta.url)),
      'vue-cdk/dialog': fileURLToPath(new URL('../../packages/cdk/src/dialog/index.ts', import.meta.url)),
    },
  },
});
