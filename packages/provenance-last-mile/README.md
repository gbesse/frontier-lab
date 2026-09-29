# Provenance Last Mile

## Français

Alpha locale pour comparer les **Content Credentials C2PA avant et après une chaîne de publication**. `probe` lit des fichiers déjà téléchargés et appelle `c2patool` installé séparément pour chaque étape ; `compare` rapproche des résultats de validation enregistrés. La démo JSON est fictive et **ne constitue pas une validation cryptographique**.

```sh
provenance-last-mile demo --locale=fr
provenance-last-mile probe source.jpg publie.jpg --locale=fr
provenance-last-mile compare sorties-c2patool.json rapport.json --locale=fr
```

Installez d’abord [c2patool](https://github.com/contentauth/c2patool) pour `probe`. Le programme n’exécute ni navigateur ni téléchargement : fournissez des copies locales obtenues avec autorisation. Le rapport compare le manifeste actif et l’état de validation, signale son absence, un échec ou un changement à examiner. Un changement peut être une transformation légitime ; une même étiquette de manifeste ne prouve pas l’identité du signataire. Configurez et vérifiez séparément la liste de confiance de `c2patool` si nécessaire. Ne traitez jamais un fichier non signé comme « faux » ; ce banc ne juge pas la véracité du contenu.

Pilote : faire suivre dix médias signés à travers un CMS et un CDN consentants, puis télécharger le rendu public et localiser les étapes qui retirent les Credentials.

## English

Local alpha comparing **C2PA Content Credentials before and after a publishing pipeline**. `probe` reads already-downloaded files and invokes separately installed `c2patool` for each stage; `compare` reconciles saved validator outputs. The JSON demo is synthetic and **is not cryptographic validation**.

```sh
provenance-last-mile demo --locale=en
provenance-last-mile probe source.jpg published.jpg --locale=en
provenance-last-mile compare c2patool-outputs.json report.json --locale=en
```

Install [c2patool](https://github.com/contentauth/c2patool) first for `probe`. This tool neither browses nor downloads: provide authorized local copies. The report compares active manifest and validation state, flagging absence, failure or a change to review. A changed manifest may be a legitimate edit; the same manifest label does not prove signer identity. Configure and verify `c2patool` trust lists separately when needed. Never treat an unsigned file as “fake”; this lab does not judge content truth.

Pilot: move ten signed assets through a consenting CMS and CDN, download the public rendition and locate stages that remove Credentials.

## Español

Alfa local que compara **Content Credentials C2PA antes y después de una cadena de publicación**. `probe` lee archivos ya descargados e invoca `c2patool`, instalado por separado, para cada etapa; `compare` concilia resultados guardados del validador. La demostración JSON es sintética y **no es una validación criptográfica**.

```sh
provenance-last-mile demo --locale=es
provenance-last-mile probe origen.jpg publicado.jpg --locale=es
provenance-last-mile compare resultados-c2patool.json informe.json --locale=es
```

Instala primero [c2patool](https://github.com/contentauth/c2patool) para usar `probe`. La herramienta no navega ni descarga: proporciona copias locales obtenidas con autorización. El informe compara el manifiesto activo y el estado de validación, y señala ausencia, fallo o cambio que revisar. Un manifiesto diferente puede ser una edición legítima; una misma etiqueta no prueba la identidad del firmante. Configura y verifica por separado las listas de confianza de `c2patool` cuando corresponda. Nunca consideres «falso» un archivo sin firma; este laboratorio no juzga la veracidad del contenido.

Piloto: pasar diez medios firmados por un CMS y CDN que consientan, descargar la versión pública y localizar las etapas que eliminan las Credentials.

MIT — [LICENSE](LICENSE).
