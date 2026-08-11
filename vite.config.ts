import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

/**
 * 库构建配置：以 vite 库模式多入口产出 ESM/CJS 双格式、类型声明与样式文件。
 * 每个模块一个入口（根入口仅导出版本号），对外通过 package.json 的子路径 exports 消费；
 * 结构样式会在运行时自动注入，因此即便使用者不引入 css 也能正常工作。
 */
export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.spec.ts', 'tests/**/*.ts'],
      outDirs: ['dist'],
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        overlay: 'src/overlay/index.ts',
        coercion: 'src/coercion/index.ts',
        platform: 'src/platform/index.ts',
        scrolling: 'src/scrolling/index.ts',
        emitter: 'src/emitter/index.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        entryName === 'index'
          ? `index.${format === 'es' ? 'js' : 'cjs'}`
          : `${entryName}/index.${format === 'es' ? 'js' : 'cjs'}`,
      cssFileName: 'overlay/style',
    },
    sourcemap: true,
    rollupOptions: {
      external: ['vue'],
    },
  },
});
