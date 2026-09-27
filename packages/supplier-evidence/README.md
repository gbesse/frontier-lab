# Supplier Evidence

## Français

Alpha locale pour préparer **une même preuve fournisseur pour plusieurs demandes d’acheteurs**. L’inventaire associe une déclaration à un lot, une audience autorisée, une date de validité et un document. Le programme vérifie le SHA-256 du fichier local et ne divulgue que les déclarations autorisées pour l’acheteur demandé.

```sh
supplier-evidence demo --locale=fr
supplier-evidence prepare inventaire.json demande.json reponse.json --locale=fr
```

La démo synthétique répond à deux acheteurs avec le même document et retient un champ pour le second. Aucun document source n’est inclus dans la réponse, seulement son empreinte. Un hash ne prouve ni que la déclaration est vraie, ni qu’un passeport produit est conforme. Aucune connexion au registre européen ou à une plateforme DPP n’est fournie. Ne mettez pas de vraies preuves confidentielles dans un dépôt public.

Pour vos fichiers, partez de [l’inventaire](fixtures/inventory.json) et des [deux demandes](fixtures/requests.json) synthétiques. Les chemins des documents sont relatifs à l’inventaire ; chaque déclaration précise le lot, les acheteurs autorisés et sa validité. Une preuve absente, expirée ou modifiée empêche la divulgation de la déclaration associée.

Pilote à valider : trois fournisseurs répondant chacun à deux acheteurs. Mesurer les ressaisies évitées, les preuves acceptées et les demandes encore traitées à la main ; arrêter si les acheteurs ne réutilisent pas les réponses.

## English

Local alpha for preparing **the same supplier evidence for multiple buyer requests**. The inventory binds a claim to a lot, allowed audience, expiry date and document. The tool checks the local file’s SHA-256 and releases only claims permitted for the requested buyer.

```sh
supplier-evidence demo --locale=en
supplier-evidence prepare inventory.json request.json response.json --locale=en
```

The synthetic demo responds to two buyers using one document and withholds a field from the second. The response contains a hash, not the source document. A hash proves neither that a claim is true nor that a product passport complies with regulation. There is no EU Registry or DPP-platform connection. Do not commit real confidential evidence to a public repository.

For your own files, start from the synthetic [inventory](fixtures/inventory.json) and [two requests](fixtures/requests.json). Document paths are relative to the inventory; each claim names its lot, allowed buyers and expiry. Missing, expired or changed evidence prevents release of the associated claim.

Pilot to validate: three suppliers each answering two buyers. Measure avoided re-entry, accepted evidence and requests still handled manually; stop if buyers do not reuse the responses.

## Español

Alfa local para preparar **la misma prueba de un proveedor para solicitudes de varios compradores**. El inventario vincula una declaración con un lote, destinatarios autorizados, fecha de caducidad y documento. La herramienta comprueba el SHA-256 del archivo local y solo divulga declaraciones permitidas al comprador solicitado.

```sh
supplier-evidence demo --locale=es
supplier-evidence prepare inventario.json solicitud.json respuesta.json --locale=es
```

La demostración sintética responde a dos compradores con un único documento y retiene un campo para el segundo. La respuesta contiene un hash, no el documento fuente. Un hash no demuestra ni la veracidad de una declaración ni el cumplimiento normativo de un pasaporte de producto. No hay conexión con el registro europeo ni con plataformas DPP. No incluyas pruebas confidenciales reales en un repositorio público.

Para tus archivos, parte del [inventario](fixtures/inventory.json) y de las [dos solicitudes](fixtures/requests.json) sintéticos. Las rutas de documentos son relativas al inventario; cada declaración indica lote, compradores autorizados y caducidad. Una prueba ausente, caducada o modificada impide divulgar la declaración asociada.

Piloto por validar: tres proveedores que respondan cada uno a dos compradores. Medir las entradas repetidas evitadas, las pruebas aceptadas y las solicitudes aún tratadas manualmente; detenerlo si los compradores no reutilizan las respuestas.

MIT — [LICENSE](LICENSE).
