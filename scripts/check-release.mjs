import { readdir, readFile, lstat } from 'node:fs/promises';
import { SITE_FILES } from './site-files.mjs';

const root = new URL('../dist/', import.meta.url);
async function list(directory, prefix = '') {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isSymbolicLink()) throw Error(`Enlace simbólico no permitido: ${path}`);
    if (entry.isDirectory()) paths.push(...await list(new URL(entry.name + '/', directory), path + '/'));
    else paths.push(path);
  }
  return paths.sort();
}
const actual = await list(root);
if (JSON.stringify(actual) !== JSON.stringify([...SITE_FILES].sort())) throw Error('La publicación contiene archivos inesperados o faltantes.');
const privatePatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,})/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /C:[\\/]+Users[\\/]/i,
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][A-Za-z0-9_+/=-]{20,}["']/i,
];
for (const path of actual) {
  if (!(await lstat(new URL(path, root))).isFile()) throw Error(`Archivo inválido: ${path}`);
  if (path.startsWith('vendor/')) continue; // Vendored bytes are checked against their SHA-256 manifest by npm test.
  const content = await readFile(new URL(path, root), 'utf8');
  for (const pattern of privatePatterns) if (pattern.test(content)) throw Error(`Posible credencial o ruta local en ${path}; publicación cancelada.`);
}
console.log(`Publicación revisada: ${actual.length} archivos permitidos; sin credenciales ni rutas locales detectadas.`);
