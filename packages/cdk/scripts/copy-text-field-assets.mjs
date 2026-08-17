import {copyFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = resolve(root, 'dist/text-field');
mkdirSync(targetDir, {recursive: true});

for (const [source, target] of [
  ['src/text-field/styles/text-field.css', 'style.css'],
  ['src/text-field/_index.scss', '_index.scss'],
  ['src/text-field/text-field-prebuilt.scss', 'text-field-prebuilt.scss'],
]) {
  copyFileSync(resolve(root, source), resolve(targetDir, target));
}

console.log('text-field CSS 与 Sass 资源已复制到 dist/text-field');
