import {defineConfig} from 'vitest/config';
import vue from '@vitejs/plugin-vue';

/**
 * 单元测试配置：jsdom 环境，每个用例之间由 setup 清理 DOM 残留。
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['src/**/*.spec.ts'],
    css: true,
    restoreMocks: true,
    clearMocks: true,
  },
});
