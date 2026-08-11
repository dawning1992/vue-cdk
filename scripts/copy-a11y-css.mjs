import {copyFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'src/a11y/focus-trap/styles/focus-trap.css');
const target = resolve(root, 'dist/a11y/style.css');

// Vite 8 库模式把所有入口的样式合并为一个文件，无法按入口分别输出。
// 这里在构建后把 a11y 样式独立拷贝到 dist/a11y/style.css，
// 使 `vue-cdk/a11y/style.css` 指向真实的、只含 a11y 样式的产物。
mkdirSync(dirname(target), {recursive: true});
copyFileSync(source, target);

console.log(`a11y style copied to dist/a11y/style.css`);
