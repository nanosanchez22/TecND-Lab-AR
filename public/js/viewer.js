import { objectMarkup } from './models.js';
const send = (type, data = {}) => parent.postMessage({ source: 'sacre-viewer', type, ...data }, location.origin);
let alive = true;
let complete = false;
let scene;
let sourceElement;
let readyTimer;
const markers = [];
const watchdog = setTimeout(() => fail('El visor tardó demasiado en cargar. Revisá los permisos de cámara y volvé a intentar.'), 30000);

function stopCamera() {
  for (const element of [sourceElement, ...document.querySelectorAll('video')]) {
    element?.srcObject?.getTracks().forEach(track => track.stop());
    if (element?.tagName === 'VIDEO') { element.pause(); element.srcObject = null; }
  }
}
function stop() {
  alive = false;
  clearTimeout(watchdog);
  clearInterval(readyTimer);
  stopCamera();
  scene?.pause();
}
function fail(message) {
  if (!alive) return;
  send('error', { message });
  stop();
}
window.addEventListener('error', event => fail('No se pudo cargar el visor 3D. ' + (event.message || '')));
window.addEventListener('unhandledrejection', () => fail('No se pudo preparar el reconocimiento AR. Volvé a intentar.'));
window.addEventListener('camera-error', () => fail('No se pudo acceder a la cámara. Revisá los permisos del sitio y que otra app no esté usando la cámara.'));
window.addEventListener('arjs-video-loaded', event => {
  sourceElement = event.detail?.component;
  if (!alive) { stopCamera(); return; }
  sourceElement?.srcObject?.getVideoTracks().forEach(track => track.addEventListener('ended', () => {
    if (alive) fail('La cámara se desconectó. Conectala y volvé a intentar.');
  }, { once: true }));
  send('camera-ready');
});
window.addEventListener('pagehide', stop);
function setCompletion(value) {
  const next = Boolean(value);
  if (complete === next) return;
  complete = next;
  markers.forEach(marker => {
    marker.querySelector('.marker-model').innerHTML = objectMarkup(complete ? 'treasure' : Number(marker.getAttribute('value')), complete);
  });
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== parent || event.data?.source !== 'sacre-app') return;
  if (event.data.type === 'stop') stop();
  if (!alive) return;
  if (event.data.type === 'show') setCompletion(event.data.complete);
});

async function initialize() {
  if (!window.AFRAME) throw Error('No se pudo cargar A-Frame.');
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './vendor/aframe-ar-3.4.8.js';
    script.onload = resolve;
    script.onerror = () => reject(Error('No se pudo cargar AR.js.'));
    document.head.append(script);
  });
  if (!alive) return;
  scene = document.createElement('a-scene');
  scene.setAttribute('embedded', '');
  scene.setAttribute('xr-mode-ui', 'enabled: false');
  scene.setAttribute('vr-mode-ui', 'enabled: false');
  scene.setAttribute('device-orientation-permission-ui', 'enabled: false');
  scene.setAttribute('loading-screen', 'enabled: false');
  scene.setAttribute('background', 'transparent: true');
  scene.setAttribute('renderer', 'alpha: true; antialias: true; colorManagement: true');
  const source = 'sourceType: webcam; sourceWidth: 640; sourceHeight: 480;';
  scene.setAttribute('arjs', source + ' debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; cameraParametersUrl: ./vendor/camera_para.dat; maxDetectionRate: 30;');
  for (const id of [0, 1, 2]) {
    const marker = document.createElement('a-marker');
    marker.setAttribute('type', 'barcode');
    marker.setAttribute('value', String(id));
    marker.setAttribute('emitevents', 'true');
    marker.innerHTML = '<a-entity class="marker-model">' + objectMarkup(id) + '</a-entity>';
    marker.addEventListener('markerFound', () => { if (alive) send('found', { id }); });
    marker.addEventListener('markerLost', () => { if (alive) send('lost', { id }); });
    markers.push(marker);
    scene.append(marker);
  }
  const camera = document.createElement('a-entity');
  camera.setAttribute('camera', '');
  camera.setAttribute('look-controls', 'enabled: false');
  const ambient = document.createElement('a-entity');
  ambient.setAttribute('light', 'type: ambient; color: #d4e9e3; intensity: 1.7');
  const directional = document.createElement('a-entity');
  directional.setAttribute('light', 'type: directional; color: #ffedcc; intensity: 3.5');
  directional.setAttribute('position', '2 4 3');
  scene.append(camera, ambient, directional);
  readyTimer = setInterval(() => {
    if (!alive) { clearInterval(readyTimer); return; }
    const session = scene.systems.arjs?._arSession;
    if (session?.arContext?.initialized && session.arSource.ready) {
      clearInterval(readyTimer);
      clearTimeout(watchdog);
      send('ready', { aframe: AFRAME.version, arjs: '3.4.8' });
    }
  }, 100);
  document.body.append(scene);
}
initialize().catch(error => fail(error.message || 'No se pudo iniciar el visor AR.'));
