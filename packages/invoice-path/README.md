# Invoice Path

## Français

Alpha locale et **en lecture seule** pour rapprocher des événements de parcours de facture fournis par un EC et une ou plusieurs PA. L’exemple montre une facture complète et une autre sans acceptation, reçue sur une plateforme inattendue.

```sh
invoice-path demo --locale=fr
invoice-path analyze evenements.json rapport.json --locale=fr
```

Copiez [l’exemple synthétique](fixtures/sample.json). Chaque facture possède un ID explicite et une plateforme attendue ; chaque événement porte un ID, une source, un horodatage et un statut générique `sent`, `received`, `accepted` ou `rejected`. Convertissez les exports réels vers ces quatre états de façon documentée : ce prototype **ne prétend pas implémenter les normes AFNOR, Peppol ou les API PA**. Absence de statut signifie absence dans les données fournies, pas preuve qu’une facture a été perdue. L’outil ne consulte pas l’annuaire officiel, n’envoie aucune facture, n’effectue aucun e-reporting et n’est pas une plateforme agréée.

Pilote : un EC, deux PA consentantes et des exports non sensibles ; mesurer les divergences effectivement confirmées et le délai de résolution. Ne jamais publier des factures clients dans ce dépôt.

## English

Local **read-only** alpha for reconciling invoice journey events supplied by an accounting firm and one or more approved platforms. The sample contains one complete invoice and another with no acceptance, received at an unexpected platform.

```sh
invoice-path demo --locale=en
invoice-path analyze events.json report.json --locale=en
```

Copy the [synthetic sample](fixtures/sample.json). Each invoice has an explicit ID and expected platform; each event has an ID, source, timestamp and generic `sent`, `received`, `accepted` or `rejected` status. Map real exports to those four states with documented rules: this prototype **does not implement AFNOR or Peppol standards or platform APIs**. A missing status means absent from supplied data, not proof that an invoice was lost. It does not query the official directory, send invoices, perform e-reporting or act as an approved platform.

Pilot: one accounting firm, two consenting platforms and non-sensitive exports; measure confirmed discrepancies and time to resolution. Never commit client invoices to this repository.

## Español

Alfa local de **solo lectura** para conciliar eventos del recorrido de facturas facilitados por un despacho contable y una o varias plataformas autorizadas. El ejemplo incluye una factura completa y otra sin aceptación, recibida en una plataforma inesperada.

```sh
invoice-path demo --locale=es
invoice-path analyze eventos.json informe.json --locale=es
```

Copia el [ejemplo sintético](fixtures/sample.json). Cada factura tiene un ID explícito y una plataforma esperada; cada evento tiene ID, fuente, marca de tiempo y estado genérico `sent`, `received`, `accepted` o `rejected`. Convierte exportaciones reales a esos cuatro estados con reglas documentadas: este prototipo **no implementa las normas AFNOR o Peppol ni las API de plataformas**. La ausencia de un estado significa que no está en los datos aportados, no que se haya perdido la factura. No consulta el directorio oficial, no envía facturas, no realiza e-reporting y no es una plataforma autorizada.

Piloto: un despacho contable, dos plataformas que consientan y exportaciones no sensibles; medir divergencias confirmadas y tiempo de resolución. Nunca incluyas facturas de clientes en este repositorio.

MIT — [LICENSE](LICENSE).
