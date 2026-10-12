# FabPort

[Français](README.md) · [English](README.en.md) · [Español](README.es.md)

Confrontez chaque étape aux profils de capacité, aux substitutions déclarées et aux preuves de calibration datées.

![FabPort](docs/fabport-fr.png)

## Essayer en une minute

Node.js 22+ suffit : aucune dépendance d’exécution, aucun compte ni clé API. La démo reste sur la boucle locale. Ouvrir http://127.0.0.1:4321/?lang=fr.

```sh
git clone https://github.com/gbesse/fabport.git
cd fabport
node bin/cli.js demo --locale=fr
npm start
```

`PORT=4322 npm start` change le port.

## Utiliser ses données

Importer un JSON dans la démo, ou partir de `fixtures/demo.json`. Les raccourcis de réglage concernent uniquement la démo synthétique ; les dossiers importés se modifient dans le JSON. Changer la langue traduit les libellés et rapports, jamais les données ou identifiants. Exports JSON et SVG disponibles. Aucun envoi réseau des données.

```sh
node bin/cli.js run fixtures/demo.json --locale=fr --output=report.json
node bin/cli.js check fixtures/demo.json --locale=fr
```

`--output` crée exclusivement un nouveau fichier en mode 600 et refuse tout écrasement. Les rapports CLI contiennent le SHA-256 des octets d’entrée : intégrité de rejeu, sans preuve d’authenticité. Limite CLI/import : 5 Mo. `run` produit le rapport même si la décision est négative ; `check` retourne 0 (`pass`), 1 (`fail`), 3 (`inconclusive`) ou 2 pour une erreur de format/commande.

## Format JSON v1

Enveloppe requise : `schemaVersion: 1`, `origin: synthetic | user`. L’origine est déclarative ; ce champ n’authentifie pas les mesures. Champs additionnels acceptés comme métadonnées mais ignorés dans les décisions. Les paramètres physiques et protocoles doivent rester dans les champs documentés.

`asOf`, `requirements`, `fabs` et `substitutions` sont requis. Une exigence contient `id`, `operation`, `material`, `maxErrorUm` et `range: {min, max, unit}`. Une usine contient `id`, `complete` et `capabilities`. Chaque capacité contient les mêmes contraintes et `evidence: {id, calibrationId, qualified, validFrom, validUntil}` ; précision, plage et preuve peuvent être `null` pour indiquer une information manquante. Une substitution contient `id`, `fromOperation`, `toOperation`, `fromMaterial`, `toMaterial`. Limites : 100 exigences, 50 usines, 500 capacités par usine, 100 substitutions.

## Comportement et limites

Chaque étape doit être couverte par une seule capacité satisfaisant toutes ses contraintes. Unités identiques requises. Une substitution reste à qualifier ; un profil incomplet ou une preuve expirée ne justifie pas la compatibilité.

La démo distingue quatre usines : compatible, adaptation de résine à qualifier, calibration expirée et capacité insuffisante. Une plage et une précision issues de deux capacités différentes ne peuvent pas être combinées. Une alternative invalide n’est pas proposée comme adaptation. `pass` signifie qu’au moins une usine couvre toutes les étapes selon ses déclarations ; `fail` que tous les profils sont incompatibles ; sinon examen requis. Ce format JSON interne n’est pas une implémentation OPC UA ni un SDK Atomic Machines.

## API JavaScript

```js
import { readFile } from 'node:fs/promises';
import { analyze } from './src/index.js';
const input = JSON.parse(await readFile('fixtures/demo.json', 'utf8'));
const report = analyze(input, { locale: 'fr' });
console.log(report.status, report.rows);
```

`analyze` est synchrone, déterministe et ne modifie pas l’entrée. Les résultats sont des copies indépendantes. Les messages sont localisés ; les états et noms de champs sont des identifiants stables.

## Vérifier et contribuer

```sh
npm ci --ignore-scripts
npm test
npx playwright install chromium
npm run test:browser
npm run format:check
```

Tests de décisions et contre-exemples, validation des entrées, codes de sortie, empreintes et exports sans écrasement. Parcours navigateur FR/EN/ES : modification, erreurs, import, changement de langue, exports et mobile. CI sur Node 22 et 24. Contribuer un cas reproductible avec unités, hypothèses, provenance et résultats attendus ; toute évolution publique doit inclure FR/EN/ES.

## État et outils associés

Alpha indépendante sous MIT, non affiliée à Atomic Machines. Exemples et preuves de démonstration synthétiques, aucun équipement ni API industrielle connecté. Dépôt autonome ; pas de publication npm.

[Matter Compiler](https://www.atomicmachines.com/matter-compiler) · [PartCAD](https://github.com/partcad/partcad) · [Bluesky](https://blueskyproject.io/) · [OPC UA Job Management](https://reference.opcfoundation.org/specs/OPC-40001-3/full) · [QIF](https://www.nist.gov/publications/end-end-quality-information-framework-qif-technology-survey)
