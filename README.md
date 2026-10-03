# Frontier Lab

[English](README.en.md) · [Español](README.es.md) · Français

Quatorze projets open source en **alpha locale** : quatre dans l’atelier interactif et dix bancs d’essai en ligne de commande. Les noms et le périmètre sont provisoires. Ce dépôt n’est pas un service hébergé et ses packages ne sont pas publiés sur npm.

Les extensions d’agents ont leurs propres dépôts : [Agent Commerce Ledger pour OpenClaw et Hermes](https://github.com/gbesse/agent-commerce-ledger) consigne les reçus de messages et les validations d’outils configurés ; [Caller Context pour OpenClaw](https://github.com/gbesse/openclaw-caller-context) recherche un contexte d’appel local. Elles ne créent pas de contact CRM et n’envoient pas de relance.

| Projet                 | Ce qui fonctionne                                                                                                                                        | Limite explicite de cette alpha                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Teachpack**          | Suit une fenêtre ou un écran partagé, lit le texte localement et crée un guide visuel vérifiable ; compile aussi des démonstrations structurées en skill | Le guide visuel reconnaît des états d’écran et ne pilote pas encore les autres applications                                                  |
| **Branch**             | Simule commandes, réservations de stock, crédit client et notifications, avec forks et injection de pannes                                               | Modèle métier explicite en mémoire ; pas un clone automatique d’un ERP ni un bac à sable pour du code arbitraire                             |
| **Exit**               | Transforme un export clients/interventions/pièces jointes en application autonome modifiable                                                             | Mapping explicite, mono-utilisateur local ; pas de recréation automatique des permissions et automatisations du SaaS source                  |
| **Agent Checkout Lab** | Teste un parcours de devis dans Chromium et vérifie les données enregistrées                                                                             | Contrat de test `/api/quote`, pilotes déterministes ; pas un score universel de compatibilité agents ni une preuve de conversion commerciale |

Les dix bancs sont indépendants de l’atelier ; leurs démos ne se connectent à aucun service externe :

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
```

## Essayer

Node.js 22+ et npm. Sur macOS, la capture visuelle Teachpack utilise Apple Vision pour lire le texte sans service externe. Choisir la fenêtre ou l’écran dans le sélecteur du navigateur ; Chrome est conseillé si le navigateur intégré ne propose pas le partage d’écran. Aucun compte ni clé API requis.

```sh
npm ci
npx playwright install chromium
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

## Vérifier

```sh
npm test               # règles métier, apprentissage, migration, API et persistance
npm run demo           # skill + répétition + application autonome dans output/
npm run test:browser   # Chromium, atelier, app générée, devis et partage d’écran simulé (Apple Vision sur Mac)
npm run pack:check     # pack + installation et CLI dans un consommateur extérieur
npm run format:check
npm audit --audit-level=moderate
```

Sous Linux en CI, installer les bibliothèques système avec `npx playwright install --with-deps chromium`. `pack:check` utilise npm pour installer Playwright dans un répertoire temporaire ; les tarballs de nos packages restent locaux. Le workflow GitHub teste Node 22 et 24 sous Linux ; une vérification macOS des ponts Swift peut être lancée manuellement. Aucun de ces tests n’accorde l’autorisation système de surveillance des clics.

## Quatorze packages, dont quatre dans l’atelier partagé

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
studio/                     → atelier local et site témoin
test/                       → règles, intégration, tests navigateur
```

Chaque package contient son README, sa licence MIT, ses exports ESM et son exécutable, et peut être empaqueté séparément. Teachpack utilise Branch pour sa commande de répétition. Le monorepo facilite les essais croisés, sans prétendre que quatorze dépôts GitHub distincts ont déjà été créés.

Documentation détaillée : [Teachpack](packages/teachpack/README.md), [Branch](packages/branch/README.md), [Exit](packages/exit/README.md), [Agent Checkout](packages/checkout/README.md), [Machine Data Lab](packages/machine-data/README.md), [Supplier Evidence](packages/supplier-evidence/README.md), [Handover Drill](packages/handover-drill/README.md), [Payee Exceptions](packages/payee-exceptions/README.md), [Invoice Path](packages/invoice-path/README.md), [Provenance Last Mile](packages/provenance-last-mile/README.md) et [PQC Cutover](packages/pqc-cutover/README.md). Voir aussi [Sécurité et limites](SECURITY.md) et [Contribuer](CONTRIBUTING.md). Les notes de stratégie et de lancement restent locales et ne font pas partie du dépôt public.

Nouveaux bancs : [Bill Replay](packages/bill-replay/README.md), [GARAN Witness](packages/garan-witness/README.md) et [Age Proof Lab](packages/age-proof-lab/README.md). Le dernier teste des observations synthétiques et ne constitue pas une certification de preuve d’âge.

## Statut

Implémentations alpha, pas produits commercialement validés. Aucun test avec un fournisseur LLM réel dans la validation locale. Le pilote modèle optionnel exige une configuration et peut entraîner une facturation chez le fournisseur choisi. La détection des clics a été testée avec un événement simulé ; son autorisation système et un vrai clic doivent encore être vérifiés sur un Mac consentant avant d’annoncer cette fonction comme validée de bout en bout.

MIT — voir [LICENSE](LICENSE).
