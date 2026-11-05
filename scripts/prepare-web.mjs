import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = process.cwd();
const out = resolve(root, 'www');
await mkdir(out, { recursive: true });
for (const file of ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) {
  await copyFile(resolve(root, file), resolve(out, file));
}
console.log('Web assets copied to www/');
