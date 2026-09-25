# Frontier Lab

[English](README.en.md) · Español · [Français](README.md)

Cuatro proyectos de código abierto en **alfa local**, con un taller interactivo para probarlos. Los nombres y el alcance son provisionales. Este repositorio no es un servicio alojado y sus paquetes no están publicados en npm.

| Proyecto               | Qué funciona                                                                                                                                                  | Límite explícito de esta alfa                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Teachpack**          | Sigue una ventana o pantalla compartida, lee texto localmente y crea una guía visual revisable; también compila demostraciones estructuradas en una habilidad | La guía reconoce estados de pantalla, pero no controla otras aplicaciones                                                                                     |
| **Branch**             | Simula pedidos, reservas de existencias, crédito de clientes y notificaciones, con bifurcaciones y fallos inyectados                                          | Un modelo de negocio explícito en memoria, no un clon automático de un ERP ni un entorno aislado para código arbitrario                                       |
| **Exit**               | Convierte una exportación de clientes, intervenciones y adjuntos en una aplicación independiente y editable                                                   | Correspondencias explícitas y aplicación local de un usuario; no recrea permisos ni automatizaciones del SaaS original                                        |
| **Agent Checkout Lab** | Prueba un recorrido de presupuesto en Chromium y comprueba los datos guardados                                                                                | Un contrato de prueba `/api/quote` y controladores deterministas, no una puntuación universal de compatibilidad con agentes ni prueba de conversión comercial |

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

## Cuatro paquetes, un taller compartido

```text
packages/teachpack/  → aprendizaje simbólico + CLI
packages/branch/     → simulador de negocio + CLI
packages/exit/       → migración + generador de aplicación independiente + CLI
packages/checkout/   → navegador + verificación del resultado de negocio + CLI
studio/              → taller local y sitio de prueba
test/                → reglas, integración y pruebas de navegador
```

Cada paquete tiene su propio README, licencia MIT, exportaciones ESM y ejecutable; se puede empaquetar por separado. Teachpack usa Branch para sus ensayos. El monorepositorio facilita las pruebas cruzadas; no implica que ya existan cuatro repositorios GitHub distintos.

Referencias detalladas: [Teachpack](packages/teachpack/README.md), [Branch](packages/branch/README.md), [Exit](packages/exit/README.md), [Agent Checkout](packages/checkout/README.md). Consulta [seguridad y límites](SECURITY.md) y [contribuciones](CONTRIBUTING.md). Las notas de estrategia y lanzamiento quedan en local y no forman parte del repositorio público.

## Estado

Son implementaciones alfa, no productos validados comercialmente. La validación local no ha usado un proveedor LLM real. El controlador de modelo opcional exige configuración explícita y puede generar costes del proveedor. La detección de clics se ha probado con un evento simulado; todavía falta comprobar el permiso del sistema y un clic real en un Mac con consentimiento antes de afirmar que está validada de extremo a extremo.

MIT — consulta [LICENSE](LICENSE).
