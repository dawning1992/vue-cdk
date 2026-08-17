import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import vue from '@vitejs/plugin-vue';

/** Chromium 真实布局测试：补足 jsdom 无法验证的 textarea 尺寸与 CSS animation 行为。 */
export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['src/**/*.browser.spec.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{browser: 'chromium'}],
    },
  },
});
