# El tesoro del Sacré Coeur

Búsqueda del tesoro en realidad aumentada con **AR.js 3.4.8** y **A-Frame 1.8.0**. Se juega desde el navegador del celular, sin instalar una aplicación.

- **Juego:** https://nanosanchez22.github.io/TecND-Lab-AR/
- **Marcadores para imprimir:** https://nanosanchez22.github.io/TecND-Lab-AR/markers.html

## Preparar el recorrido

1. Imprimir los tres marcadores en papel blanco, al 100 %, conservando el borde negro y el margen blanco.
2. Colocarlos en **Entrada → Galería → Patio**, con buena luz y sin reflejos.
3. Compartir la URL del juego. Cada jugador toca **Abrir cámara** y permite su uso.

Los lugares son ejemplos y deben adaptarse al edificio. Editar los nombres y pistas en `public/js/game.js` y ejecutar `npm run markers` para actualizar las hojas.

| Marcador | Objeto | Ubicación de ejemplo |
| --- | --- | --- |
| [entrada.svg](public/markers/entrada.svg) | Llave | Entrada |
| [galeria.svg](public/markers/galeria.svg) | Brújula | Galería |
| [patio.svg](public/markers/patio.svg) | Gema | Patio |

## Cómo funciona

Al enfocar un marcador aparece su objeto 3D y la pista del siguiente lugar. La pista permanece aunque el papel salga de cámara. Cada símbolo cuenta una sola vez; si se encuentran en otro orden, la pista apunta a uno pendiente.

Con los tres símbolos se revela el mensaje final y el cofre. **Volver a jugar** restaura la primera pista y vacía la colección. Para volver a detectar un papel que siga en cámara, retirarlo y enfocarlo otra vez.

El progreso se guarda en el navegador. Si el almacenamiento está bloqueado, se puede jugar en memoria. **Apagar cámara** libera el dispositivo.

El video se procesa en el navegador: el juego no graba ni envía imágenes a un servidor. No usa cuentas, claves API, analítica ni backend.

## Desarrollo local

Requiere Node.js 22 o superior. No hace falta instalar paquetes.

```sh
npm start
```

Abrir http://localhost:4173. La cámara funciona en HTTPS o localhost. La prueba con un celular y las hojas impresas permite comprobar el enfoque y la iluminación del lugar.

## Pruebas y publicación

```sh
npm test
npm run build
npm run check:release
```

Las pruebas comprueban los hallazgos, duplicados, pistas, final, reinicio, guardado y recursos de terceros. El build copia a `dist/` una lista explícita de archivos del juego, los marcadores y sus licencias. La verificación rechaza archivos adicionales y señales conocidas de credenciales o rutas locales.

GitHub Actions ejecuta estos controles y publica `dist/` en GitHub Pages al actualizar `main`. Los permisos de publicación se limitan al trabajo de despliegue; las acciones están fijadas por su commit.

Las bibliotecas ya están guardadas localmente, con licencias y un manifiesto SHA-256. `npm run vendor` permite volver a descargarlas desde sus fuentes oficiales; luego ejecutar `npm run markers`.

Fuentes: [AR.js](https://github.com/AR-js-org/AR.js/releases/tag/3.4.8), [A-Frame](https://github.com/aframevr/aframe/releases/tag/v1.8.0), [marcadores originales](https://github.com/nicolocarpignoli/artoolkit-barcode-markers-collection).
