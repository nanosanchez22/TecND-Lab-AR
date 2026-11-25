export const STATIONS = Object.freeze([
  Object.freeze({ id: 0, name: 'Entrada', symbol: 'Llave', marker: 'entrada.svg', hint: 'Buscá el marcador de Entrada, donde comienza el recorrido por el Sacré Coeur.' }),
  Object.freeze({ id: 1, name: 'Galería', symbol: 'Brújula', marker: 'galeria.svg', hint: 'La llave abrió el camino. Caminá hasta la Galería y buscá allí el próximo marcador.' }),
  Object.freeze({ id: 2, name: 'Patio', symbol: 'Gema', marker: 'patio.svg', hint: 'La brújula te guía al aire libre. Andá al Patio y buscá el último marcador.' }),
]);
const validIds = new Set(STATIONS.map(station => station.id));
const STORAGE_KEY = 'sacre-coeur:hunt:v1';

export function createState(found = []) {
  return { found: [...new Set((Array.isArray(found) ? found : []).filter(id => validIds.has(id)))] };
}
export function discover(state, id) {
  if (!validIds.has(id) || state.found.includes(id)) return state;
  return createState([...state.found, id]);
}
export function isComplete(state) { return STATIONS.every(station => state.found.includes(station.id)); }
export function nextStation(state, afterId = -1) {
  for (let offset = 1; offset <= STATIONS.length; offset++) {
    const station = STATIONS[(afterId + offset + STATIONS.length) % STATIONS.length];
    if (!state.found.includes(station.id)) return station;
  }
  return null;
}
export function loadState(storage) {
  try { return createState(JSON.parse(storage.getItem(STORAGE_KEY))?.found); }
  catch { return createState(); }
}
export function getClue(state, afterId = state.found.at(-1) ?? -1) {
  const next = nextStation(state, afterId);
  if (!next) return {
    title: '¡Encontraste el tesoro!',
    text: 'Reuniste la llave, la brújula y la gema. El verdadero tesoro es el conocimiento que te llevás. Enfocá cualquier marcador para ver el cofre.',
  };
  const text = next.id === 1 && !state.found.includes(0)
    ? 'Caminá hasta la Galería y buscá allí el marcador de la brújula.'
    : next.id === 2 && !state.found.includes(1)
      ? 'Andá al Patio y buscá allí el marcador de la gema.'
      : next.hint;
  return { title: (state.found.length ? 'Siguiente pista · ' : 'Primera pista · ') + next.name, text };
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(createState(state.found))); return true; }
  catch { return false; }
}
