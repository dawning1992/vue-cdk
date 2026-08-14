import {readFileSync} from 'node:fs';
import {defineConfig} from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// 与 vite.config.ts 保持一致：测试环境同样注入版本号，保证 version 导出有值。
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * 单元测试配置：jsdom 环境，每个用例之间由 setup 清理 DOM 残留。
 */
export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_CDK_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['src/**/*.spec.ts'],
    css: true,
    restoreMocks: true,
    clearMocks: true,
  },
});
