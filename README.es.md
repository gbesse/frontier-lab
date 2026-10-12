# Frontier Lab

[English](README.en.md) · Español · [Français](README.md)

Treinta y un proyectos de código abierto en **alfa local**: cuatro en el taller principal, dieciséis laboratorios de línea de comandos, Space Mission Lab y diez herramientas y laboratorios de fabricación en Matter Lab. Los nombres y el alcance son provisionales. Este repositorio no es un servicio alojado y sus paquetes no están publicados en npm.

Las extensiones para agentes tienen sus propios repositorios: [Agent Commerce Ledger para OpenClaw y Hermes](https://github.com/gbesse/agent-commerce-ledger) registra recibos de mensajes y aprobaciones de herramientas configuradas; [Caller Context para OpenClaw](https://github.com/gbesse/openclaw-caller-context) busca contexto local del llamante. No crean contactos CRM ni envían seguimientos.

| Proyecto               | Qué funciona                                                                                                                                                  | Límite explícito de esta alfa                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Teachpack**          | Sigue una ventana o pantalla compartida, lee texto localmente y crea una guía visual revisable; también compila demostraciones estructuradas en una habilidad | La guía reconoce estados de pantalla, pero no controla otras aplicaciones                                                                                     |
| **Branch**             | Simula pedidos, reservas de existencias, crédito de clientes y notificaciones, con bifurcaciones y fallos inyectados                                          | Un modelo de negocio explícito en memoria, no un clon automático de un ERP ni un entorno aislado para código arbitrario                                       |
| **Exit**               | Convierte una exportación de clientes, intervenciones y adjuntos en una aplicación independiente y editable                                                   | Correspondencias explícitas y aplicación local de un usuario; no recrea permisos ni automatizaciones del SaaS original                                        |
| **Agent Checkout Lab** | Prueba un recorrido de presupuesto en Chromium y comprueba los datos guardados                                                                                | Un contrato de prueba `/api/quote` y controladores deterministas, no una puntuación universal de compatibilidad con agentes ni prueba de conversión comercial |

Los dieciséis laboratorios son independientes del taller; sus demostraciones no se conectan a servicios externos:

| Proyecto                 | Primera prueba ejecutable                                                                                 | Límite explícito                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Machine Data Lab**     | Concilia dos exportaciones sintéticas de máquinas, normaliza unidades y señala intervalos con procedencia | El acceso se declara, no se verifica; no accede a fabricantes ni emite dictámenes sobre el Data Act |
| **Supplier Evidence**    | Reutiliza pruebas sintéticas para dos compradores con comprobación del hash y divulgación limitada        | No verifica la veracidad de las declaraciones ni el cumplimiento de un pasaporte de producto        |
| **Handover Drill**       | Copia una pequeña aplicación, restaura una instantánea y comprueba un resultado de negocio                | Solo código de confianza; no demuestra la recuperación en producción                                |
| **Payee Exceptions**     | Clasifica resultados VoP aportados y señala casos que requieren revisión                                  | No consulta bancos ni inicia pagos                                                                  |
| **Invoice Path**         | Concilia eventos contables y de plataformas y señala interrupciones del recorrido                         | No envía facturas ni implementa API de plataformas                                                  |
| **Provenance Last Mile** | Compara manifiestos C2PA de archivos locales antes y después de publicar                                  | Delega la validación a `c2patool`; la demostración es sintética                                     |
| **PQC Cutover**          | Revisa observaciones de negociación TLS híbrida y repliegue                                               | No captura conexiones ni certifica la seguridad                                                     |
| **Bill Replay**          | Recalcula un importe de energía con lecturas y tarifas fechadas usando decimales exactos                  | Depende de los datos aportados; no valida el contador ni el contrato                                |
| **GARAN Witness**        | Observa avisos de garantía visibles en un recorrido de compra con Chromium                                | No certifica la elegibilidad del producto ni el diseño oficial                                      |
| **Age Proof Lab**        | Prueba decisiones `mdoc`/ZKP con una matriz negativa y busca canarios en un HAR                           | No valida criptografía ni certifica conformidad                                                     |
| **Last Signal**          | Vincula equipos declarados con cierres de cobre/2G/3G y pruebas de reemplazo                              | No descubre equipos ni prueba redes reales                                                          |
| **Recall-to-Receipt**    | Concilia retiradas con ventas y existencias mediante GTIN, lote y período                                 | No bloquea ventas ni envía mensajes a clientes                                                      |
| **DSN Replay**           | Simula correcciones de nómina y señala correcciones duplicadas                                            | Acepta datos estructurados, no archivos DSN/CRM nativos                                             |
| **Water Witness**        | Distingue mediciones, límites de cuantificación y datos ausentes por unidad de agua                       | No emite dictámenes sobre potabilidad                                                               |
| **CEE Proof Graph**      | Comprueba la coherencia de reglas fechadas y pruebas declaradas                                           | Reglas sintéticas de demostración; no certifica elegibilidad CEE                                    |
| **PICS Stress Lab**      | Reproduce conflictos de recursos entre seis municipios con fallos inyectados                              | Ejercicio ficticio sin conexión; no verifica medios reales ni autoridad de decisión                 |

```sh
node packages/machine-data/bin/cli.js demo --locale=es
node packages/supplier-evidence/bin/cli.js demo --locale=es
node packages/handover-drill/bin/cli.js demo --locale=es
node packages/payee-exceptions/bin/cli.js demo --locale=es
node packages/invoice-path/bin/cli.js demo --locale=es
node packages/provenance-last-mile/bin/cli.js demo --locale=es
node packages/pqc-cutover/bin/cli.js demo --locale=es
node packages/bill-replay/bin/cli.js demo --locale=es
node packages/garan-witness/bin/cli.js demo --locale=es
node packages/age-proof-lab/bin/cli.js demo --locale=es
node packages/last-signal/bin/cli.js demo --locale=es
node packages/recall-to-receipt/bin/cli.js demo --locale=es
node packages/dsn-replay/bin/cli.js demo --locale=es
node packages/water-witness/bin/cli.js demo --locale=es
node packages/cee-proof-graph/bin/cli.js demo --locale=es
node packages/pics-stress-lab/bin/cli.js demo --locale=es
```

## Probar

Se necesitan Node.js 22+ y npm. Python 3 es necesario para la prueba de la extensión Hermes. En macOS, Teachpack usa Apple Vision para reconocer texto en pantalla localmente. Elige la ventana o pantalla en el diálogo del navegador; prueba Chrome si el navegador integrado no ofrece compartir pantalla. No se necesita cuenta ni clave API.

```sh
npm ci
npx playwright install chromium
npm start
```

Abre **http://127.0.0.1:4317**. El servidor solo escucha en localhost. Usa `PORT=4320 npm start` para elegir otro puerto. Los datos e informes del taller están en `.local/`, ignorado por Git. No se envían correos reales, no se hacen pedidos reales y no se conecta ningún servicio externo.

El taller está disponible en francés, inglés y español: elige **FR / EN / ES** arriba a la derecha. La elección se conserva en el navegador. Teachpack traduce la interfaz, los mensajes de seguimiento y los pasos predeterminados, y prioriza esos idiomas en el OCR local. El texto visible en pantalla y tus etiquetas se conservan tal como están; no se traducen automáticamente.

Teachpack también puede detectar clics en macOS si activas la opción antes de compartir toda la pantalla. El primer permiso de Supervisión de entrada puede requerir abrir Ajustes del Sistema. Esta alfa registra el momento y la posición del clic, no la identidad del control pulsado ni las teclas; admite una sola pantalla activa. La captura visual sigue disponible si se deniega el permiso.

Durante el seguimiento en directo, la guía muestra ahora una captura de referencia guardada localmente. Si se grabaron clics, los puntos indican sus posiciones aproximadas en la pantalla anterior; no identifican un botón concreto ni ejecutan ninguna acción.

Recorrido recomendado de cinco minutos:

1. **Teachpack:** abre «Mostrar la pantalla», elige una ventana, realiza dos pasos visibles, detén la captura, selecciona las imágenes útiles y crea una guía. Comparte de nuevo la ventana para ver el reconocimiento en directo. La demostración de llamadas estructuradas sigue disponible en la sección técnica inferior.
2. **Branch:** ejecuta los cinco escenarios y observa los errores esperados, los efectos ya realizados y la ausencia de duplicados.
3. **Exit:** inspecciona la exportación de ejemplo, genera y descarga la aplicación. Descomprímela, entra en el directorio generado y ejecuta `npm start`. Arranca en el puerto 4318 sin `npm install`.
4. **Checkout:** ejecuta el controlador semántico antes y después de la corrección de accesibilidad y luego el controlador estructurado. El resultado esperado es fallo/éxito/éxito. La ausencia de etiquetas bloquea deliberadamente este controlador semántico, no todos los agentes posibles.

Las capturas de Teachpack y las exportaciones de Exit permanecen en tu disco dentro de `.local/`; pueden contener información sensible visible. No publiques `.local/` ni `output/`. Los presupuestos del sitio de prueba están en memoria; los informes de prueba se conservan.

### Bases de datos sintéticas con Jev

`npm run synthetic:databases -- --locale=es --seed=20261001` crea tres bases SQLite locales en `output/synthetic-databases/20261001/`: mantenimiento, facturación y verificación simulada de beneficiarios. Las tablas están relacionadas, se comprueban los importes y las secuencias temporales, y la semilla permite repetir la generación. Los nombres, direcciones y cuentas son ficticios. Usa `--output=ruta` para otro directorio; no se sobrescribe un directorio existente.

Este comando necesita `TYPESAFE_API_KEY` en el entorno o en el archivo `.env` ignorado por Git. Hace una llamada de pago a Jev por base y guarda su opinión, las comprobaciones locales, muestras y huellas SHA-256 en `validation.json`. Un veredicto «creíble» evalúa solo las muestras y distribuciones proporcionadas; no demuestra que cada fila sea realista. `--offline` genera las mismas bases solo con comprobaciones locales y marca la opinión de Jev como no disponible. `--locale=fr` o `--locale=en` genera los textos y el informe en el idioma elegido.

## Verificar

```sh
npm test               # reglas de negocio, aprendizaje, migración, API y persistencia
npm run demo           # habilidad, ensayo y aplicación independiente en output/
npm run test:browser   # Chromium, taller, aplicación generada, presupuestos y pantalla simulada (Apple Vision en Mac)
npm run pack:check     # empaquetado, instalación y CLI fuera del monorepositorio
npm run format:check
npm audit --audit-level=moderate
```

En CI con Linux, instala las bibliotecas del sistema con `npx playwright install --with-deps chromium`. `pack:check` usa npm para instalar Playwright en un directorio temporal; los paquetes tar de este proyecto siguen siendo locales. El flujo de GitHub prueba Node 22 y 24 en Linux; la comprobación de los puentes Swift en macOS se puede ejecutar manualmente. Ninguna de estas pruebas concede el permiso del sistema para supervisar clics.

## Treinta y un paquetes, cuatro en el taller principal

```text
packages/teachpack/         → aprendizaje simbólico + CLI
packages/branch/            → simulador de negocio + CLI
packages/exit/              → migración + generador de aplicación independiente + CLI
packages/checkout/          → navegador + verificación del resultado de negocio + CLI
packages/machine-data/      → conciliación de exportaciones de máquinas + CLI
packages/supplier-evidence/ → divulgación limitada de pruebas de proveedores + CLI
packages/handover-drill/    → ejercicio de recuperación de aplicaciones + CLI
packages/payee-exceptions/  → clasificación de excepciones VoP + CLI
packages/invoice-path/      → conciliación de eventos de facturas + CLI
packages/provenance-last-mile/ → control C2PA posterior a la publicación + CLI
packages/pqc-cutover/       → revisión de ensayos de transición TLS híbrida + CLI
packages/bill-replay/       → conciliación de facturas de electricidad + CLI
packages/garan-witness/     → observación de avisos de garantía + CLI
packages/age-proof-lab/     → pruebas de verificadores de edad y canarios + CLI
packages/last-signal/       → auditoría de dependencias de cobre y 2G/3G + CLI
packages/recall-to-receipt/ → conciliación de retiradas, ventas y existencias + CLI
packages/dsn-replay/        → simulación de correcciones DSN + CLI
packages/water-witness/     → procedencia de mediciones de agua + CLI
packages/cee-proof-graph/   → coherencia de pruebas CEE + CLI
packages/pics-stress-lab/   → ejercicio de recursos intermunicipales PCS/PICS + CLI
studio/                     → taller local y sitio de prueba
test/                       → reglas, integración y pruebas de navegador
```

Cada paquete tiene su propio README, licencia MIT, exportaciones ESM y ejecutable; se puede empaquetar por separado. Teachpack usa Branch para sus ensayos. El monorepositorio facilita las pruebas cruzadas; no implica que ya existan veinte repositorios GitHub distintos.

Referencias detalladas: [Teachpack](packages/teachpack/README.md), [Branch](packages/branch/README.md), [Exit](packages/exit/README.md), [Agent Checkout](packages/checkout/README.md), [Machine Data Lab](packages/machine-data/README.md), [Supplier Evidence](packages/supplier-evidence/README.md), [Handover Drill](packages/handover-drill/README.md), [Payee Exceptions](packages/payee-exceptions/README.md), [Invoice Path](packages/invoice-path/README.md), [Provenance Last Mile](packages/provenance-last-mile/README.md) y [PQC Cutover](packages/pqc-cutover/README.md). Consulta [seguridad y límites](SECURITY.md) y [contribuciones](CONTRIBUTING.md). Las notas de estrategia y lanzamiento quedan en local y no forman parte del repositorio público.

Nuevos laboratorios: [Bill Replay](packages/bill-replay/README.md), [GARAN Witness](packages/garan-witness/README.md) y [Age Proof Lab](packages/age-proof-lab/README.md). Este último prueba observaciones sintéticas y no certifica sistemas de acreditación de edad.

Esta iteración añade [Last Signal](packages/last-signal/README.md), [Recall-to-Receipt](packages/recall-to-receipt/README.md), [DSN Replay](packages/dsn-replay/README.md), [Water Witness](packages/water-witness/README.md) y [CEE Proof Graph](packages/cee-proof-graph/README.md). Los datos externos y las reglas oficiales aún necesitan conectores validados antes de un uso operativo.

[PICS Stress Lab](packages/pics-stress-lab/README.md) añade un ejercicio sintético de uso compartido de recursos entre municipios. No moviliza ninguna respuesta real.

## Estado

Son implementaciones alfa, no productos validados comercialmente. La validación local no ha usado un proveedor LLM real. El controlador de modelo opcional exige configuración explícita y puede generar costes del proveedor. La detección de clics se ha probado con un evento simulado; todavía falta comprobar el permiso del sistema y un clic real en un Mac con consentimiento antes de afirmar que está validada de extremo a extremo.

MIT — consulta [LICENSE](LICENSE).

## Space Mission Lab

La expedición añade Light Cone, Relay Rescue, Space Credits y Signal Hunter: demoras luminosas hasta Proxima, mensajes reenviados, presupuestos ficticios y búsqueda de derivas sintéticas. Atlas SOTA con fuentes en `/space/explore?lang=es`, reto diario, enlaces reproducibles, tarjeta PNG y pasaporte JSON. Los enlaces comparten ajustes, nunca JSON de misión. `node packages/space-mission-lab/bin/cli.js frontier --locale=es --destination=proxima` ejecuta la ampliación. Integraciones físicas y datos SETI reales siguen siendo propuestas; sin tráfico público medido.

[Space Mission Lab](packages/space-mission-lab/README.md) reúne cuatro módulos: asignación de varios vehículos, simulación de recursos, asistente de reglas basado en trazas y pruebas de fallos de autonomía. Tras `npm start`, abre **http://127.0.0.1:4317/space**; interfaz e informes en FR / EN / ES. `node packages/space-mission-lab/bin/cli.js demo --locale=es` ejecuta los cuatro módulos. Modelo sintético local, sin dinámica orbital ni conexión con una nave real; las integraciones GMAT/Basilisk/cFS siguen pendientes.

### SOTA+++ — motores y desafíos espaciales

Las tres pistas son ejecutables: **Mission Benchmark Commons** (Basilisk/Orekit, ISS y JPL DE440s), **Contact Market** (SGP4, OR-Tools CP-SAT, manifiesto ION BPv7/UDP y recibo local Ed25519) y **Citizen Mission** (observación real Voyager 1/GBT, blimpy y turboSETI en CPU). Rutas `/space/commons/benchmark`, `/space/commons/market`, `/space/commons/citizen`, en FR/EN/ES con desafíos diarios, predicciones, enlaces compartibles, JSON y PNG. Se indican explícitamente créditos ficticios, antenas del escenario y portadora humana conocida.

`npm run space:setup` instala motores en `.local/space-runtime`. `npm run space:test:engines` verifica cálculos reales. `npm run space:fixtures` guarda pruebas; `npm run space:public` genera `output/space-public`, un sitio estático publicable que reproduce casos guardados sin exponer API locales. Instalación y límites: [documentación FR/EN/ES](packages/space-mission-lab/README.md). No se presupone despliegue público ni tráfico medido.

## Matter Lab — diez repositorios autónomos

Tras `npm start`, abrir **http://127.0.0.1:4317/matter?lang=es**. Las diez demos, interfaces, errores e informes admiten FR/EN/ES. Cada paquete funciona también de forma independiente con `npm start` en su directorio, en el puerto 4321.

| Proyecto                                           | Primera prueba ejecutable                                                          | Límite                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [FabReplay](packages/fabreplay/README.es.md)       | Comparación de rigidez, IC entre probetas, condiciones de ensayo e importación CSV | Mediciones de demo sintéticas; sensor no verificado                         |
| [SwitchBench](packages/switchbench/README.es.md)   | Fallo RL, extinción y energía de limitador; exportación y ejecución ngspice        | Interruptores genéricos, sin modelo validado de arco ni conmutación híbrida |
| [MicroFabGym](packages/microfabgym/README.es.md)   | Estrategias con episodios comunes, API reset/step y adaptador Gymnasium            | Película escalar simulada; sin entrenamiento RL ni fábrica conectada        |
| [CoolantForge](packages/coolantforge/README.es.md) | Búsqueda limitada, frente de Pareto y esquema SVG de microcanales                  | Modelo reducido; sin CFD 3D ni CAD fabricable                               |
| [QualifyDiff](packages/qualifydiff/README.es.md)   | Propagación de cambios, pruebas por alcance y plan de recualificación              | Cobertura declarada; sin certificación                                      |
| [FabPort](packages/fabport/README.es.md)           | Compatibilidad de capacidades, sustituciones y pruebas fechadas                    | Perfiles declarados; sin conector de máquina                                |
| [FabResume](packages/fabresume/README.es.md)       | Registro de intentos y reanudación condicionada al estado físico                   | Solo plan; contrato de idempotencia declarado                               |
| [MeasurePlan](packages/measureplan/README.es.md)   | Búsqueda exacta de controles con presupuesto y obligaciones                        | Sensibilidades declaradas e independencia supuesta                          |
| [MicroBlocks](packages/microblocks/README.es.md)   | Cinco bloques con contratos, geometría OpenSCAD ilustrativa y pruebas              | Mediciones sintéticas; funciones no validadas                               |
| [FabTrace](packages/fabtrace/README.es.md)         | Trazas por pieza, límites y asociaciones estadísticas                              | Asociaciones descriptivas; sin causalidad establecida                       |

`npm run matter:test:engines` verifica ngspice y Gymnasium. Instalar siguiendo los README; `SWITCHBENCH_NGSPICE` y `MICROFABGYM_PYTHON` pueden seleccionar ejecutables. Los diez proyectos son independientes de Atomic Machines y no tienen acceso al Matter Compiler.
