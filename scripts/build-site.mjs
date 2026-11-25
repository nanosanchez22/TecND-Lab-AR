import { mkdir, copyFile, lstat, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, basename } from 'node:path';
import { SITE_FILES } from './site-files.mjs';

const workspace = resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = resolve(workspace, 'dist');
// Only remove our known generated directory, never a caller-supplied or computed external path.
if (dirname(output) !== workspace || basename(output) !== 'dist') throw Error('Directorio de salida inválido.');
await rm(output, { recursive: true, force: true });
for (const path of SITE_FILES) {
  const source = new URL(`../public/${path}`, import.meta.url);
  const destination = new URL(`../dist/${path}`, import.meta.url);
  if (!(await lstat(source)).isFile()) throw Error(`No es un archivo regular: ${path}`);
  await mkdir(new URL('.', destination), { recursive: true });
  await copyFile(source, destination);
}
console.log(`Sitio preparado: ${SITE_FILES.length} archivos en dist/.`);
