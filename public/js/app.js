import { STATIONS, createState, discover, isComplete, getClue, loadState, saveState } from './game.js';

const $ = id => document.getElementById(id);
let storage;
try { storage = localStorage; } catch { storage = null; }
let state = loadState(storage);
let frame = null;
let ready = false;
let lastFound = state.found.at(-1) ?? -1;
let activeMarker = null;
let bootTimer;

function send(type, data = {}) {
  frame?.contentWindow?.postMessage({ source: 'sacre-app', type, ...data }, location.origin);
}
function persist() { $('save-warning').hidden = saveState(storage, state); }
function render() {
  $('count').textContent = state.found.length + '/3';
  $('count').setAttribute('aria-label', state.found.length + ' de 3 símbolos encontrados');
  $('collection').replaceChildren(...STATIONS.map(station => {
    const found = state.found.includes(station.id);
    const item = document.createElement('div');
    item.className = 'symbol' + (found ? ' found' : '');
    item.textContent = (found ? '✓ ' : '◇ ') + station.symbol;
    item.setAttribute('aria-label', station.symbol + (found ? ' encontrada' : ' pendiente'));
    return item;
  }));
  const completed = isComplete(state);
  $('feedback').classList.toggle('won', completed);
  $('reset').textContent = completed ? 'Volver a jugar' : 'Reiniciar';
  $('reset').classList.toggle('primary', completed);
  $('reset').classList.toggle('secondary', !completed);
  const clue = getClue(state, lastFound);
  $('clue-title').textContent = clue.title;
  $('clue').textContent = clue.text;
}
function stopViewer() {
  clearTimeout(bootTimer);
  send('stop');
  // Stop acquired tracks synchronously; removing the frame also cancels a pending camera request.
  frame?.contentDocument?.querySelectorAll('video').forEach(video => video.srcObject?.getTracks().forEach(track => track.stop()));
  frame?.remove();
  frame = null;
  ready = false;
  activeMarker = null;
  $('stop').hidden = true;
  $('target').hidden = true;
}
function fail(message) {
  stopViewer();
  $('start-screen').hidden = true;
  $('camera-status').hidden = true;
  $('camera-error').hidden = false;
  $('error-message').textContent = message;
}
function start() {
  stopViewer();
  $('camera-error').hidden = true;
  $('start-screen').hidden = true;
  $('camera-status').hidden = false;
  $('camera-status').textContent = 'Preparando cámara… Permití su uso si el navegador lo pide.';
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    fail('Abrí el juego por HTTPS o desde localhost para habilitar la cámara.');
    return;
  }
  frame = document.createElement('iframe');
  frame.title = 'Cámara y objetos en realidad aumentada';
  frame.allow = 'camera';
  frame.src = './viewer.html';
  $('frame-mount').replaceChildren(frame);
  $('stop').hidden = false;
  bootTimer = setTimeout(() => fail('La cámara o el visor tardaron demasiado en responder. Revisá los permisos y volvé a intentar.'), 35000);
}
function onFound(id) {
  const station = STATIONS.find(item => item.id === id);
  if (!station) return;
  activeMarker = id;
  const next = discover(state, id);
  if (next !== state) {
    state = next;
    lastFound = id;
    persist();
    render();
  }
  $('camera-status').textContent = isComplete(state)
    ? '¡Tres símbolos reunidos! Este es tu tesoro.'
    : station.symbol + ' encontrada · ' + state.found.length + '/3. Leé la siguiente pista.';
  if (ready) send('show', { complete: isComplete(state) });
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.source !== 'sacre-viewer') return;
  const data = event.data;
  if (data.type === 'camera-ready') $('camera-status').textContent = 'Cámara lista. Preparando el reconocimiento…';
  if (data.type === 'ready') {
    clearTimeout(bootTimer);
    ready = true;
    $('target').hidden = false;
    $('camera-status').textContent = isComplete(state) ? 'Enfocá cualquier marcador para ver el cofre.' : 'Enfocá un marcador completo para descubrir su pista.';
    send('show', { complete: isComplete(state) });
  }
  if (data.type === 'found') onFound(data.id);
  if (data.type === 'lost' && activeMarker === data.id) {
    activeMarker = null;
    $('camera-status').textContent = isComplete(state)
      ? 'Enfocá cualquier marcador para volver a ver el cofre.'
      : 'Seguí la pista. Tu progreso se conserva: ' + state.found.length + '/3.';
  }
  if (data.type === 'error') fail(data.message);
});
$('start').addEventListener('click', start);
$('retry').addEventListener('click', start);
$('stop').addEventListener('click', () => {
  stopViewer();
  $('camera-error').hidden = true;
  $('camera-status').hidden = true;
  $('start-screen').hidden = false;
});
$('reset').addEventListener('click', () => {
  state = createState();
  lastFound = -1;
  persist();
  render();
  if (ready) {
    send('show', { complete: false });
    $('camera-status').textContent = 'Nueva partida. Retirá el marcador y volvé a enfocarlo para comenzar.';
  } else {
    stopViewer();
    $('camera-error').hidden = true;
    $('camera-status').hidden = true;
    $('start-screen').hidden = false;
  }
});
window.addEventListener('pagehide', stopViewer);
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    $('start-screen').hidden = false;
    $('camera-status').hidden = true;
  }
});
render();
if (!storage) $('save-warning').hidden = false;
