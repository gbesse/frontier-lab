# Age Proof Lab

## Français

Alpha de **preuve de comportement du service vérificateur** d’âge : matrice négative `mdoc` + ZKP, contrôle des attributs divulgués, comparaison de deux présentations indépendantes et recherche de canaris synthétiques envoyés à des tiers dans une capture HAR. Les résultats ne contiennent ni preuve, ni valeur de canari, ni identifiant de présentation brut. Les rapports portent une empreinte de l’entrée ; conservez séparément les preuves sensibles dans un espace contrôlé.

```sh
age-proof-lab demo --locale=fr
age-proof-lab assess observations.json rapport.json --locale=fr
age-proof-lab scan-har capture.har.json politique.json rapport-fuite.json --locale=fr
```

La matrice exige `mdoc` et ZKP et teste par format : succès attendu, seconde session indépendante, présentation altérée, expirée, mauvais nonce, mauvaise audience, émetteur non fiable, attribut d’âge absent et **rejeu de la même présentation**. Une attestation ZKP peut être réutilisée selon la [spécification européenne](https://github.com/eu-digital-identity-wallet/av-doc-technical-specification/blob/main/docs/architecture-and-technical-specifications.md) ; ce n’est pas le même cas qu’un rejeu de présentation. `runAgeProofContract` permet à un adaptateur de banc **de confiance** d’exécuter les cas contre un vérificateur de préproduction. `scan-har` recherche uniquement les canaris fournis dans l’URL, les en-têtes et le corps des requêtes sortantes vers d’autres origines. Si un canari n’apparaît dans aucune requête capturée, le résultat reste non concluant ; l’empreinte SHA-256 du HAR aide à rattacher le rapport à la capture.

L’API `captureAgeProofEgress({ url, canaries, run })` ouvre Chromium sur l’origine autorisée, laisse `run(page)` exécuter un parcours synthétique et capture les requêtes. Elle supprime le HAR temporaire après analyse et ne renvoie que le rapport expurgé. Le callback doit attendre la fin du parcours ; aucune authentification ou interaction de wallet n’est devinée par le labo.

Limites essentielles : le cœur ne fabrique ni ne valide cryptographiquement des attestations ISO mDoc/ZKP, ne récupère pas et ne valide pas la liste de confiance européenne, ne lit pas les journaux serveur et ne prouve pas l’absence de fuite. Les contrôles déclarés par l’adaptateur doivent être vérifiés séparément avec les suites officielles. `review_ready` signifie seulement « matrice observée sans anomalie détectée », **jamais conformité ou sécurité certifiée**. N’utiliser que des attestations et canaris synthétiques sur un système explicitement autorisé ; un HAR réel peut contenir cookies et données personnelles, ne le publiez pas.

## English

An alpha for **relying-party behavior evidence**: `mdoc` + ZKP negative matrix, disclosed-attribute checks, comparison of two independent presentations, and detection of synthetic canaries sent to third parties in a HAR capture. Reports contain no proof, canary value or raw presentation identifier. They include an input digest; keep sensitive evidence separately in controlled storage.

```sh
age-proof-lab demo --locale=en
age-proof-lab assess observations.json report.json --locale=en
age-proof-lab scan-har capture.har.json policy.json leak-report.json --locale=en
```

The matrix requires both `mdoc` and ZKP and tests, for each format, expected success, a second independent session, tampering, expiry, wrong nonce, wrong audience, untrusted issuer, missing age claim and **replay of the same presentation**. A ZKP attestation may be reused under the [European specification](https://github.com/eu-digital-identity-wallet/av-doc-technical-specification/blob/main/docs/architecture-and-technical-specifications.md); that is different from replaying one transaction presentation. `runAgeProofContract` lets a **trusted** staging adapter execute cases against a verifier. `scan-har` only searches supplied canaries in URLs, headers and request bodies sent to other origins. A canary absent from all captured requests makes the no-leak result inconclusive; the HAR SHA-256 digest ties the report to its capture.

The `captureAgeProofEgress({ url, canaries, run })` API opens Chromium on the authorized origin, lets `run(page)` execute a synthetic journey and captures requests. It deletes the temporary HAR after analysis and returns only the redacted report. The callback must await journey completion; the lab does not guess wallet authentication or interactions.

Critical limits: the core neither creates nor cryptographically validates ISO mDoc/ZKP attestations, fetches or validates the EU trust list, reads server logs, nor proves the absence of leakage. Adapter-reported checks must be separately validated with official conformance suites. `review_ready` only means “observed matrix with no detected finding,” **never certified compliance or security**. Use synthetic attestations and canaries only on an explicitly authorized system; a real HAR may contain cookies and personal data, so do not publish it.

## Español

Alfa de **evidencia del comportamiento del servicio verificador**: matriz negativa `mdoc` + ZKP, control de atributos revelados, comparación de dos presentaciones independientes y detección de canarios sintéticos enviados a terceros en una captura HAR. Los informes no contienen pruebas, valores de canarios ni identificadores de presentación en bruto. Incluyen una huella de la entrada; conserva las evidencias sensibles aparte, en almacenamiento controlado.

```sh
age-proof-lab demo --locale=es
age-proof-lab assess observaciones.json informe.json --locale=es
age-proof-lab scan-har captura.har.json politica.json informe-fuga.json --locale=es
```

La matriz exige `mdoc` y ZKP y prueba, por formato, el éxito esperado, una segunda sesión independiente, alteración, caducidad, nonce incorrecto, audiencia incorrecta, emisor no confiable, falta del atributo de edad y **repetición de la misma presentación**. Una acreditación ZKP puede reutilizarse según la [especificación europea](https://github.com/eu-digital-identity-wallet/av-doc-technical-specification/blob/main/docs/architecture-and-technical-specifications.md); eso es distinto de repetir la presentación de una transacción. `runAgeProofContract` permite a un adaptador de preproducción **de confianza** ejecutar los casos contra un verificador. `scan-har` solo busca los canarios aportados en URL, cabeceras y cuerpos de solicitudes enviadas a otros orígenes. Si un canario no aparece en ninguna solicitud capturada, la ausencia de fuga no es concluyente; la huella SHA-256 del HAR vincula el informe a la captura.

La API `captureAgeProofEgress({ url, canaries, run })` abre Chromium en el origen autorizado, deja que `run(page)` ejecute un recorrido sintético y captura las solicitudes. Elimina el HAR temporal tras el análisis y solo devuelve el informe depurado. El callback debe esperar a que termine el recorrido; el laboratorio no presupone la autenticación ni las interacciones con el wallet.

Límites esenciales: el núcleo no crea ni valida criptográficamente acreditaciones ISO mDoc/ZKP, no obtiene ni valida la lista europea de confianza, no lee registros del servidor ni demuestra ausencia de fugas. Los controles declarados por el adaptador deben validarse aparte con las suites oficiales. `review_ready` solo significa «matriz observada sin hallazgos detectados», **nunca cumplimiento ni seguridad certificados**. Usa acreditaciones y canarios sintéticos únicamente en sistemas expresamente autorizados; un HAR real puede contener cookies y datos personales, así que no lo publiques.

MIT — [LICENSE](LICENSE).
