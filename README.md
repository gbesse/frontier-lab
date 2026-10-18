# Frontier Lab

[English](README.en.md) · [Español](README.es.md) · Français

Frontier Lab est le catalogue général de logiciels. Matter Lab regroupe les outils de fabrication et de matériel ; les projets spatiaux ont désormais trois dépôts autonomes : [Mission Benchmark Commons](https://github.com/gbesse/mission-benchmark-commons), [Contact Market](https://github.com/gbesse/contact-market), [Citizen Mission](https://github.com/gbesse/citizen-mission). Chaque dépôt se clone et se lance séparément, avec interface et documentation FR/EN/ES, licence MIT, moteurs spécialisés, preuves archivées et défis partageables.

Trente et un projets open source en **alpha locale** : quatre dans l’atelier principal, seize bancs en ligne de commande, Space Mission Lab et dix outils et laboratoires de fabrication dans Matter Lab. Les noms et le périmètre sont provisoires. Ce dépôt n’est pas un service hébergé et ses packages ne sont pas publiés sur npm.

Les extensions d’agents ont leurs propres dépôts : [Agent Commerce Ledger pour OpenClaw et Hermes](https://github.com/gbesse/agent-commerce-ledger) consigne les reçus de messages et les validations d’outils configurés ; [Caller Context pour OpenClaw](https://github.com/gbesse/openclaw-caller-context) recherche un contexte d’appel local. Elles ne créent pas de contact CRM et n’envoient pas de relance.

| Projet                 | Ce qui fonctionne                                                                                                                                        | Limite explicite de cette alpha                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Teachpack**          | Suit une fenêtre ou un écran partagé, lit le texte localement et crée un guide visuel vérifiable ; compile aussi des démonstrations structurées en skill | Le guide visuel reconnaît des états d’écran et ne pilote pas encore les autres applications                                                  |
| **Branch**             | Simule commandes, réservations de stock, crédit client et notifications, avec forks et injection de pannes                                               | Modèle métier explicite en mémoire ; pas un clone automatique d’un ERP ni un bac à sable pour du code arbitraire                             |
| **Exit**               | Transforme un export clients/interventions/pièces jointes en application autonome modifiable                                                             | Mapping explicite, mono-utilisateur local ; pas de recréation automatique des permissions et automatisations du SaaS source                  |
| **Agent Checkout Lab** | Teste un parcours de devis dans Chromium et vérifie les données enregistrées                                                                             | Contrat de test `/api/quote`, pilotes déterministes ; pas un score universel de compatibilité agents ni une preuve de conversion commerciale |

Les seize bancs sont indépendants de l’atelier ; leurs démos ne se connectent à aucun service externe :

| Projet                   | Première preuve exécutable                                                                                  | Limite explicite                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Machine Data Lab**     | Réconcilie deux exports synthétiques de machines, normalise les unités et signale les trous avec provenance | Le droit d’accès est déclaré, non vérifié ; pas d’accès aux fabricants ni de verdict Data Act |
| **Supplier Evidence**    | Réutilise des preuves synthétiques pour deux acheteurs avec contrôle du hash et divulgation ciblée          | Ne vérifie pas la véracité des déclarations ni la conformité d’un passeport produit           |
| **Handover Drill**       | Copie une petite app, restaure un instantané et vérifie un résultat métier                                  | Code de confiance uniquement ; ne démontre pas la reprise en production                       |
| **Payee Exceptions**     | Trie des résultats VoP fournis et signale les cas nécessitant une revue                                     | Ne consulte pas les banques et ne déclenche aucun paiement                                    |
| **Invoice Path**         | Rapproche des événements EC et PA et signale les ruptures de parcours                                       | N’envoie aucune facture et n’implémente pas les API PA                                        |
| **Provenance Last Mile** | Compare les manifestes C2PA de fichiers locaux avant et après publication                                   | Délègue la validation à `c2patool` ; la démo est fictive                                      |
| **PQC Cutover**          | Examine des observations de négociation TLS hybride et de repli                                             | Ne produit pas les captures et ne certifie pas la sécurité                                    |
| **Bill Replay**          | Recalcule une ligne d’énergie avec relevés, tarifs datés et arithmétique décimale exacte                    | Dépend des données fournies ; ne valide ni le compteur ni le contrat                          |
| **GARAN Witness**        | Observe dans Chromium les avis de garantie visibles sur un parcours d’achat                                 | Ne certifie ni l’éligibilité du produit ni l’authenticité du visuel officiel                  |
| **Age Proof Lab**        | Évalue les décisions `mdoc`/ZKP sur une matrice négative et cherche des canaris dans un HAR                 | Ne valide pas la cryptographie et ne certifie pas la conformité                               |
| **Last Signal**          | Relie les équipements déclarés aux calendriers cuivre/2G/3G et aux essais de remplacement                   | Ne découvre pas les équipements ni ne teste les réseaux réels                                 |
| **Recall-to-Receipt**    | Rapproche rappels, ventes et stocks par GTIN, lot et période                                                | Ne stoppe pas les ventes et n’envoie pas de messages clients                                  |
| **DSN Replay**           | Simule des corrections de paie et signale les doubles corrections                                           | Accepte un format structuré, pas les fichiers DSN/CRM natifs                                  |
| **Water Witness**        | Distingue mesures, limites de quantification et absences de données par unité d’eau                         | Ne rend aucun avis de potabilité                                                              |
| **CEE Proof Graph**      | Contrôle la cohérence de règles datées et de pièces déclarées                                               | Règles de démo synthétiques ; ne certifie pas l’éligibilité CEE                               |
| **PICS Stress Lab**      | Rejoue les conflits de moyens entre six communes sous pannes injectées                                      | Exercice fictif hors ligne ; ne vérifie pas les secours réels ni les pouvoirs de décision     |

```sh
node packages/machine-data/bin/cli.js demo --locale=fr
node packages/supplier-evidence/bin/cli.js demo --locale=fr
node packages/handover-drill/bin/cli.js demo --locale=fr
node packages/payee-exceptions/bin/cli.js demo --locale=fr
node packages/invoice-path/bin/cli.js demo --locale=fr
node packages/provenance-last-mile/bin/cli.js demo --locale=fr
node packages/pqc-cutover/bin/cli.js demo --locale=fr
node packages/bill-replay/bin/cli.js demo --locale=fr
node packages/garan-witness/bin/cli.js demo --locale=fr
node packages/age-proof-lab/bin/cli.js demo --locale=fr
node packages/last-signal/bin/cli.js demo --locale=fr
node packages/recall-to-receipt/bin/cli.js demo --locale=fr
node packages/dsn-replay/bin/cli.js demo --locale=fr
node packages/water-witness/bin/cli.js demo --locale=fr
node packages/cee-proof-graph/bin/cli.js demo --locale=fr
node packages/pics-stress-lab/bin/cli.js demo --locale=fr
```

## Parcours rapide des sept laboratoires

`npm run demo:labs -- --locale=fr` exécute les sept démonstrations hors ligne et rassemble leurs résumés et limites dans un seul JSON. Les données sont synthétiques ; aucun compte ni service externe n’est requis. Choisir `en` ou `es` pour les autres langues.

## Essayer

Node.js 22+ et npm. Python 3 est requis pour le test de l’extension Hermes. Sur macOS, la capture visuelle Teachpack utilise Apple Vision pour lire le texte sans service externe. Choisir la fenêtre ou l’écran dans le sélecteur du navigateur ; Chrome est conseillé si le navigateur intégré ne propose pas le partage d’écran. Aucun compte ni clé API requis.

```sh
npm ci
npm run browsers:install
npm start
```

Ouvrir **http://127.0.0.1:4317**. Le serveur écoute uniquement sur l’interface locale. `PORT=4320 npm start` permet de choisir un autre port. Données et rapports du studio : `.local/`, ignoré par Git. Aucun email envoyé, aucune commande réelle, aucun service externe connecté.

L’atelier est disponible en français, anglais et espagnol : choisir **FR / EN / ES** en haut à droite. Le choix est conservé dans ce navigateur. Dans Teachpack, l’interface, les messages de suivi et les étapes générées par défaut changent de langue ; la reconnaissance locale lit aussi les écrans dans ces trois langues. Les textes réellement visibles à l’écran et vos descriptions libres sont conservés tels quels, sans traduction automatique.

Teachpack peut aussi détecter les clics sur macOS, sur demande : cocher l’option avant de partager un écran entier. La première autorisation « Surveillance des entrées » peut nécessiter un passage dans les réglages système. Cette alpha enregistre l’instant et la position des clics, pas le nom du bouton ni les frappes clavier ; un seul écran actif est pris en charge. La capture visuelle reste disponible si la permission est refusée.

Pendant le suivi, le guide montre maintenant une capture de référence locale. Si des clics ont été enregistrés, des points indiquent leurs positions approximatives sur l’écran précédent ; ils ne désignent pas un bouton certain et ne déclenchent aucune action.

Teachpack can optionally detect clicks on macOS: select the option before sharing a full display. The first Input Monitoring permission may require a trip to System Settings. This alpha stores click time and position, not the button's identity or keystrokes; it supports one active display. Screen capture still works if permission is denied.

Teachpack también puede detectar clics en macOS de forma opcional: marca la opción antes de compartir toda la pantalla. El primer permiso de Supervisión de entrada puede requerir abrir los Ajustes del Sistema. Esta alfa guarda la hora y la posición de los clics, no la identidad del botón ni las teclas pulsadas; admite una sola pantalla activa. La captura de pantalla sigue funcionando si se deniega el permiso.

Parcours conseillé, cinq minutes :

1. **Teachpack** : ouvrir « Montrer son écran », choisir une fenêtre, exécuter deux étapes visibles, arrêter, sélectionner les images utiles et créer un guide. Repartager la fenêtre pour voir les étapes reconnues en direct. La démo d’appels d’outils reste accessible plus bas dans un volet technique.
2. **Branch** : répéter les cinq scénarios ; observer les erreurs attendues, les effets déjà réalisés et l’absence de doublons.
3. **Exit** : vérifier l’export exemple, générer et télécharger l’application. Décompresser, entrer dans le dossier généré, `npm start`. L’application démarre sur le port 4318 sans `npm install`.
4. **Checkout** : lancer le pilote sémantique avant/après, puis le pilote structuré après correction. Le résultat attendu est échec/réussite/réussite. Les labels absents bloquent volontairement le pilote sémantique, pas tous les agents possibles.

Les captures Teachpack et exports Exit restent sur votre disque dans `.local/` ; ils peuvent contenir des informations visibles dans la fenêtre choisie. Ne pas publier `.local/` ou `output/`. Les devis synthétiques du site témoin sont en mémoire ; les rapports de tests persistent.

### Bases de données synthétiques avec Jev

`npm run synthetic:databases -- --locale=fr --seed=20261001` crée trois bases SQLite locales dans `output/synthetic-databases/20261001/` : maintenance, facturation et vérification simulée de bénéficiaires. Les tables sont reliées, les montants et les chronologies sont contrôlés, et la graine rend la génération reproductible. Les noms, adresses et comptes sont fictifs. Pour un autre dossier, utiliser `--output=chemin` ; un dossier existant n’est pas écrasé.

Cette commande nécessite `TYPESAFE_API_KEY` dans l’environnement ou dans le fichier `.env` ignoré par Git. Elle effectue un appel Jev payant par base et conserve son avis, les contrôles locaux, des échantillons et les empreintes SHA-256 dans `validation.json`. Un verdict « crédible » évalue seulement les échantillons et distributions fournis : il ne prouve pas le réalisme de chaque ligne. `--offline` génère les mêmes bases avec les seuls contrôles locaux et marque l’avis Jev comme indisponible. `--locale=en` ou `--locale=es` génère les textes et le rapport dans la langue choisie.

## Vérifier

```sh
npm test               # règles métier, apprentissage, migration, API et persistance
npm run demo           # skill + répétition + application autonome dans output/
npm run test:browser   # Chromium, atelier, app générée, devis et partage d’écran simulé (Apple Vision sur Mac)
npm run pack:check     # pack + installation et CLI dans un consommateur extérieur
npm run format:check
npm audit --audit-level=moderate
```

Sous Linux en CI, installer les bibliothèques système avec `npm run browsers:install -- --with-deps`. `pack:check` utilise npm pour installer Playwright dans un répertoire temporaire ; les tarballs de nos packages restent locaux. Le workflow GitHub teste Node 22 et 24 sous Linux ; une vérification macOS des ponts Swift peut être lancée manuellement. Aucun de ces tests n’accorde l’autorisation système de surveillance des clics.

## Trente et un packages, dont quatre dans l’atelier principal

```text
packages/teachpack/         → apprentissage symbolique + CLI
packages/branch/            → simulateur métier + CLI
packages/exit/              → migration + générateur d’application + CLI
packages/checkout/          → navigateur + vérification métier + CLI
packages/machine-data/      → rapprochement d’exports de machines + CLI
packages/supplier-evidence/ → partage ciblé de preuves fournisseurs + CLI
packages/handover-drill/    → exercice de reprise d’application + CLI
packages/payee-exceptions/  → tri des exceptions VoP + CLI
packages/invoice-path/      → rapprochement d’événements de facture + CLI
packages/provenance-last-mile/ → contrôle C2PA après publication + CLI
packages/pqc-cutover/       → revue d’essais de bascule TLS hybride + CLI
packages/bill-replay/       → rapprochement de facture d’électricité + CLI
packages/garan-witness/     → observation d’avis de garantie + CLI
packages/age-proof-lab/     → essais de vérificateur d’âge et canaris + CLI
packages/last-signal/       → audit des dépendances cuivre et 2G/3G + CLI
packages/recall-to-receipt/ → rapprochement rappels, ventes et stocks + CLI
packages/dsn-replay/        → simulation de corrections DSN + CLI
packages/water-witness/     → provenance des mesures d’eau + CLI
packages/cee-proof-graph/   → cohérence des preuves CEE + CLI
packages/pics-stress-lab/   → exercice de moyens intercommunaux PCS/PICS + CLI
studio/                     → atelier local et site témoin
test/                       → règles, intégration, tests navigateur
```

Chaque package contient son README, sa licence MIT, ses exports ESM et son exécutable, et peut être empaqueté séparément. Teachpack utilise Branch pour sa commande de répétition. Le monorepo facilite les essais croisés, sans prétendre que vingt dépôts GitHub distincts ont déjà été créés.

Documentation détaillée : [Teachpack](packages/teachpack/README.md), [Branch](packages/branch/README.md), [Exit](packages/exit/README.md), [Agent Checkout](packages/checkout/README.md), [Machine Data Lab](packages/machine-data/README.md), [Supplier Evidence](packages/supplier-evidence/README.md), [Handover Drill](packages/handover-drill/README.md), [Payee Exceptions](packages/payee-exceptions/README.md), [Invoice Path](packages/invoice-path/README.md), [Provenance Last Mile](packages/provenance-last-mile/README.md) et [PQC Cutover](packages/pqc-cutover/README.md). Voir aussi [Sécurité et limites](SECURITY.md) et [Contribuer](CONTRIBUTING.md). Les notes de stratégie et de lancement restent locales et ne font pas partie du dépôt public.

Nouveaux bancs : [Bill Replay](packages/bill-replay/README.md), [GARAN Witness](packages/garan-witness/README.md) et [Age Proof Lab](packages/age-proof-lab/README.md). Le dernier teste des observations synthétiques et ne constitue pas une certification de preuve d’âge.

Cette itération ajoute [Last Signal](packages/last-signal/README.md), [Recall-to-Receipt](packages/recall-to-receipt/README.md), [DSN Replay](packages/dsn-replay/README.md), [Water Witness](packages/water-witness/README.md) et [CEE Proof Graph](packages/cee-proof-graph/README.md). Les données externes et règles officielles doivent encore être reliées et validées avant un usage opérationnel.

[PICS Stress Lab](packages/pics-stress-lab/README.md) ajoute un exercice synthétique de partage de moyens entre communes. Il ne commande aucune intervention réelle.

## Statut

Implémentations alpha, pas produits commercialement validés. Aucun test avec un fournisseur LLM réel dans la validation locale. Le pilote modèle optionnel exige une configuration et peut entraîner une facturation chez le fournisseur choisi. La détection des clics a été testée avec un événement simulé ; son autorisation système et un vrai clic doivent encore être vérifiés sur un Mac consentant avant d’annoncer cette fonction comme validée de bout en bout.

MIT — voir [LICENSE](LICENSE).

## Space Mission Lab

L’expédition ajoute Light Cone, Relay Rescue, Space Credits et Signal Hunter : délais lumineux jusqu’à Proxima, messages relayés, budgets fictifs et recherche de dérives synthétiques. Atlas SOTA sourcé sur `/space/explore?lang=fr`, défi quotidien, liens rejouables, carte PNG et passeport JSON. Les liens partagent les réglages, jamais le JSON de mission. `node packages/space-mission-lab/bin/cli.js frontier --locale=fr --destination=proxima` exécute cette extension. Les trois commons ci-dessous exécutent désormais Basilisk/Orekit, SGP4/OR-Tools/ION et blimpy/turboSETI sur des données publiques archivées ; l’expédition conserve ses modèles synthétiques. Aucun trafic public mesuré.

[Space Mission Lab](packages/space-mission-lab/README.md) réunit quatre modules : allocation de plusieurs engins, simulation de ressources, assistant à règles fondé sur les traces et essais de pannes pour l’autonomie. Après `npm start`, ouvrir **http://127.0.0.1:4317/space** ; interface et rapports en FR / EN / ES. `node packages/space-mission-lab/bin/cli.js demo --locale=fr` exécute les quatre modules. Ces quatre modules utilisent un modèle synthétique local sans liaison avec un engin réel. Les commons ajoutent la dynamique orbitale Basilisk/Orekit séparément ; les intégrations GMAT et cFS restent à construire.

### SOTA+++ — moteurs et défis spatiaux

Les trois pistes sont exécutables : **Mission Benchmark Commons** (Basilisk/Orekit, ISS et JPL DE440s), **Contact Market** (SGP4, OR-Tools CP-SAT, manifeste ION BPv7/UDP et reçu Ed25519 local) et **Citizen Mission** (observation réelle Voyager 1/GBT, blimpy et turboSETI sur CPU). Routes `/space/commons/benchmark`, `/space/commons/market`, `/space/commons/citizen`, en FR/EN/ES, avec défis quotidiens, prédictions, liens partageables, JSON et PNG. Crédits fictifs, antennes de scénario et porteuse humaine connue sont explicitement indiqués.

`npm run space:setup` installe les moteurs dans `.local/space-runtime`. `npm run space:test:engines` vérifie les vrais calculs. `npm run space:fixtures` enregistre les preuves ; `npm run space:public` produit `output/space-public`, un site statique publiable qui rejoue les cas enregistrés sans exposer les API locales. Installation et limites : [documentation FR/EN/ES](packages/space-mission-lab/README.md). Aucun déploiement public ni trafic mesuré n’est présumé.

`npm run space:repositories -- /chemin/nouveau-dossier` extrait les trois applications autonomes depuis les sources suivies par Git, avec un manifeste de provenance. Le dossier cible doit être neuf ; les runtimes locaux et fichiers non suivis sont exclus. Les dépôts GitHub ci-dessus contiennent leurs propres versions et tests.

## Matter Lab — dix repos autonomes

Après `npm start`, ouvrir **http://127.0.0.1:4317/matter?lang=fr**. Les dix démos, interfaces, erreurs et rapports sont disponibles en FR/EN/ES. Chaque package se lance aussi séparément avec `npm start` depuis son dossier, sur le port 4321.

| Projet                                          | Première preuve exécutable                                                       | Limite                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [FabReplay](packages/fabreplay/README.md)       | Comparaison de rigidité, IC entre éprouvettes, conditions d’essai et imports CSV | Mesures de démo synthétiques ; pas de vérification du capteur     |
| [SwitchBench](packages/switchbench/README.md)   | Défaut RL, extinction et énergie d’écrêteur ; export et exécution ngspice        | Interrupteurs génériques, sans arc ni commutation hybride validée |
| [MicroFabGym](packages/microfabgym/README.md)   | Stratégies sur des épisodes communs, API reset/step et adaptateur Gymnasium      | Film scalaire simulé ; aucun entraînement RL ni usine connectée   |
| [CoolantForge](packages/coolantforge/README.md) | Recherche bornée, front de Pareto et schéma SVG des microcanaux                  | Modèle réduit ; pas de CFD 3D ni de CAD fabricable                |
| [QualifyDiff](packages/qualifydiff/README.md)   | Propagation des changements, preuves par périmètre et plan de requalification    | Couverture déclarée ; pas de certification                        |
| [FabPort](packages/fabport/README.md)           | Compatibilité de capacités, substitutions et preuves datées                      | Profils déclarés ; pas de connecteur machine                      |
| [FabResume](packages/fabresume/README.md)       | Journal de tentatives et reprise conditionnée à l’état physique                  | Plan seul ; contrat d’idempotence déclaré                         |
| [MeasurePlan](packages/measureplan/README.md)   | Recherche exacte de contrôles sous budget et obligations                         | Sensibilités déclarées et indépendance supposée                   |
| [MicroBlocks](packages/microblocks/README.md)   | Cinq blocs avec contrats, géométries OpenSCAD illustratives et preuves           | Mesures synthétiques ; fonctions non validées                     |
| [FabTrace](packages/fabtrace/README.md)         | Traces par pièce, seuils et associations statistiques                            | Associations descriptives ; aucune causalité établie              |

`npm run matter:test:engines` vérifie ngspice et Gymnasium. Installer ces outils selon les README ; les variables `SWITCHBENCH_NGSPICE` et `MICROFABGYM_PYTHON` peuvent désigner leurs exécutables. Les dix projets sont indépendants d’Atomic Machines et ne disposent pas d’un accès au Matter Compiler.

## Visiter un seul atelier

`npm run demo:labs -- --locale=fr --project=payee-exceptions` exécute uniquement la démonstration choisie, sans réseau. Les sept noms valides figurent dans la liste des ateliers ci-dessus ; un nom inconnu est refusé.

## Contrôle d’adoption · Adoption check · Comprobación de adopción

[Français : essayer un cas synthétique](examples/adoption-check.md) · [English: try a synthetic case](examples/adoption-check.md) · [Español: pruebe un caso sintético](examples/adoption-check.md).

Exécutez `npm run demo:branch-failure` pour voir une panne synthétique de notification après confirmation : la commande vérifie que la commande reste confirmée et qu’aucun message n’est mis en file. Ce parcours ne simule ni transaction ERP ni envoi réel.

## Répétition Branch portable

`mkdir -p .local && npx branch-lab record examples/branch-failure.json .local/branch-bundle.json`, puis `npx branch-lab replay .local/branch-bundle.json` enregistre le scénario complet et vérifie par réexécution son état, ses événements et ses assertions. `verified` prouve la concordance de répétition ; `scenarioPassed` indique séparément le résultat des assertions. Le bundle peut contenir des données utilisateur : gardez-le privé. Les hashes ne sont ni signatures ni preuves de comportement en production. [Guide FR/EN/ES](packages/branch/README.md).

Branch expose un diff distinguant les propriétés absentes de `null` et le premier chemin divergent d’une répétition ; voir [son API](packages/branch/README.md).
