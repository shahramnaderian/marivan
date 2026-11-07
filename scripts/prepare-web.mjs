import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const out = resolve(root, 'www');

await mkdir(out, { recursive: true });

const files = ['index.html', 'manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png', 'native-alarms.js'];

for (const file of files) {
  await copyFile(resolve(root, file), resolve(out, file));
}

const indexPath = resolve(out, 'index.html');
let html = await readFile(indexPath, 'utf8');
if (!html.includes('native-alarms.js')) {
  html = html.replace('</body>', '<script src="./native-alarms.js"></script></body>');
}
await writeFile(indexPath, html, 'utf8');

console.log('Web assets copied to www/ and native alarm bridge injected.');
