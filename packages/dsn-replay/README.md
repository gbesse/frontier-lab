# dsn-replay

## Français

Simule localement des corrections déclarées, les compare à la paie source et signale doubles corrections et réémission d’un montant substitué. Le rapport omet identifiants salariés et montants. Il accepte un format structuré de test, pas encore les fichiers DSN/CRM natifs ; aucun dépôt Urssaf n’est effectué. [Source officielle](https://www.urssaf.fr/accueil/employeur/gerer-entreprise/declaration-sociale-nominative.html).

```sh
node packages/dsn-replay/bin/cli.js demo --locale=fr
node packages/dsn-replay/bin/cli.js analyze entree.json rapport.json --locale=fr
```

## English

Locally simulates declared corrections against source payroll and flags duplicate corrections and re-emission of a substituted amount. The report omits employee identifiers and amounts. It accepts a structured test format, not native DSN/CRM files yet; it never submits to Urssaf. [Official source](https://www.urssaf.fr/accueil/employeur/gerer-entreprise/declaration-sociale-nominative.html).

```sh
node packages/dsn-replay/bin/cli.js demo --locale=en
node packages/dsn-replay/bin/cli.js analyze input.json report.json --locale=en
```

## Español

Simula localmente las correcciones declaradas, las compara con la nómina original y señala duplicados y reemisiones de importes sustituidos. El informe omite identificadores e importes de empleados. Acepta un formato de prueba estructurado, todavía no archivos DSN/CRM nativos; nunca presenta datos ante Urssaf. [Fuente oficial](https://www.urssaf.fr/accueil/employeur/gerer-entreprise/declaration-sociale-nominative.html).

```sh
node packages/dsn-replay/bin/cli.js demo --locale=es
node packages/dsn-replay/bin/cli.js analyze entrada.json informe.json --locale=es
```

MIT — [LICENSE](LICENSE).
