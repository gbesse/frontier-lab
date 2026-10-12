# cee-proof-graph

## Français

Évalue des règles datées et des pièces déclarées : version applicable, qualification RGE déclarée, présence, chronologie et réutilisation de certaines empreintes. La fiche de démo est explicitement synthétique. L’outil ne valide ni les fichiers, ni les travaux, ni l’éligibilité CEE. [Source officielle](https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie).

```sh
node packages/cee-proof-graph/bin/cli.js demo --locale=fr
node packages/cee-proof-graph/bin/cli.js analyze entree.json rapport.json --locale=fr
```

## English

Checks dated supplied rules and declared evidence: applicable version, declared RGE qualification, presence, chronology and reuse of selected digests. The demo rule is explicitly synthetic. The tool validates neither files, works nor CEE eligibility. [Official source](https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie).

```sh
node packages/cee-proof-graph/bin/cli.js demo --locale=en
node packages/cee-proof-graph/bin/cli.js analyze input.json report.json --locale=en
```

## Español

Comprueba reglas fechadas y pruebas declaradas: versión aplicable, cualificación RGE declarada, presencia, cronología y reutilización de ciertas huellas. La regla de demostración es explícitamente sintética. No valida archivos, obras ni elegibilidad CEE. [Fuente oficial](https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie).

```sh
node packages/cee-proof-graph/bin/cli.js demo --locale=es
node packages/cee-proof-graph/bin/cli.js analyze entrada.json informe.json --locale=es
```

MIT — [LICENSE](LICENSE).
