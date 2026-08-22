/* Downloads the ffmpeg binaries the app ships with.
 *
 * Not left to ffmpeg-static's own postinstall, for two reasons: it only
 * fetches the binary for the machine doing the install, which makes a
 * Windows build from Linux quietly bundle a Linux executable; and the
 * binaries are ~80 MB each, far too heavy for git. They are fetched into
 * resources/ffmpeg, which is ignored by git and packaged by the build. */
import { createWriteStream, existsSync, mkdirSync, chmodSync, statSync } from 'fs';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const RELEASE = 'b6.1.1';
const BASE = `https://github.com/eugeneware/ffmpeg-static/releases/download/${RELEASE}`;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'resources', 'ffmpeg');

/* Both platforms every time: whoever builds the Windows installer needs
   the Windows binary regardless of what they are running. */
const TARGETS = [
  { asset: 'ffmpeg-win32-x64.gz', file: 'ffmpeg-win32-x64.exe' },
  { asset: 'ffmpeg-linux-x64.gz', file: 'ffmpeg-linux-x64' },
];

mkdirSync(outDir, { recursive: true });

for (const { asset, file } of TARGETS) {
  const target = join(outDir, file);

  if (existsSync(target) && statSync(target).size > 1_000_000) {
    console.log(`ya está  ${file}`);
    continue;
  }

  process.stdout.write(`bajando ${file} … `);
  const response = await fetch(`${BASE}/${asset}`, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${asset}: HTTP ${response.status}`);

  await pipeline(Readable.fromWeb(response.body), createGunzip(), createWriteStream(target));
  chmodSync(target, 0o755);
  console.log(`${(statSync(target).size / 1048576).toFixed(1)} MB`);
}

console.log('ffmpeg listo en resources/ffmpeg');
