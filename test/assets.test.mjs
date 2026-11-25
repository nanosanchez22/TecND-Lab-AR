import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { STATIONS } from '../public/js/game.js';

const root = new URL('../public/', import.meta.url);
test('los recursos de terceros están completos y coinciden con el manifiesto SHA-256', async () => {
  const manifest = JSON.parse(await readFile(new URL('vendor/manifest.json', root), 'utf8'));
  assert.ok(manifest.length >= 8);
  for (const asset of manifest) {
    const bytes = await readFile(new URL(asset.path, root));
    assert.equal(bytes.length, asset.bytes, asset.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path);
  }
});
test('los marcadores son PNG válidos, distintos y coinciden con los tres IDs', async () => {
  const markers = await Promise.all([0,1,2].map(id => readFile(new URL(`markers/${id}.png`, root))));
  for (const png of markers) assert.equal(png.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(new Set(markers.map(png => createHash('sha256').update(png).digest('hex'))).size, 3);
});
test('los marcadores listos para imprimir conservan el código original y agregan margen blanco', async () => {
  const html = await readFile(new URL('markers.html', root), 'utf8');
  for (const station of STATIONS) {
    const png = await readFile(new URL(`markers/${station.id}.png`, root));
    const svg = await readFile(new URL(`markers/${station.marker}`, root), 'utf8');
    assert.ok(svg.includes(`data:image/png;base64,${png.toString('base64')}`));
    assert.ok(svg.includes('fill="white"'));
    assert.ok(svg.includes('x="48" y="48"'));
    assert.ok(html.includes(`Estación ${station.name}`));
    assert.ok(html.includes(`./markers/${station.marker}`));
  }
  assert.equal((html.match(/class="sheet"/g) || []).length, 3);
});
test('los HTML enlazan recursos locales existentes con rutas relativas', async () => {
  for (const file of (await readdir(root)).filter(name => name.endsWith('.html'))) {
    const html = await readFile(new URL(file, root), 'utf8');
    const references = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]);
    for (const reference of references) {
      assert.ok(reference.startsWith('./'), `${file}: ${reference}`);
      if (reference === './') continue;
      await readFile(new URL(reference, root));
    }
  }
});
