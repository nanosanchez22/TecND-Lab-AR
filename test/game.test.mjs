import test from 'node:test';
import assert from 'node:assert/strict';
import { STATIONS, createState, discover, isComplete, nextStation, getClue, loadState, saveState } from '../public/js/game.js';

test('tres hallazgos únicos completan el juego en cualquiera de los seis órdenes', () => {
  for (const order of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
    let state = createState();
    for (let i = 0; i < order.length; i++) {
      assert.equal(isComplete(state), false);
      const previous = state;
      state = discover(state, order[i]);
      assert.equal(previous.found.length, i);
      assert.equal(state.found.length, i + 1);
      assert.strictEqual(discover(state, order[i]), state);
      const next = nextStation(state, order[i]);
      if (i < 2) {
        assert.ok(next);
        assert.equal(state.found.includes(next.id), false);
        assert.ok(getClue(state).title.includes(next.name));
      } else assert.equal(next, null);
    }
    assert.equal(isComplete(state), true);
    assert.equal(getClue(state).title, '¡Encontraste el tesoro!');
  }
});
test('el recorrido habitual ofrece las pistas Clase, Galería y Terraza', () => {
  let state = createState();
  assert.equal(getClue(state).title, 'Primera pista · Clase');
  state = discover(state, 0);
  assert.equal(getClue(state).title, 'Siguiente pista · Galería');
  state = discover(state, 1);
  assert.equal(getClue(state).title, 'Siguiente pista · Terraza');
  state = discover(state, 2);
  assert.equal(getClue(state).title, '¡Encontraste el tesoro!');
  assert.ok(getClue(state).text.includes('cofre'));
});
test('rechaza IDs desconocidos y limpia estados inválidos', () => {
  assert.deepEqual(createState([0,0,8,'1',null,2]).found, [0,2]);
  for (const input of [null,{},'texto',3]) assert.deepEqual(createState(input).found, []);
  const state = createState();
  for (const id of [-1,3,null,undefined,'0']) assert.strictEqual(discover(state,id),state);
});
test('restaura los hallazgos y reiniciar persiste una partida vacía', () => {
  const map = new Map();
  const storage = { getItem: key => map.get(key), setItem: (key,value) => map.set(key,value) };
  assert.equal(saveState(storage, createState([0,2])), true);
  assert.deepEqual(loadState(storage).found, [0,2]);
  assert.equal(getClue(loadState(storage)).title, 'Siguiente pista · Galería');
  saveState(storage, createState());
  assert.deepEqual(loadState(storage).found, []);
  assert.equal(isComplete(loadState(storage)), false);
  assert.equal(getClue(loadState(storage)).title, 'Primera pista · Clase');
});
test('sigue funcionando con almacenamiento denegado, lleno o corrupto', () => {
  const storage = { getItem() { throw Error('denegado'); }, setItem() { throw Error('lleno'); } };
  assert.deepEqual(loadState(storage), createState());
  assert.equal(saveState(storage, createState([1])), false);
  assert.deepEqual(loadState(null), createState());
  assert.equal(saveState(null, createState()), false);
  for (const json of ['{','null','[]','{"found":{}}']) assert.deepEqual(loadState({ getItem: () => json }), createState());
  assert.deepEqual(loadState({ getItem: () => '{"found":[2,2,8,0]}' }).found, [2,0]);
});
test('los tres símbolos tienen marcadores y ubicaciones diferentes', () => {
  assert.equal(new Set(STATIONS.map(s => s.marker)).size, 3);
  assert.equal(new Set(STATIONS.map(s => s.name)).size, 3);
  assert.equal(new Set(STATIONS.map(s => s.symbol)).size, 3);
});
