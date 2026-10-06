# last-signal

## Français

Inventorie les dépendances déclarées cuivre/2G/3G, rapproche le calendrier fourni et distingue un remplacement testé d’une simple installation. La démo est synthétique ; le moteur ne découvre pas les équipements et ne teste pas le réseau réel. Les calendriers d’opérateurs doivent être actualisés et revus. [Source officielle](https://www.arcep.fr/mes-demarches-et-services/entreprises/fiches-pratiques/extinction-reseaux-mobiles-2g-3g.html).

Chaque dépendance possède son propre essai de remplacement : réussir l’essai d’une SIM ne valide pas la liaison cuivre du même équipement.

```sh
node packages/last-signal/bin/cli.js demo --locale=fr
node packages/last-signal/bin/cli.js analyze entree.json rapport.json --locale=fr
```

## English

Audits declared copper/2G/3G dependencies, reconciles a supplied schedule and distinguishes a tested replacement from mere installation. The demo is synthetic; the engine does not discover devices or test the real network. Operator schedules must be kept current and reviewed. [Official source](https://www.arcep.fr/mes-demarches-et-services/entreprises/fiches-pratiques/extinction-reseaux-mobiles-2g-3g.html).

Each dependency has its own replacement test: passing a SIM test does not validate the same asset’s copper link.

```sh
node packages/last-signal/bin/cli.js demo --locale=en
node packages/last-signal/bin/cli.js analyze input.json report.json --locale=en
```

## Español

Audita dependencias declaradas de cobre/2G/3G, concilia un calendario aportado y distingue un reemplazo probado de una simple instalación. La demostración es sintética; el motor no descubre equipos ni prueba la red real. Hay que actualizar y revisar los calendarios de los operadores. [Fuente oficial](https://www.arcep.fr/mes-demarches-et-services/entreprises/fiches-pratiques/extinction-reseaux-mobiles-2g-3g.html).

Cada dependencia tiene su propia prueba de reemplazo: superar la prueba de una SIM no valida el enlace de cobre del mismo equipo.

```sh
node packages/last-signal/bin/cli.js demo --locale=es
node packages/last-signal/bin/cli.js analyze entrada.json informe.json --locale=es
```

MIT — [LICENSE](LICENSE).
