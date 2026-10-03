# Frontier Lab

[English](README.en.md) · Español · [Français](README.md)

Catorce proyectos de código abierto en **alfa local**: cuatro en el taller interactivo y diez laboratorios de línea de comandos. Los nombres y el alcance son provisionales. Este repositorio no es un servicio alojado y sus paquetes no están publicados en npm.

Las extensiones para agentes tienen sus propios repositorios: [Agent Commerce Ledger para OpenClaw y Hermes](https://github.com/gbesse/agent-commerce-ledger) registra recibos de mensajes y aprobaciones de herramientas configuradas; [Caller Context para OpenClaw](https://github.com/gbesse/openclaw-caller-context) busca contexto local del llamante. No crean contactos CRM ni envían seguimientos.

| Proyecto               | Qué funciona                                                                                                                                                  | Límite explícito de esta alfa                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Teachpack**          | Sigue una ventana o pantalla compartida, lee texto localmente y crea una guía visual revisable; también compila demostraciones estructuradas en una habilidad | La guía reconoce estados de pantalla, pero no controla otras aplicaciones                                                                                     |
| **Branch**             | Simula pedidos, reservas de existencias, crédito de clientes y notificaciones, con bifurcaciones y fallos inyectados                                          | Un modelo de negocio explícito en memoria, no un clon automático de un ERP ni un entorno aislado para código arbitrario                                       |
| **Exit**               | Convierte una exportación de clientes, intervenciones y adjuntos en una aplicación independiente y editable                                                   | Correspondencias explícitas y aplicación local de un usuario; no recrea permisos ni automatizaciones del SaaS original                                        |
| **Agent Checkout Lab** | Prueba un recorrido de presupuesto en Chromium y comprueba los datos guardados                                                                                | Un contrato de prueba `/api/quote` y controladores deterministas, no una puntuación universal de compatibilidad con agentes ni prueba de conversión comercial |

Los diez laboratorios son independientes del taller; sus demostraciones no se conectan a servicios externos:

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
```

## Probar

Se necesitan Node.js 22+ y npm. En macOS, Teachpack usa Apple Vision para reconocer texto en pantalla localmente. Elige la ventana o pantalla en el diálogo del navegador; prueba Chrome si el navegador integrado no ofrece compartir pantalla. No se necesita cuenta ni clave API.

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

## Catorce paquetes, cuatro en el taller compartido

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
studio/                     → taller local y sitio de prueba
test/                       → reglas, integración y pruebas de navegador
```

Cada paquete tiene su propio README, licencia MIT, exportaciones ESM y ejecutable; se puede empaquetar por separado. Teachpack usa Branch para sus ensayos. El monorepositorio facilita las pruebas cruzadas; no implica que ya existan catorce repositorios GitHub distintos.

Referencias detalladas: [Teachpack](packages/teachpack/README.md), [Branch](packages/branch/README.md), [Exit](packages/exit/README.md), [Agent Checkout](packages/checkout/README.md), [Machine Data Lab](packages/machine-data/README.md), [Supplier Evidence](packages/supplier-evidence/README.md), [Handover Drill](packages/handover-drill/README.md), [Payee Exceptions](packages/payee-exceptions/README.md), [Invoice Path](packages/invoice-path/README.md), [Provenance Last Mile](packages/provenance-last-mile/README.md) y [PQC Cutover](packages/pqc-cutover/README.md). Consulta [seguridad y límites](SECURITY.md) y [contribuciones](CONTRIBUTING.md). Las notas de estrategia y lanzamiento quedan en local y no forman parte del repositorio público.

Nuevos laboratorios: [Bill Replay](packages/bill-replay/README.md), [GARAN Witness](packages/garan-witness/README.md) y [Age Proof Lab](packages/age-proof-lab/README.md). Este último prueba observaciones sintéticas y no certifica sistemas de acreditación de edad.

## Estado

Son implementaciones alfa, no productos validados comercialmente. La validación local no ha usado un proveedor LLM real. El controlador de modelo opcional exige configuración explícita y puede generar costes del proveedor. La detección de clics se ha probado con un evento simulado; todavía falta comprobar el permiso del sistema y un clic real en un Mac con consentimiento antes de afirmar que está validada de extremo a extremo.

MIT — consulta [LICENSE](LICENSE).
