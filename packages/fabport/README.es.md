# FabPort

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

Contrasta cada paso con perfiles de capacidad, sustituciones declaradas y pruebas de calibración fechadas.

![FabPort](docs/fabport-es.png)

## Probar en un minuto

Node.js 22+ basta: sin dependencias de ejecución, cuenta ni clave API. La demo permanece en loopback. Abrir http://127.0.0.1:4321/?lang=es.

```sh
git clone https://github.com/gbesse/fabport.git
cd fabport
node bin/cli.js demo --locale=es
npm start
```

`PORT=4322 npm start` cambia el puerto.

## Usar tus datos

Importa JSON en la demo, o parte de `fixtures/demo.json`. Los atajos de ajustes solo afectan la demo sintética; expedientes importados se editan en JSON. Cambiar idioma traduce etiquetas e informes, nunca datos ni identificadores. Exportaciones JSON y SVG disponibles. Sin transmisión de datos por red.

```sh
node bin/cli.js run fixtures/demo.json --locale=es --output=report.json
node bin/cli.js check fixtures/demo.json --locale=es
```

`--output` crea exclusivamente un archivo nuevo con modo 600 y rechaza sobrescrituras. Informes CLI incluyen SHA-256 de bytes de entrada: integridad de reproducción, no autenticidad. Límite CLI/importación: 5 MB. `run` genera informe incluso con decisión negativa; `check` devuelve 0 (`pass`), 1 (`fail`), 3 (`inconclusive`) o 2 para errores de formato/orden.

## Formato JSON v1

Envoltura obligatoria: `schemaVersion: 1`, `origin: synthetic | user`. Origen declarativo; el campo no autentica mediciones. Campos adicionales aceptados como metadatos pero ignorados en decisiones. Parámetros físicos y protocolos deben permanecer en campos documentados.

`asOf`, `requirements`, `fabs` y `substitutions` son obligatorios. Un requisito contiene `id`, `operation`, `material`, `maxErrorUm` y `range: {min, max, unit}`. Una fábrica contiene `id`, `complete` y `capabilities`. Cada capacidad contiene las mismas restricciones y `evidence: {id, calibrationId, qualified, validFrom, validUntil}`; precisión, rango y prueba pueden ser `null` para indicar información ausente. Una sustitución contiene `id`, `fromOperation`, `toOperation`, `fromMaterial`, `toMaterial`. Límites: 100 requisitos, 50 fábricas, 500 capacidades por fábrica, 100 sustituciones.

## Comportamiento y límites

Cada paso requiere una sola capacidad que cumpla todas sus restricciones. Unidades idénticas requeridas. Una sustitución aún necesita cualificación; un perfil incompleto o prueba caducada no establece compatibilidad.

La demo distingue cuatro fábricas: compatible, adaptación de resina por cualificar, calibración caducada y capacidad insuficiente. Rango y precisión de capacidades diferentes no se pueden combinar. Una alternativa no válida no se propone como adaptación. `pass` significa que alguna fábrica cubre todos los pasos según sus declaraciones; `fail` que todos los perfiles son incompatibles; en otro caso requiere revisión. Este formato JSON interno no implementa OPC UA ni es un SDK de Atomic Machines.

## API JavaScript

```js
import { readFile } from 'node:fs/promises';
import { analyze } from './src/index.js';
const input = JSON.parse(await readFile('fixtures/demo.json', 'utf8'));
const report = analyze(input, { locale: 'es' });
console.log(report.status, report.rows);
```

`analyze` es síncrono, determinista y no modifica entrada. Resultados son copias independientes. Mensajes localizados; estados y nombres de campos son identificadores estables.

## Verificar y contribuir

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
npm run format:check
```

Pruebas de decisiones y contraejemplos, validación de entrada, códigos de salida, hashes y exportaciones sin sobrescritura. Flujos FR/EN/ES: cambios, errores, importación, idioma, exportaciones y móvil. CI en Node 22 y 24. Contribuye casos reproducibles con unidades, hipótesis, procedencia y resultados esperados; todo cambio público debe incluir FR/EN/ES.

## Estado y herramientas relacionadas

Alfa independiente bajo MIT, sin afiliación a Atomic Machines. Ejemplos y pruebas de demo sintéticos, sin equipos ni API industrial conectados. Repositorio autónomo; no publicado en npm.

[Matter Compiler](https://www.atomicmachines.com/matter-compiler) · [PartCAD](https://github.com/partcad/partcad) · [Bluesky](https://blueskyproject.io/) · [OPC UA Job Management](https://reference.opcfoundation.org/specs/OPC-40001-3/full) · [QIF](https://www.nist.gov/publications/end-end-quality-information-framework-qif-technology-survey)
