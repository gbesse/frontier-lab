# Contributing

Node.js 22+, npm, Chromium for browser tests. `npm ci`, then `npx playwright install chromium`.

Before proposing a change:

```sh
npm run format
npm test
npm run demo
npm run test:browser
npm run pack:check
```

Add regression tests for business rules, ambiguous learning and migration loss. Keep all fixtures synthetic. Include a failing baseline and an independent business-state assertion for a claimed improvement. Do not label deterministic browser automation an LLM benchmark.

Keep package boundaries independently installable. Do not introduce external side effects into default examples. A new production adapter, hosted service, publishing workflow or migration domain needs an explicit design and authorization review. No user data, credentials, generated artifacts or local state in commits.

Language rule: ship every new user-facing change in French, English and Spanish together. This includes interface strings, errors, examples, generated defaults and the documentation passage being changed. Update `studio/i18n.js` and test the affected flow in all three languages. Preserve user-authored and captured text rather than translating it automatically.

Règle de langue : livrer chaque nouveauté destinée aux utilisateurs simultanément en français, anglais et espagnol. Cela comprend l’interface, les erreurs, les exemples, les textes générés par défaut et le passage de documentation modifié. Mettre à jour `studio/i18n.js` et tester le parcours concerné dans les trois langues. Conserver les textes rédigés par l’utilisateur ou capturés à l’écran sans traduction automatique.

Regla de idiomas: entregar cada cambio dirigido a usuarios al mismo tiempo en francés, inglés y español. Esto incluye la interfaz, los errores, los ejemplos, los textos predeterminados generados y el pasaje de documentación modificado. Actualizar `studio/i18n.js` y probar el flujo afectado en los tres idiomas. Conservar sin traducción automática el texto escrito por el usuario o capturado en pantalla.

Formatting uses Prettier. CI runs on Node 22 and 24. The current GitHub workflow becomes active only after repository publication; its presence is not evidence of a hosted CI run.
