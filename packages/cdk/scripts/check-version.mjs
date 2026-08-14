import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const expected = pkg.version;

// 直接加载构建产物并读取运行时导出的 version，与消费者从 `vue-cdk`
// 根入口拿到的一致，不依赖产物内部格式，产物格式变化也不会导致误判。
const esm = await import(resolve(root, 'dist/index.js'));
const require = createRequire(import.meta.url);
const cjs = require(resolve(root, 'dist/index.cjs'));

for (const [label, actual] of [
  ['dist/index.js', esm.version],
  ['dist/index.cjs', cjs.version],
]) {
  if (actual !== expected) {
    console.error(`版本号校验失败：package.json 为 ${expected}，${label} 导出为 ${actual}`);
    process.exit(1);
  }
}

console.log(`版本号校验通过：package.json 与构建产物均为 ${expected}`);
