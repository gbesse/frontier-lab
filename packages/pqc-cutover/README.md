# PQC Cutover

## Français

Alpha hors ligne pour examiner une **répétition de bascule TLS hybride post-quantique**. Elle rapproche des observations de banc : négociation normale et essai où la branche post-quantique échoue. Elle signale un groupe classique négocié malgré l’offre hybride ou un repli observé pendant l’essai dégradé.

```sh
pqc-cutover demo --locale=fr
pqc-cutover analyze observations.json rapport.json --locale=fr
```

Copiez [l’exemple fictif](fixtures/sample.json). Les noms de groupe, résultats et références de preuve sont **déclarés par l’utilisateur** ; l’outil ne lance aucun trafic réseau, ne vérifie pas les captures et ne certifie ni la sûreté du protocole ni la conformité NIST. `hybridObserved` ne signifie que « groupe attendu indiqué dans l’observation ». Exécutez des tests actifs uniquement sur des systèmes et bancs expressément autorisés ; protégez les journaux de négociation s’ils contiennent des informations sensibles.

Pilote : comparer deux versions d’une même terminaison TLS dans un banc contrôlé, avec preuve de négociation et essai de panne, puis faire confirmer chaque anomalie par l’équipe sécurité.

## English

Offline alpha for reviewing a **hybrid post-quantum TLS cutover rehearsal**. It reconciles lab observations from a normal negotiation and an attempt where the post-quantum branch fails. It flags a classical group negotiated despite a hybrid offer or observed fallback during the degraded attempt.

```sh
pqc-cutover demo --locale=en
pqc-cutover analyze observations.json report.json --locale=en
```

Copy the [synthetic sample](fixtures/sample.json). Group names, outcomes and evidence references are **user-supplied**; this tool sends no network traffic, does not verify captures, and certifies neither protocol security nor NIST compliance. `hybridObserved` only means that the expected group was reported in an observation. Run active tests only against explicitly authorized systems and labs; protect negotiation logs if they contain sensitive data.

Pilot: compare two versions of one TLS endpoint in a controlled lab, with negotiation evidence and a failure attempt, then have security reviewers confirm each finding.

## Español

Alfa sin conexión para revisar un **ensayo de transición TLS híbrida poscuántica**. Concilia observaciones de laboratorio de una negociación normal y de un intento donde falla la rama poscuántica. Señala un grupo clásico negociado pese a la oferta híbrida o un repliegue observado durante el intento degradado.

```sh
pqc-cutover demo --locale=es
pqc-cutover analyze observaciones.json informe.json --locale=es
```

Copia el [ejemplo sintético](fixtures/sample.json). Los nombres de grupos, resultados y referencias de prueba son **aportados por el usuario**; la herramienta no genera tráfico de red, no verifica capturas y no certifica ni la seguridad del protocolo ni el cumplimiento NIST. `hybridObserved` solo significa que el grupo esperado se declaró en una observación. Ejecuta pruebas activas únicamente sobre sistemas y laboratorios expresamente autorizados; protege los registros de negociación si contienen datos sensibles.

Piloto: comparar dos versiones de un mismo extremo TLS en un laboratorio controlado, con prueba de negociación e intento de fallo, y pedir al equipo de seguridad que confirme cada hallazgo.

MIT — [LICENSE](LICENSE).
