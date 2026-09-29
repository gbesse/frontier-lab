# Payee Exceptions

## Français

Alpha locale pour **trier les exceptions de vérification du bénéficiaire (VoP)**. Fournissez un référentiel de fournisseurs et des réponses bancaires déjà obtenues. Le rapport distingue les correspondances déclarées par la banque des cas à revoir, signale les références de compte discordantes et indique si le nom soumis figure déjà parmi les noms connus. La démo est entièrement fictive.

```sh
payee-exceptions demo --locale=fr
payee-exceptions analyze controles.json rapport.json --locale=fr
```

Copiez [l’exemple](fixtures/sample.json) pour le schéma. `accountRef` sert uniquement à comparer deux références ; il n’apparaît jamais dans le rapport. Ne publiez ni IBAN réels ni rapports sensibles. L’outil n’interroge pas les banques, ne vérifie pas leurs réponses, ne décide pas de l’identité du bénéficiaire, ne modifie aucun référentiel et n’initie aucun paiement. Même `bank_reported_match` reste un **résultat fourni**, pas une attestation indépendante. Un nom commercial connu n’annule jamais un « no match » bancaire.

Pilote : demander à deux équipes comptables des exports anonymisés de cas `close_match` et `no_match`; mesurer le temps de revue et les corrections validées indépendamment. Arrêter si l’outil n’économise pas de revue sans accroître les erreurs.

## English

Local alpha to **triage verification-of-payee (VoP) exceptions**. Supply a vendor master and bank results already received. The report separates bank-reported matches from cases requiring review, flags conflicting account references, and indicates whether the submitted name is among known names. The demo is entirely synthetic.

```sh
payee-exceptions demo --locale=en
payee-exceptions analyze checks.json report.json --locale=en
```

Copy the [sample](fixtures/sample.json) for the schema. `accountRef` only compares two references; it never appears in the report. Do not publish real IBANs or sensitive reports. The tool does not contact banks, verify their responses, determine payee identity, alter master data or initiate payments. Even `bank_reported_match` remains a **supplied result**, not independent attestation. A known trade name never overrides a bank “no match”.

Pilot: ask two accounting teams for anonymized `close_match` and `no_match` exports; measure review time and independently verified corrections. Stop if it does not save review effort without increasing mistakes.

## Español

Alfa local para **clasificar excepciones de verificación del beneficiario (VoP)**. Facilita datos maestros de proveedores y respuestas bancarias ya recibidas. El informe distingue coincidencias declaradas por el banco de casos que requieren revisión, señala referencias de cuenta discordantes e indica si el nombre presentado figura entre los conocidos. La demostración es totalmente sintética.

```sh
payee-exceptions demo --locale=es
payee-exceptions analyze controles.json informe.json --locale=es
```

Copia el [ejemplo](fixtures/sample.json) para ver el esquema. `accountRef` solo compara dos referencias; nunca aparece en el informe. No publiques IBAN reales ni informes sensibles. La herramienta no consulta bancos, no verifica sus respuestas, no determina la identidad del beneficiario, no modifica datos maestros ni inicia pagos. Incluso `bank_reported_match` sigue siendo un **resultado aportado**, no una certificación independiente. Un nombre comercial conocido nunca anula un «no match» bancario.

Piloto: pedir a dos equipos contables exportaciones anonimizadas de casos `close_match` y `no_match`; medir el tiempo de revisión y las correcciones verificadas por separado. Detener el piloto si no ahorra revisión sin aumentar errores.

MIT — [LICENSE](LICENSE).
