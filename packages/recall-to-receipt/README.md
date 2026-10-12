# recall-to-receipt

## Français

Rapproche les rappels fournis avec ventes et stocks par GTIN validé, lot et période. Une donnée manquante mène à « possible », pas à « sûr ». Aucun arrêt de vente ni message client automatique. Les données officielles RappelConso ne sont pas téléchargées par cette alpha. [Source officielle](https://www.data.gouv.fr/datasets/rappelconso-v2-rappels-de-produits).

```sh
node packages/recall-to-receipt/bin/cli.js demo --locale=fr
node packages/recall-to-receipt/bin/cli.js analyze entree.json rapport.json --locale=fr
```

## English

Reconciles supplied recalls with sales and stock using validated GTIN, lot and period. Missing data yields “possible,” never “safe.” No automatic sale stop or customer message. This alpha does not download official RappelConso data. [Official source](https://www.data.gouv.fr/datasets/rappelconso-v2-rappels-de-produits).

```sh
node packages/recall-to-receipt/bin/cli.js demo --locale=en
node packages/recall-to-receipt/bin/cli.js analyze input.json report.json --locale=en
```

## Español

Concilia retiradas aportadas con ventas y existencias mediante GTIN validado, lote y período. Un dato ausente produce « posible », nunca « seguro ». No bloquea ventas ni envía mensajes automáticamente. Esta alfa no descarga datos oficiales de RappelConso. [Fuente oficial](https://www.data.gouv.fr/datasets/rappelconso-v2-rappels-de-produits).

```sh
node packages/recall-to-receipt/bin/cli.js demo --locale=es
node packages/recall-to-receipt/bin/cli.js analyze entrada.json informe.json --locale=es
```

MIT — [LICENSE](LICENSE).
