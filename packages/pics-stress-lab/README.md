# PICS Stress Lab

## Français

Exercice **hors ligne** pour les plans communaux et intercommunaux de sauvegarde (PCS/PICS). À partir de moyens, besoins, affectations et autorisations _déclarés_, le moteur rejoue une situation de référence et des pannes injectées. Il signale une capacité réclamée deux fois, un moyen indisponible, un besoin non couvert et une mise à disposition intercommunale sans référence d'accord. En cas de conflit, il ne choisit aucun bénéficiaire à la place des responsables.

La [DGSCGC recommande les exercices PCS/PICS](https://www.securite-civile.interieur.gouv.fr/documentation/planification-communale-et-intercommunale/planification-communale-et-intercommunale.html) et le [CNIG prépare un standard de données](https://cnig.gouv.fr/gt-plans-communaux-et-intercommunaux-de-sauvegarde-a30138.html). Cette alpha n'est ni ce standard, ni un outil de conduite de crise. Elle ne vérifie ni la disponibilité réelle, ni la validité juridique d'un accord, ni les contacts, itinéraires ou capacités des secours. Aucun message ou appel n'est émis. Utiliser uniquement des données fictives ou autorisées ; le rapport peut révéler des vulnérabilités opérationnelles.

```sh
node packages/pics-stress-lab/bin/cli.js demo --locale=fr
node packages/pics-stress-lab/bin/cli.js analyze entree.json rapport.json --locale=fr
```

Le fichier [sample.json](fixtures/sample.json) représente six communes fictives, deux réserves de moyens et deux exécutions. `unmetUnitMinutes` additionne, pour chaque minute, les unités de besoin non couvertes ; `conflictMinutes` additionne les minutes de conflit **par ressource**. Ce sont des indicateurs d'exercice, pas des scores de sécurité. Les périodes sont en UTC, avec borne de fin exclue. Une affectation contestée ou sans référence d'accord n'est pas comptée comme une couverture certaine. Le rapport écrit avec `analyze` n'écrase jamais un fichier existant et est créé avec les permissions `600`.

Contrat JSON : `communes` déclare des `id` ; `resources` précise `id`, `ownerCommuneId`, `kind`, `capacity`, `from`, `to` ; `demands` précise `id`, `communeId`, `kind`, `quantity`, `from`, `to`. Chaque élément de `runs` porte un `id`, des `assignments` reliant un `demandId` à un `resourceId` et des `failures` avec `lostCapacity`. `baselineRunId` désigne l'exécution de référence. Les affectations entre communes doivent déclarer `authorizedBy` et `authorizationRef` ; ces champs ne prouvent pas la validité de l'accord.

## English

**Offline** exercise for French municipal and intercommunal emergency plans (PCS/PICS). From _declared_ resources, demands, assignments and releases, the engine replays a baseline and injected failures. It flags double-claimed capacity, unavailable resources, uncovered demand and cross-commune releases without an approval reference. When capacity is contested, it does not select a beneficiary on behalf of officials.

The [DGSCGC recommends PCS/PICS exercises](https://www.securite-civile.interieur.gouv.fr/documentation/planification-communale-et-intercommunale/planification-communale-et-intercommunale.html) and [CNIG is preparing a data standard](https://cnig.gouv.fr/gt-plans-communaux-et-intercommunaux-de-sauvegarde-a30138.html). This alpha is neither that standard nor a crisis-command tool. It does not verify actual availability, legal validity of approvals, contacts, routes or emergency-service capabilities. It sends no messages or calls. Use only fictional or authorized data; the report may expose operational vulnerabilities.

```sh
node packages/pics-stress-lab/bin/cli.js demo --locale=en
node packages/pics-stress-lab/bin/cli.js analyze input.json report.json --locale=en
```

The [sample.json](fixtures/sample.json) file models six fictional communes, two resource pools and two runs. `unmetUnitMinutes` adds the uncovered units of demand for each minute; `conflictMinutes` adds conflict minutes **per resource**. These are exercise indicators, not safety scores. Intervals use UTC and exclude the end timestamp. A contested assignment or one without an approval reference is not counted as certain coverage. `analyze` never overwrites an existing report and creates it with `600` permissions.

JSON contract: `communes` declares `id` values; `resources` specifies `id`, `ownerCommuneId`, `kind`, `capacity`, `from`, `to`; `demands` specifies `id`, `communeId`, `kind`, `quantity`, `from`, `to`. Each `runs` entry has an `id`, `assignments` linking a `demandId` to a `resourceId`, and `failures` with `lostCapacity`. `baselineRunId` selects the reference run. Cross-commune assignments must declare `authorizedBy` and `authorizationRef`; these fields do not prove the approval is valid.

## Español

Ejercicio **sin conexión** para los planes municipales e intermunicipales de protección (PCS/PICS) franceses. A partir de recursos, necesidades, asignaciones y cesiones _declarados_, el motor reproduce una situación de referencia y fallos inyectados. Señala capacidad reclamada dos veces, recursos indisponibles, necesidades sin cubrir y cesiones entre municipios sin referencia de autorización. Si existe un conflicto, no elige beneficiarios en nombre de las autoridades.

La [DGSCGC recomienda ejercicios PCS/PICS](https://www.securite-civile.interieur.gouv.fr/documentation/planification-communale-et-intercommunale/planification-communale-et-intercommunale.html) y el [CNIG prepara un estándar de datos](https://cnig.gouv.fr/gt-plans-communaux-et-intercommunaux-de-sauvegarde-a30138.html). Esta alfa no es ese estándar ni una herramienta de dirección de crisis. No verifica disponibilidad real, validez jurídica de autorizaciones, contactos, rutas ni capacidades de los servicios de emergencia. No envía mensajes ni realiza llamadas. Usar solo datos ficticios o autorizados; el informe puede revelar vulnerabilidades operativas.

```sh
node packages/pics-stress-lab/bin/cli.js demo --locale=es
node packages/pics-stress-lab/bin/cli.js analyze entrada.json informe.json --locale=es
```

El archivo [sample.json](fixtures/sample.json) representa seis municipios ficticios, dos reservas de recursos y dos ejecuciones. `unmetUnitMinutes` suma las unidades de necesidad no cubiertas por minuto; `conflictMinutes` suma los minutos de conflicto **por recurso**. Son indicadores del ejercicio, no puntuaciones de seguridad. Los intervalos usan UTC y excluyen el instante final. Una asignación disputada o sin referencia de autorización no se cuenta como cobertura cierta. `analyze` nunca sobrescribe un informe existente y lo crea con permisos `600`.

Contrato JSON: `communes` declara valores `id`; `resources` indica `id`, `ownerCommuneId`, `kind`, `capacity`, `from`, `to`; `demands` indica `id`, `communeId`, `kind`, `quantity`, `from`, `to`. Cada entrada de `runs` tiene un `id`, `assignments` que vinculan `demandId` con `resourceId` y `failures` con `lostCapacity`. `baselineRunId` identifica la ejecución de referencia. Las asignaciones entre municipios deben declarar `authorizedBy` y `authorizationRef`; estos campos no prueban la validez de la autorización.

MIT — [LICENSE](LICENSE).
