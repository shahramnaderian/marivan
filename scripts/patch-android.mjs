import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const manifest = resolve(process.cwd(), 'android/app/src/main/AndroidManifest.xml');
try {
  let xml = await readFile(manifest, 'utf8');
  const permission = '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />';
  if (!xml.includes('android.permission.SCHEDULE_EXACT_ALARM')) {
    xml = xml.replace('<application', permission + '\n    <application');
    await writeFile(manifest, xml, 'utf8');
    console.log('Added exact-alarm permission to AndroidManifest.xml');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.log('Android project not found yet; run npx cap add android first.');
}
