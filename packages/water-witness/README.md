# water-witness

## Français

Relie commune, unité de distribution et dernières mesures représentatives ; sépare « quantifié », « sous limite », « non mesuré » et « ancien ». Aucun verdict de potabilité ou de santé. L’API Hub’Eau n’est pas appelée par cette alpha : injecter uniquement des extractions documentées et revues. [Source officielle](https://www.data.gouv.fr/dataservices/hubeau-qualite-de-leau-potable).

Deux résultats représentatifs contradictoires à la date la plus récente donnent « contradictoire » sans valeur arbitrairement retenue.

```sh
node packages/water-witness/bin/cli.js demo --locale=fr
node packages/water-witness/bin/cli.js analyze entree.json rapport.json --locale=fr
```

## English

Links commune, distribution unit and latest representative measurements; keeps “quantified,” “below limit,” “not measured” and “stale” distinct. No potability or health verdict. This alpha does not call Hub’Eau: use documented, reviewed extracts only. [Official source](https://www.data.gouv.fr/dataservices/hubeau-qualite-de-leau-potable).

Conflicting representative results on the most recent date yield “conflicting,” with no arbitrarily selected value.

```sh
node packages/water-witness/bin/cli.js demo --locale=en
node packages/water-witness/bin/cli.js analyze input.json report.json --locale=en
```

## Español

Vincula municipio, unidad de distribución y las últimas mediciones representativas; distingue « cuantificado », « bajo el límite », « no medido » y « antiguo ». No emite un veredicto sanitario ni de potabilidad. Esta alfa no consulta Hub’Eau: usa solo extractos documentados y revisados. [Fuente oficial](https://www.data.gouv.fr/dataservices/hubeau-qualite-de-leau-potable).

Dos resultados representativos contradictorios en la fecha más reciente producen « contradictorio », sin elegir arbitrariamente un valor.

```sh
node packages/water-witness/bin/cli.js demo --locale=es
node packages/water-witness/bin/cli.js analyze entrada.json informe.json --locale=es
```

MIT — [LICENSE](LICENSE).
