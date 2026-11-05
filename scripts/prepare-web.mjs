import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const out = resolve(root, 'www');

await mkdir(out, { recursive: true });

const files = ['index.html', 'manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png'];

for (const file of files) {
  await copyFile(resolve(root, file), resolve(out, file));
}

console.log('Web assets copied to www/');
