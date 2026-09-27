# Handover Drill

## Français

Alpha locale qui vérifie si une autre personne peut **repartir d’une copie propre**, installer les dépendances, restaurer un instantané, démarrer une petite application et obtenir le résultat métier attendu. La démo synthétique installe un projet sans dépendances réseau, restaure deux interventions dans une copie temporaire et vérifie le nombre et le dernier identifiant.

```sh
handover-drill demo --locale=fr
handover-drill run config.json rapport.json --locale=fr
```

`config.json` liste explicitement les fichiers à copier, une commande facultative d’installation, une commande de restauration, une commande de démarrage et deux routes JSON locales. Les commandes s’exécutent **sans shell**, dans un dossier temporaire, avec un environnement réduit (`PATH`, `PORT`, `HOST`, `NODE_ENV`) ; les fichiers `.env` et les clés sont refusés. Ce n’est **pas un bac à sable** : le code conserve les droits du compte local et peut accéder au réseau. N’utilisez que du code de confiance ; ne pointez pas vers une base de production. Ce premier exercice ne teste ni une migration réelle, ni les permissions, pièces jointes, courriels, dépendances externes ou objectifs de reprise en production. Le rapport n’enregistre pas les sorties des commandes afin de réduire le risque d’exposer des secrets.

Voir la [configuration synthétique](fixtures/demo-config.json) et sa [petite application](fixtures/sample-app/app.js). Les routes doivent renvoyer du JSON ; le contrôle métier compare exactement le résultat attendu. L’application de démo écoute `127.0.0.1` sur le port fourni par l’exercice.

Pilote à valider : cinq petites applications construites avec l’IA, chacune reprise par une personne qui ne l’a pas créée. Mesurer le taux de reprise en trente minutes, les interventions de l’auteur et les causes d’échec ; arrêter si l’exercice n’apporte rien aux procédures existantes.

## English

Local alpha that checks whether another person can **start from a clean copy**, install dependencies, restore a snapshot, start a small app and obtain the expected business result. The synthetic demo installs a project without network dependencies, restores two jobs into a temporary copy and checks their count and latest ID.

```sh
handover-drill demo --locale=en
handover-drill run config.json report.json --locale=en
```

`config.json` explicitly lists files to copy, an optional install command, a restore command, a start command and two local JSON routes. Commands run **without a shell** in a temporary directory with a reduced environment (`PATH`, `PORT`, `HOST`, `NODE_ENV`); `.env` and key files are refused. This is **not a sandbox**: code retains the local account’s permissions and can access the network. Use trusted code only; never point it at a production database. This first drill does not test a real migration, permissions, attachments, emails, external dependencies or production recovery objectives. Command output is not recorded in the report to reduce secret exposure.

See the [synthetic configuration](fixtures/demo-config.json) and its [small app](fixtures/sample-app/app.js). Routes must return JSON; the business check compares the exact expected result. The demo app binds to `127.0.0.1` on the port supplied by the drill.

Pilot to validate: five small AI-built applications, each handed to someone who did not create it. Measure the share recovered within thirty minutes, author interventions and failure causes; stop if the drill adds nothing to existing procedures.

## Español

Alfa local que comprueba si otra persona puede **partir de una copia limpia**, instalar dependencias, restaurar una instantánea, iniciar una pequeña aplicación y obtener el resultado de negocio esperado. La demostración sintética instala un proyecto sin dependencias de red, restaura dos intervenciones en una copia temporal y comprueba su número y el último identificador.

```sh
handover-drill demo --locale=es
handover-drill run config.json informe.json --locale=es
```

`config.json` enumera explícitamente los archivos que se copiarán, un comando opcional de instalación, uno de restauración, uno de arranque y dos rutas JSON locales. Los comandos se ejecutan **sin shell** en un directorio temporal con un entorno reducido (`PATH`, `PORT`, `HOST`, `NODE_ENV`); se rechazan archivos `.env` y claves. Esto **no es un entorno aislado**: el código conserva los permisos de la cuenta local y puede acceder a la red. Usa solo código de confianza; nunca apuntes a una base de producción. Este primer ejercicio no prueba una migración real, permisos, adjuntos, correos, dependencias externas ni objetivos de recuperación en producción. El informe no guarda la salida de los comandos para reducir la exposición de secretos.

Consulta la [configuración sintética](fixtures/demo-config.json) y su [pequeña aplicación](fixtures/sample-app/app.js). Las rutas deben devolver JSON; la comprobación de negocio compara el resultado esperado exacto. La aplicación de ejemplo escucha en `127.0.0.1` en el puerto indicado por el ejercicio.

Piloto por validar: cinco pequeñas aplicaciones creadas con IA, cada una retomada por alguien que no la creó. Medir cuántas se recuperan en treinta minutos, las intervenciones del autor y las causas de fallo; detenerlo si el ejercicio no aporta nada a los procedimientos existentes.

MIT — [LICENSE](LICENSE).
