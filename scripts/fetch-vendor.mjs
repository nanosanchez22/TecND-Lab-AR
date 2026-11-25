import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = new URL('../public/', import.meta.url);
const raw = 'https://raw.githubusercontent.com';
const files = [
  ['vendor/aframe-1.8.0.min.js', 'https://aframe.io/releases/1.8.0/aframe.min.js'],
  ['vendor/aframe-ar-3.4.8.js', `${raw}/AR-js-org/AR.js/3.4.8/aframe/build/aframe-ar.js`],
  ['vendor/camera_para.dat', `${raw}/AR-js-org/AR.js/3.4.8/data/data/camera_para.dat`],
  ['vendor/AFRAME-LICENSE', `${raw}/aframevr/aframe/v1.8.0/LICENSE`],
  ['vendor/ARJS-LICENSE', `${raw}/AR-js-org/AR.js/3.4.8/LICENSE`],
  ...[0, 1, 2].map(id => [`markers/${id}.png`, `${raw}/nicolocarpignoli/artoolkit-barcode-markers-collection/master/3x3/${id}.png`]),
  ['vendor/MARKERS-README.md', `${raw}/nicolocarpignoli/artoolkit-barcode-markers-collection/master/Readme.md`],
];
const manifest = [];
for (const [path, source] of files) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${response.status}: ${source}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const destination = new URL(path, root);
  await mkdir(new URL('.', destination), { recursive: true });
  await writeFile(destination, buffer);
  manifest.push({ path, source, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') });
  console.log(`${path}: ${buffer.length} bytes`);
}
await writeFile(new URL('vendor/manifest.json', root), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Recursos guardados en ${fileURLToPath(root)}`);
