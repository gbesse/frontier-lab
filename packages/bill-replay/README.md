# Bill Replay

## Français

Alpha locale pour rapprocher une facture d’électricité des relevés horodatés et des tarifs déclarés. Les kWh et prix sont calculés en décimaux exacts, puis arrondis au centime après agrégation. Chaque relevé doit correspondre à **un seul** tarif ; un trou, un chevauchement ou un doublon bloque le total énergie au lieu d’inventer un prix. Les autres charges sont comparées uniquement aux montants explicitement fournis.

```sh
bill-replay demo --locale=fr
bill-replay analyze donnees.json rapport.json --locale=fr
```

Copier [l’exemple synthétique](fixtures/sample.json) et remplacer ses références par des identifiants locaux de relevés et de versions contractuelles. Ne pas mettre d’adresse, de numéro de compteur ou de facture réelle dans un rapport destiné à être partagé. L’outil n’extrait pas encore les données Linky ou les PDF, ne calcule pas les taxes légales, ne vérifie pas les tarifs du fournisseur et ne tranche pas un litige. Le rapport est une aide à la revue, pas un montant exigible.

Pilote : dix factures anonymisées de deux fournisseurs, avec relevés et tarifs historiquement applicables ; mesurer les écarts expliqués et les lignes impossibles à reconstituer.

## English

Local alpha for reconciling an electricity bill with timestamped readings and supplied rates. kWh and prices use exact decimal arithmetic, with cent rounding after aggregation. Every reading must match **exactly one** rate; a gap, overlap or duplicate blocks the energy total instead of inventing a price. Other charges are compared only with explicitly supplied amounts.

```sh
bill-replay demo --locale=en
bill-replay analyze input.json report.json --locale=en
```

Copy the [synthetic sample](fixtures/sample.json) and replace its references with local reading and contract-version identifiers. Do not place an address, meter number or real invoice in a report intended for sharing. This tool does not yet extract Linky exports or PDFs, compute statutory taxes, verify supplier rates or settle a dispute. The report supports review; it is not an amount due.

Pilot: ten anonymized bills from two suppliers, with readings and historically applicable rates; measure explained discrepancies and lines that cannot be reconstructed.

## Español

Alfa local para conciliar una factura eléctrica con lecturas fechadas y tarifas aportadas. Los kWh y precios usan aritmética decimal exacta; el redondeo al céntimo se hace tras la agregación. Cada lectura debe corresponder a **una sola** tarifa; una laguna, un solapamiento o un duplicado bloquea el total de energía en vez de inventar un precio. Los demás cargos se comparan únicamente con importes proporcionados explícitamente.

```sh
bill-replay demo --locale=es
bill-replay analyze entrada.json informe.json --locale=es
```

Copia el [ejemplo sintético](fixtures/sample.json) y sustituye las referencias por identificadores locales de lecturas y versiones del contrato. No incluyas dirección, número de contador ni factura real en un informe que vayas a compartir. La herramienta todavía no extrae datos de Linky ni PDF, no calcula impuestos legales, no verifica las tarifas del proveedor ni resuelve una disputa. El informe ayuda a revisar; no indica un importe exigible.

Piloto: diez facturas anonimizadas de dos proveedores, con lecturas y tarifas históricamente aplicables; medir las diferencias explicadas y las líneas que no se puedan reconstruir.

MIT — [LICENSE](LICENSE).
