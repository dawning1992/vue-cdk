import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

// 版本号的唯一事实来源是 package.json；构建时通过 define 注入根入口的
// __VUE_CDK_VERSION__，产物与类型声明中都不会残留对 package.json 的引用。
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/**
 * 库构建配置：以 vite 库模式多入口产出 ESM/CJS 双格式、类型声明与样式文件。
 * 每个模块一个入口（根入口仅导出版本号），对外通过 package.json 的子路径 exports 消费；
 * 结构样式会在运行时自动注入，因此即便使用者不引入 css 也能正常工作。
 */
export default defineConfig({
  define: {
    __VUE_CDK_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    vue(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.spec.ts', 'tests/**/*.ts'],
      outDirs: ['dist'],
      // tsconfig 启用了 composite（供根工程引用），插件默认会把 entryRoot
      // 推断为 tsconfig 所在目录，导致声明输出到 dist/src 下；显式指定 src，
      // 使声明按模块镜像到 dist/<module>/，与 package.json 的 exports 保持一致。
      entryRoot: 'src',
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
        clipboard: 'src/clipboard/index.ts',
        accordion: 'src/accordion/index.ts',
        platform: 'src/platform/index.ts',
        layout: 'src/layout/index.ts',
        scrolling: 'src/scrolling/index.ts',
        collections: 'src/collections/index.ts',
        emitter: 'src/emitter/index.ts',
        portal: 'src/portal/index.ts',
        a11y: 'src/a11y/index.ts',
        dialog: 'src/dialog/index.ts',
        'drag-drop': 'src/drag-drop/index.ts',
        tree: 'src/tree/index.ts',
        'virtual-tree': 'src/virtual-tree/index.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        entryName === 'index'
          ? `index.${format === 'es' ? 'js' : 'cjs'}`
          : `${entryName}/index.${format === 'es' ? 'js' : 'cjs'}`,
      // Vite 8 库模式仅支持字符串 cssFileName：所有入口的样式合并输出到
      // overlay/style.css。a11y 样式以自动注入为主，显式 css 引入复用该文件。
      cssFileName: 'overlay/style',
    },
    sourcemap: true,
    rollupOptions: {
      external: ['vue'],
    },
  },
});
