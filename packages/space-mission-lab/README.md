# Space Mission Lab

## Français

Quatre pistes réunies dans une alpha locale : allocation de plusieurs engins, simulation des ressources, assistant fondé sur les traces et matrice de validation de l’autonomie. La démo comprend deux engins et cinq objectifs. L’interface est accessible à **http://127.0.0.1:4317/space** après `npm start`, avec sélection FR / EN / ES. Aucun compte, clé API ou service externe requis.

```sh
node packages/space-mission-lab/bin/cli.js demo --locale=fr
node packages/space-mission-lab/bin/cli.js demo --locale=fr --fault=low-power --policy=unguarded
node packages/space-mission-lab/bin/cli.js analyze mission.json rapport.json --locale=fr
```

Le CLI écrit un fichier de rapport uniquement si ce chemin n’existe pas. Les fonctions ESM exportées sont `orchestrate`, `simulate`, `assist`, `validateAutonomy` et `runMission`. `simulate(mission, schedule, options)` accepte un programme fourni ; `runMission(mission, options)` relie les quatre modules. Les identifiants et les données utilisateur sont conservés tels quels. Le choix de langue ne traduit pas un rapport existant ; relancer produit un nouveau rapport dans la langue demandée.

### Expédition, atlas SOTA et partage

Quatre expériences supplémentaires sont intégrées à `/space` : **Light Cone** (délais lumineux), **Relay Rescue** (livraison par contacts), **Space Credits** (droits de dépense préalloués) et **Signal Hunter** (spectres synthétiques). L’atlas `/space/explore?lang=fr` rassemble 18 entrées avec sources primaires, maturité et propositions à développer. Il couvre aussi SPICE, NOS3, Space ROS, ION/HDTN, LunaNet/Moonlight, Breakthrough Listen et les paiements hors ligne. Une carte PNG, un passeport JSON et un fragment de contacts ION sont téléchargeables.

```sh
node packages/space-mission-lab/bin/cli.js frontier --locale=fr --destination=proxima --conflict=1
```

`runFrontier(mission, config)` réutilise `runMission` : chaque observation exécutée devient un message en octets décimaux (`dataMb × 1 000 000`, minimum un octet), disponible au début de l’action selon le modèle existant. Les transmissions du modèle de ressources restent indépendantes de la nouvelle expérience réseau. Les livraisons produisent des empreintes utilisées par les reçus. L’empreinte canonique réutilise `fingerprint` de Branch Lab ; elle garantit la reproductibilité, **pas l’identité ni une signature**. Le passeport inclut les réglages et la langue. Exports additionnels : `lightCone`, `simulateRelay`, `exportIonContacts`, `reconcileCredits`, `syntheticSignals`, `searchSignals`, `dailyFrontier`, `frontierConfig`, `sharedFrontier`, `readSharedFrontier` et `spaceAtlas`.

Configuration stricte : `{destination:'mars', relayPolicy:'store-forward', outage:false, doubleSpend:false, seed:20261010, signalInjection:true, locale:'fr'}`. Destinations `moon|mars|proxima`, stratégies `store-forward|immediate-direct`, graine entière de 0 à 4 294 967 295, options booléennes ; clés inconnues refusées. `lightCone` utilise des distances fixes : 384 400 km, 150 millions de km illustratifs et 4,25 années-lumière, avec année julienne de 365,25 jours. Origine temporelle : 10 octobre 2026 à 12 h UTC. Proxima est hypothétique : aucune capacité de liaison physique n’est établie. Une réponse idéale revient après 8,5 ans.

`simulateRelay` accepte `{schemaVersion:1,nodes,contacts,bundles}` : 2–12 nœuds, ≤96 contacts, ≤24 messages. Contacts `{id,from,to,start,end,rateBytesPerSec,latencySec,costUnits}` ; messages `{id,from,to,createdAt,expiresAt,bytes,priority}`. Temps en secondes finies positives ou nulles ≤10 milliards, débit entier 1–1 milliard d’octets/s, coût entier 0–1 milliard, message entier 1–1 000 milliards d’octets, priorité 1–100. Les priorités décroissantes réservent les fenêtres ; recherche de première arrivée, sans fragmentation, stockage illimité et canaux indépendants. La stratégie immédiate exige un contact direct ouvert à la création, sans attente. Aucun optimum global, BPv7, radio réelle ou file de stockage finie. `outage` désactive le contact direct du scénario intégré. Le fragment ION arrondit les fenêtres vers l’intérieur et les délais vers le haut ; il faut ajouter nœuds, transports et essais dans ION.

`reconcileCredits` prend `{schemaVersion:1,accounts,grants,proofs,receipts}` : ≤20 comptes et budgets, ≤24 preuves, ≤48 reçus. Budgets réservés depuis un compte ; entiers monétaires ≤1 milliard à l’entrée. Les séquences sont 1–48, les preuves SHA-256 doivent correspondre à une livraison, et `reconcileAt` ne peut précéder celle-ci. Les branches du portefeuille peuvent accepter provisoirement hors ligne ; aucun règlement avant l’arrivée de **tous les reçus déclarés**, hypothèse d’ensemble fermé. Un conflit de séquence ou de preuve met les budgets impliqués en quarantaine. Doublons ignorés, total comptes + réserves conservé. `nowSec` pilote seulement l’étape de réconciliation ; les acceptations locales représentent le journal déclaré, pas des achats accomplis à cet instant. Réserves restantes non remboursées automatiquement. Ni monnaie réelle, consensus ouvert, clés, signatures ni protection matérielle contre le clonage.

`searchSignals({on,off})` examine 2–16 images, 4–128 cases de fréquence, puissances finies 0–1 million. Dérives entières de −2 à +2 par défaut ; puissance ON moyenne ≥8, interférence rejetée si OFF ≥50 % de ON. Aucune calibration statistique, donnée astronomique réelle ou détection extraterrestre. Le générateur déterministe injecte une dérive et une interférence ON/OFF communes.

Le défi quotidien dérive d’une date valide `YYYY-MM-DD` via SHA-256 ; l’interface utilise la date de Paris. Les liens partagent **uniquement les réglages** et rejouent la mission témoin, jamais le JSON utilisateur. Changer la langue laisse un rapport et ses exports dans leur langue d’origine ; relancer génère un nouveau rapport. L’atlas est rendu côté serveur avec métadonnées et alternatives FR/EN/ES. Ces mécanismes facilitent découverte, retour et partage après déploiement ; **aucune audience, publication publique ou hausse de trafic mesurée**. Les intégrations physiques, lecteurs SETI et classements publics restent des propositions explicites dans l’atlas. Sources de cet élargissement consultées le 10 octobre 2026.

### Contrat et modèle

Voir [le JSON de démonstration](fixtures/sample.json). `schemaVersion=1`, `id` est un identifiant ; `horizonSlots` vaut 1 à 48 et `slotMinutes` 1 à 60. Jusqu’à six engins et 24 objectifs ; identifiants uniques, de 1 à 64 caractères ASCII alphanumériques, `_` ou `-`. Toutes les valeurs numériques doivent être finies.

Chaque engin définit `batteryWh`, `batteryCapacityWh`, `reserveWh`, `baseLoadWh` et `rechargeWh` en Wh ; `storageMb` et `storageCapacityMb` en Mo décimaux. Capacités positives, réserve ≤ batterie initiale ≤ capacité, stockage initial entre zéro et capacité. Chaque valeur est bornée à 1 000 000. `contacts` et `sunlight` contiennent des fenêtres `{start,end}` en créneaux, début inclus et fin exclue, dans l’horizon.

Chaque objectif définit `id`, `type` (`observe` ou `downlink`), fenêtre `start/end`, `duration` entière positive, `priority` entière de 1 à 100, `energyWh`, `dataMb` et liste `vehicleIds` d’engins admissibles. Le programme contient `{taskId,vehicleId,start}`, une fois au maximum par objectif. L’action doit tenir entièrement dans sa fenêtre. Les valeurs négatives, fenêtres impossibles, engins inconnus et programmes dupliqués sont refusés.

À chaque créneau, le modèle applique recharge solaire, plafonnement à la capacité et charge de fond. Les actions consomment leur énergie totale et ajoutent/retirent leurs données **au début**, puis occupent l’engin pendant leur durée. Une transmission exige une fenêtre radio continue sur toute sa durée. Le capteur doit être frais au début d’une observation. Les invariants portent sur réserve énergétique, bornes de stockage, données disponibles, radio, capteur et absence de chevauchement. Ce modèle explicite n’inclut pas débit radio, distance, attitude, consommation continue des actions ou dynamique orbitale.

L’allocateur traite les priorités décroissantes, puis les identifiants ; il choisit le premier créneau et engin dont la simulation reste réalisable. Il réévalue tout le programme après chaque ajout. Une allocation peut rester incomplète et **n’est pas un optimum global**. La simulation exécute le plan nominal sous la panne choisie ; la proposition de réallocation est une prévisualisation séparée, jamais appliquée automatiquement. Les suggestions de l’assistant utilisent des règles et des références aux événements/échantillons, sans LLM.

### Pannes, preuves et limites

Options : `{locale:'fr', policy:'guarded', fault:{kind:'nominal', start:0, vehicleId:'LUNA-A'}}`. `vehicleId` omis touche tous les engins. `link-outage` coupe la radio à partir de `start` ; `sensor-stale` invalide les mesures ; `low-power` réduit à cet instant la batterie à la plus petite valeur entre l’état courant et `reserveWh + créneaux restants × baseLoadWh + 1`, puis supprime la recharge. Les pannes sont connues dans le rejeu et dans la proposition de réallocation, notamment pour vérifier toute la durée d’une transmission. Elles ne modélisent pas une découverte tardive à bord.

`guarded` bloque les actions incompatibles. `unguarded` les exécute pour montrer les violations. Les erreurs d’énergie au repos restent visibles même avec les protections. La matrice rejoue le plan fixe en nominal puis trois pannes sur chaque engin, dès le créneau zéro : sept scénarios dans la démo. Elle distingue les invariants respectés des objectifs exécutés ; sept scénarios sans violation ne signifient pas que tous les objectifs ont réussi. Elle n’est ni exhaustive ni probabiliste.

Les rapports contiennent des empreintes SHA-256 de l’entrée, du programme et de la trace. La trace exclut les libellés traduits pour rester comparable entre langues ; les empreintes reflètent la sérialisation JSON fournie, sans canonicalisation universelle ni signature. Les sorties navigateur sont téléchargées localement ; l’API ne persiste pas les rapports.

Cette alpha **n’intègre pas encore GMAT, Basilisk, cFS/F´ ou un système sol réel** et ne qualifie aucun logiciel de vol. Prochaines intégrations possibles : [GMAT](https://software.nasa.gov/software/GSC-19640-1) pour les trajectoires, [Basilisk](https://hanspeterschaub.info/basilisk/) pour le véhicule, [cFS](https://github.com/nasa/cFS) ou [F´](https://fprime.jpl.nasa.gov/) pour l’embarqué, [Yamcs](https://yamcs.org/) pour la télémétrie et [PlanDev](https://github.com/NASA-AMMOS/plandev) pour les activités. Références consultées le 9 octobre 2026.

## English

Four tracks in one local alpha: multi-vehicle allocation, resource simulation, a trace-based assistant and an autonomy validation matrix. The demo has two vehicles and five objectives. Open **http://127.0.0.1:4317/space** after `npm start`; select FR / EN / ES. No account, API key or external service required.

```sh
node packages/space-mission-lab/bin/cli.js demo --locale=en
node packages/space-mission-lab/bin/cli.js demo --locale=en --fault=low-power --policy=unguarded
node packages/space-mission-lab/bin/cli.js analyze mission.json report.json --locale=en
```

The CLI writes a report file only if the path does not exist. ESM exports: `orchestrate`, `simulate`, `assist`, `validateAutonomy`, `runMission`. `simulate(mission, schedule, options)` accepts a supplied schedule; `runMission(mission, options)` connects all four modules. Identifiers and user data remain unchanged. Changing the language does not translate an existing report; running again creates a new report in the requested language.

### Expedition, SOTA atlas and sharing

Four additional experiences are integrated into `/space`: **Light Cone** (light delays), **Relay Rescue** (contact-based delivery), **Space Credits** (preallocated spending rights) and **Signal Hunter** (synthetic spectra). The atlas at `/space/explore?lang=en` contains 18 entries with primary sources, maturity and proposals to develop. It also covers SPICE, NOS3, Space ROS, ION/HDTN, LunaNet/Moonlight, Breakthrough Listen and offline payments. Download a PNG card, JSON passport and ION contact fragment.

```sh
node packages/space-mission-lab/bin/cli.js frontier --locale=en --destination=proxima --conflict=1
```

`runFrontier(mission, config)` reuses `runMission`: each executed observation becomes a message in decimal bytes (`dataMb × 1,000,000`, minimum one byte), available at action start under the existing model. Resource-model downlinks remain independent of the new network experience. Delivery fingerprints feed receipts. Canonical hashing reuses Branch Lab’s `fingerprint`; it ensures reproducibility, **not identity or a signature**. The passport includes settings and language. Additional exports: `lightCone`, `simulateRelay`, `exportIonContacts`, `reconcileCredits`, `syntheticSignals`, `searchSignals`, `dailyFrontier`, `frontierConfig`, `sharedFrontier`, `readSharedFrontier` and `spaceAtlas`.

Strict configuration: `{destination:'mars', relayPolicy:'store-forward', outage:false, doubleSpend:false, seed:20261010, signalInjection:true, locale:'en'}`. Destinations `moon|mars|proxima`, strategies `store-forward|immediate-direct`, integer seed 0–4,294,967,295, boolean options; unknown keys rejected. `lightCone` uses fixed distances: 384,400 km, illustrative 150 million km and 4.25 light-years, with a Julian year of 365.25 days. Time origin: October 10, 2026 at 12:00 UTC. Proxima is hypothetical: no physical link capacity established. An ideal reply returns after 8.5 years.

`simulateRelay` accepts `{schemaVersion:1,nodes,contacts,bundles}`: 2–12 nodes, ≤96 contacts, ≤24 messages. Contacts `{id,from,to,start,end,rateBytesPerSec,latencySec,costUnits}`; messages `{id,from,to,createdAt,expiresAt,bytes,priority}`. Finite nonnegative seconds ≤10 billion, integer rate 1–1 billion bytes/s, integer cost 0–1 billion, integer message size 1–1 trillion bytes, priority 1–100. Descending priorities reserve windows; earliest-arrival search, no fragmentation, unlimited storage and independent channels. Immediate strategy requires a direct contact open at creation, without waiting. No global optimum, BPv7, actual radio or finite storage queue. `outage` disables the integrated scenario’s direct contact. ION fragment rounds windows inward and delays up; add nodes, transports and tests in ION.

`reconcileCredits` takes `{schemaVersion:1,accounts,grants,proofs,receipts}`: ≤20 accounts and grants, ≤24 proofs, ≤48 receipts. Budgets reserved from an account; input monetary integers ≤1 billion. Sequences 1–48, SHA-256 proofs must match a delivery, and `reconcileAt` cannot precede delivery. Wallet branches can tentatively accept offline; no settlement until **all declared receipts** arrive, a closed-set assumption. Conflicting sequences or proofs quarantine the involved grants. Duplicates ignored, accounts + escrow total conserved. `nowSec` controls only reconciliation; local acceptances represent the declared journal, not purchases made at that instant. Remaining escrow is not automatically refunded. No real currency, open-world consensus, keys, signatures or hardware clone protection.

`searchSignals({on,off})` examines 2–16 frames, 4–128 frequency bins, finite powers 0–1 million. Default integer drift −2 to +2; mean ON power ≥8, interference rejected when OFF ≥50% of ON. No statistical calibration, real astronomical data or extraterrestrial detection. The deterministic generator injects drifting power and shared ON/OFF interference.

Daily challenges derive from a valid `YYYY-MM-DD` date via SHA-256; the UI uses the Paris date. Links share **only settings** and replay the sample mission, never user JSON. Changing language retains a report and exports in their original language; rerunning creates a new report. The atlas is server-rendered with metadata and FR/EN/ES alternatives. These mechanisms support discovery, return and sharing after deployment; **no measured audience, public publication or traffic increase**. Physical integrations, SETI readers and public leaderboards remain explicit atlas proposals. Expansion sources accessed October 10, 2026.

### Contract and model

See [the demo JSON](fixtures/sample.json). `schemaVersion=1`, `id` is an identifier; `horizonSlots` is 1–48 and `slotMinutes` 1–60. At most six vehicles and 24 objectives; unique identifiers, 1–64 ASCII alphanumeric characters, `_` or `-`. All numeric values must be finite.

Each vehicle defines `batteryWh`, `batteryCapacityWh`, `reserveWh`, `baseLoadWh` and `rechargeWh` in Wh; `storageMb` and `storageCapacityMb` in decimal MB. Positive capacities, reserve ≤ initial battery ≤ capacity, initial storage between zero and capacity. Each value is bounded at 1,000,000. `contacts` and `sunlight` contain `{start,end}` windows in slots, start inclusive and end exclusive, within the horizon.

Each objective defines `id`, `type` (`observe` or `downlink`), `start/end` window, positive integer `duration`, integer `priority` from 1 to 100, `energyWh`, `dataMb`, and an eligible `vehicleIds` list. A schedule contains `{taskId,vehicleId,start}`, at most once per objective. The action must fit entirely within its window. Negative values, impossible windows, unknown vehicles and duplicate commands are rejected.

Each slot applies solar recharge, capacity clipping and baseline load. Actions consume their total energy and add/remove data **at the start**, then occupy the vehicle for their duration. A downlink needs a continuous radio window throughout its duration. The sensor must be fresh at observation start. Invariants cover power reserve, storage bounds, available data, radio, sensor and absence of overlap. This explicit model excludes radio throughput, distance, attitude, continuous action power and orbital dynamics.

The allocator processes descending priorities, then identifiers; it selects the first slot and vehicle whose simulation remains feasible. It reevaluates the entire schedule after each addition. Allocation can remain incomplete and **is not a global optimum**. Simulation executes the nominal plan under the selected fault; the reallocation proposal is a separate preview, never automatically applied. The assistant uses rules and references to events/samples, without an LLM.

### Faults, evidence and limits

Options: `{locale:'en', policy:'guarded', fault:{kind:'nominal', start:0, vehicleId:'LUNA-A'}}`. Omitting `vehicleId` affects all vehicles. `link-outage` cuts radio from `start`; `sensor-stale` invalidates measurements; `low-power` reduces battery at that instant to the lesser of its current value and `reserveWh + remaining slots × baseLoadWh + 1`, then disables recharge. Faults are known during replay and reallocation, including checking the entire downlink duration. They do not model late onboard discovery.

`guarded` blocks incompatible actions. `unguarded` executes them to expose violations. Idle power failures remain visible even with safeguards. The matrix replays the fixed plan nominally and with three faults per vehicle, from slot zero: seven scenarios in the demo. It distinguishes satisfied invariants from executed objectives; seven scenarios without violations do not mean every objective succeeded. It is neither exhaustive nor probabilistic.

Reports include SHA-256 hashes of input, schedule and trace. Trace hashing excludes translated labels to remain comparable across languages; hashes reflect the supplied JSON serialization, without universal canonicalization or signatures. Browser outputs download locally; the API does not persist reports.

This alpha **does not yet integrate GMAT, Basilisk, cFS/F´ or a real ground system**, and does not qualify flight software. Possible next integrations: [GMAT](https://software.nasa.gov/software/GSC-19640-1) for trajectories, [Basilisk](https://hanspeterschaub.info/basilisk/) for the vehicle, [cFS](https://github.com/nasa/cFS) or [F´](https://fprime.jpl.nasa.gov/) for onboard software, [Yamcs](https://yamcs.org/) for telemetry and [PlanDev](https://github.com/NASA-AMMOS/plandev) for activities. References accessed October 9, 2026.

## Español

Cuatro líneas en una alfa local: asignación de varios vehículos, simulación de recursos, asistente basado en trazas y matriz de validación de autonomía. La demostración tiene dos vehículos y cinco objetivos. Abre **http://127.0.0.1:4317/space** tras `npm start`; selecciona FR / EN / ES. No requiere cuenta, clave API ni servicio externo.

```sh
node packages/space-mission-lab/bin/cli.js demo --locale=es
node packages/space-mission-lab/bin/cli.js demo --locale=es --fault=low-power --policy=unguarded
node packages/space-mission-lab/bin/cli.js analyze mission.json informe.json --locale=es
```

El CLI escribe un archivo de informe solo si la ruta no existe. Exportaciones ESM: `orchestrate`, `simulate`, `assist`, `validateAutonomy`, `runMission`. `simulate(mission, schedule, options)` acepta un programa aportado; `runMission(mission, options)` conecta los cuatro módulos. Los identificadores y datos del usuario se conservan. Cambiar el idioma no traduce un informe existente; ejecutar de nuevo crea un informe en el idioma solicitado.

### Expedición, atlas SOTA y compartir

Cuatro experiencias adicionales están integradas en `/space`: **Light Cone** (demoras luminosas), **Relay Rescue** (entrega por contactos), **Space Credits** (derechos de gasto preasignados) y **Signal Hunter** (espectros sintéticos). El atlas `/space/explore?lang=es` reúne 18 entradas con fuentes primarias, madurez y propuestas por desarrollar. Incluye SPICE, NOS3, Space ROS, ION/HDTN, LunaNet/Moonlight, Breakthrough Listen y pagos sin conexión. Descarga tarjeta PNG, pasaporte JSON y fragmento de contactos ION.

```sh
node packages/space-mission-lab/bin/cli.js frontier --locale=es --destination=proxima --conflict=1
```

`runFrontier(mission, config)` reutiliza `runMission`: cada observación ejecutada se convierte en mensaje de bytes decimales (`dataMb × 1 000 000`, mínimo un byte), disponible al inicio de la acción según el modelo existente. Las transmisiones del modelo de recursos siguen siendo independientes del nuevo experimento de red. Las huellas de entregas alimentan recibos. La huella canónica reutiliza `fingerprint` de Branch Lab; garantiza reproducibilidad, **no identidad ni firma**. El pasaporte incluye ajustes e idioma. Exportaciones adicionales: `lightCone`, `simulateRelay`, `exportIonContacts`, `reconcileCredits`, `syntheticSignals`, `searchSignals`, `dailyFrontier`, `frontierConfig`, `sharedFrontier`, `readSharedFrontier` y `spaceAtlas`.

Configuración estricta: `{destination:'mars', relayPolicy:'store-forward', outage:false, doubleSpend:false, seed:20261010, signalInjection:true, locale:'es'}`. Destinos `moon|mars|proxima`, estrategias `store-forward|immediate-direct`, semilla entera 0–4 294 967 295, opciones booleanas; claves desconocidas rechazadas. `lightCone` usa distancias fijas: 384 400 km, 150 millones de km ilustrativos y 4,25 años luz, con año juliano de 365,25 días. Origen temporal: 10 de octubre de 2026 a las 12:00 UTC. Proxima es hipotética: no se establece capacidad física del enlace. Una respuesta ideal vuelve tras 8,5 años.

`simulateRelay` acepta `{schemaVersion:1,nodes,contacts,bundles}`: 2–12 nodos, ≤96 contactos, ≤24 mensajes. Contactos `{id,from,to,start,end,rateBytesPerSec,latencySec,costUnits}`; mensajes `{id,from,to,createdAt,expiresAt,bytes,priority}`. Segundos finitos no negativos ≤10 000 millones, caudal entero 1–1 000 millones de bytes/s, coste entero 0–1 000 millones, mensaje entero 1–1 billón de bytes, prioridad 1–100. Prioridades descendentes reservan ventanas; búsqueda de primera llegada, sin fragmentación, almacenamiento ilimitado y canales independientes. La estrategia inmediata requiere contacto directo abierto al crear el mensaje, sin espera. Sin óptimo global, BPv7, radio real ni cola de almacenamiento finita. `outage` desactiva el contacto directo del escenario integrado. El fragmento ION redondea ventanas hacia dentro y demoras hacia arriba; hay que añadir nodos, transportes y pruebas en ION.

`reconcileCredits` recibe `{schemaVersion:1,accounts,grants,proofs,receipts}`: ≤20 cuentas y presupuestos, ≤24 pruebas, ≤48 recibos. Presupuestos reservados desde una cuenta; enteros monetarios de entrada ≤1 000 millones. Secuencias 1–48, pruebas SHA-256 deben coincidir con una entrega, y `reconcileAt` no puede precederla. Las ramas pueden aceptar provisionalmente sin conexión; no hay liquidación hasta llegar **todos los recibos declarados**, hipótesis de conjunto cerrado. Conflictos de secuencia o prueba ponen los presupuestos implicados en cuarentena. Duplicados ignorados, total cuentas + reservas conservado. `nowSec` controla solo conciliación; las aceptaciones locales representan el diario declarado, no compras realizadas en ese instante. Reservas restantes no reembolsadas automáticamente. Sin moneda real, consenso abierto, claves, firmas ni protección física contra clonación.

`searchSignals({on,off})` examina 2–16 imágenes, 4–128 casillas de frecuencia, potencias finitas 0–1 millón. Deriva entera de −2 a +2 por defecto; potencia ON media ≥8, interferencia rechazada si OFF ≥50 % de ON. Sin calibración estadística, datos astronómicos reales ni detección extraterrestre. El generador determinista inyecta deriva e interferencia común ON/OFF.

Los retos diarios derivan de una fecha válida `YYYY-MM-DD` mediante SHA-256; la interfaz usa la fecha de París. Los enlaces comparten **solo ajustes** y reproducen la misión de ejemplo, nunca JSON del usuario. Cambiar idioma conserva el informe y exportaciones en su idioma original; ejecutar de nuevo crea otro informe. El atlas se renderiza en el servidor con metadatos y alternativas FR/EN/ES. Estos mecanismos facilitan descubrimiento, retorno y compartir tras desplegar; **sin audiencia, publicación pública ni aumento de tráfico medido**. Integraciones físicas, lectores SETI y clasificaciones públicas siguen siendo propuestas explícitas del atlas. Fuentes de la ampliación consultadas el 10 de octubre de 2026.

### Contrato y modelo

Consulta [el JSON de demostración](fixtures/sample.json). `schemaVersion=1`, `id` es un identificador; `horizonSlots` vale 1–48 y `slotMinutes` 1–60. Máximo seis vehículos y 24 objetivos; identificadores únicos de 1–64 caracteres ASCII alfanuméricos, `_` o `-`. Todos los números deben ser finitos.

Cada vehículo define `batteryWh`, `batteryCapacityWh`, `reserveWh`, `baseLoadWh` y `rechargeWh` en Wh; `storageMb` y `storageCapacityMb` en MB decimales. Capacidades positivas, reserva ≤ batería inicial ≤ capacidad, almacenamiento inicial entre cero y capacidad. Cada valor está limitado a 1 000 000. `contacts` y `sunlight` contienen ventanas `{start,end}` en intervalos, con inicio incluido y fin excluido, dentro del horizonte.

Cada objetivo define `id`, `type` (`observe` o `downlink`), ventana `start/end`, `duration` entera positiva, `priority` entera de 1 a 100, `energyWh`, `dataMb` y lista `vehicleIds` de vehículos admisibles. Un programa contiene `{taskId,vehicleId,start}`, como máximo una vez por objetivo. La acción debe caber íntegramente en su ventana. Se rechazan valores negativos, ventanas imposibles, vehículos desconocidos y comandos duplicados.

Cada intervalo aplica recarga solar, límite de capacidad y consumo de base. Las acciones consumen toda su energía y añaden/retiran datos **al inicio**, y ocupan el vehículo durante su duración. Una transmisión exige una ventana de radio continua durante toda la acción. El sensor debe estar actualizado al iniciar una observación. Los invariantes cubren reserva energética, límites de almacenamiento, datos disponibles, radio, sensor y ausencia de solapamientos. El modelo excluye velocidad de radio, distancia, orientación, consumo continuo de las acciones y dinámica orbital.

El asignador procesa prioridades descendentes y después identificadores; elige el primer intervalo y vehículo cuya simulación siga siendo viable. Reevalúa todo el programa tras cada incorporación. La asignación puede quedar incompleta y **no es un óptimo global**. La simulación ejecuta el plan nominal con el fallo seleccionado; la propuesta de reasignación es una vista previa independiente, nunca se aplica automáticamente. El asistente usa reglas y referencias a eventos/muestras, sin LLM.

### Fallos, pruebas y límites

Opciones: `{locale:'es', policy:'guarded', fault:{kind:'nominal', start:0, vehicleId:'LUNA-A'}}`. Omitir `vehicleId` afecta a todos los vehículos. `link-outage` corta la radio desde `start`; `sensor-stale` invalida las mediciones; `low-power` reduce la batería en ese instante al menor valor entre el estado actual y `reserveWh + intervalos restantes × baseLoadWh + 1`, y desactiva la recarga. Los fallos se conocen durante la reproducción y la reasignación, incluida la comprobación de toda la duración de una transmisión. No modelan un descubrimiento tardío a bordo.

`guarded` bloquea acciones incompatibles. `unguarded` las ejecuta para revelar infracciones. Los fallos energéticos en reposo siguen siendo visibles con protecciones. La matriz reproduce el plan fijo en nominal y con tres fallos por vehículo desde el intervalo cero: siete escenarios en la demostración. Distingue invariantes cumplidos de objetivos ejecutados; siete escenarios sin infracciones no implican que todos los objetivos se hayan logrado. No es exhaustiva ni probabilística.

Los informes incluyen huellas SHA-256 de entrada, programa y traza. La huella de la traza excluye etiquetas traducidas para comparar idiomas; las huellas reflejan la serialización JSON aportada, sin canonicalización universal ni firmas. El navegador descarga las salidas localmente; la API no conserva los informes.

Esta alfa **todavía no integra GMAT, Basilisk, cFS/F´ ni un sistema terrestre real** y no califica software de vuelo. Posibles integraciones siguientes: [GMAT](https://software.nasa.gov/software/GSC-19640-1) para trayectorias, [Basilisk](https://hanspeterschaub.info/basilisk/) para el vehículo, [cFS](https://github.com/nasa/cFS) o [F´](https://fprime.jpl.nasa.gov/) para software embarcado, [Yamcs](https://yamcs.org/) para telemetría y [PlanDev](https://github.com/NASA-AMMOS/plandev) para actividades. Referencias consultadas el 9 de octubre de 2026.

MIT — [LICENSE](LICENSE).

## FR — SOTA+++ : trois commons exécutables

`/space/commons/benchmark`, `/space/commons/market` et `/space/commons/citizen` utilisent des moteurs installés dans `.local/space-runtime` : Basilisk 2.12.0, Orekit 13.1.9, SGP4 2.25, SpiceyPy 8.2.0, OR-Tools 9.15.6755, ION 4.2.0, blimpy 2.1.4 et turboSETI 2.3.2 sur CPU. Aucun résultat simulé ne remplace un moteur manquant. Les cas publiés sont des calculs enregistrés ; la relecture est explicitement distinguée d’une nouvelle exécution.

- **Mission Benchmark Commons** : mêmes états initiaux, gravité et axes inertiels fixes ; erreur Basilisk RK4/Orekit KeplerianPropagator, énergie et résidu SGP4 ou JPL DE440s séparés. Profils ISS sur 3 h et Lune sur 24 h, pas 10/30/60/120 s, seuil pédagogique 100 m. Les perturbations absentes du modèle à deux corps expliquent une partie du résidu ; ce n’est pas une qualification de vol.
- **Contact Market** : fenêtres ISS issues du TLE archivé le 10 octobre 2026, coordonnées urbaines WGS84, rotation GMST, seuil 10°, échantillonnage conservateur 30 s. La conversion TEME/rotation est approximative, sans correction polaire ni réfraction. Antennes, débits, valeurs et crédits sont des hypothèses. CP-SAT maximise la valeur, puis minimise le coût, avec budget, échéances et antenne unique ; le statut et la borne sont exposés. Comparaison avec premier arrivé, premier servi. Deux nœuds ION transmettent le manifeste par BPv7/UDP sur localhost. Les SHA-256 reçus sont vérifiés avant de signer un reçu local Ed25519. Aucun paiement réel, identité certifiée ou transfert radio des mégaoctets du scénario n’est revendiqué.
- **Citizen Mission** : fichier radio public Voyager 1/GBT lu par blimpy et recherche Doppler réelle turboSETI, SNR 10/25/50, dérive ±1 ou ±4 Hz/s. Spectrogramme à maximum par bin pour l’affichage, recherche sur les canaux d’origine. Sonde humaine connue ; aucune observation OFF dans ce jeu de données, aucune conclusion extraterrestre.

Les défis quotidiens UTC parcourent un catalogue fini de configurations des données archivées ; aucune nouvelle observation n’est collectée chaque jour. URL `commons-v1` avec paramètres bornés, prédiction chiffrée, historique local, preuves JSON et cartes PNG en FR/EN/ES. Les preuves exposent les versions, paramètres, empreintes et hypothèses. Le navigateur vérifie leur empreinte et la signature des reçus ; cette signature utilise une clé locale sans certification d’identité. L’édition statique rejoue uniquement les cas enregistrés, sans API locale ni mesure automatique de trafic.

Installation depuis la racine du dépôt : Python 3.11–3.13, curl, compilateur C, make, autoconf et libtool ; JDK 17+ sur Linux, téléchargé automatiquement sur macOS ARM. `SPACE_PYTHON`, `SPACE_JAVA` et `SPACE_JAVAC` peuvent fournir les exécutables. Les dépendances Python sont contraintes par `engines/requirements.lock.txt`. Données et archives sont épinglées dans `engines/datasets.json` et `engines/toolchain.json`. Les binaires et grands fichiers ne sont pas distribués dans le paquet npm. Les outils de compilation doivent déjà exister ; aucun réglage système de mémoire partagée n’est modifié. ION utilise des clés et répertoires propres au calcul, puis un arrêt par nœud.

```bash
npm run space:setup
npm run space:test:engines
npm run space:fixtures
npm run space:public
# Origine HTTPS facultative pour un sitemap avec URL absolues :
SPACE_PUBLIC_ORIGIN=https://example.org npm run space:public
```

L’export `output/space-public` est prêt pour un hébergeur statique à la racine d’un domaine. Les pages FR/EN/ES ont leurs propres chemins, liens alternatifs et métadonnées. Sans origine fournie, aucun domaine public n’est inventé. Le TLE archivé garantit la reproductibilité ; il ne représente pas une prédiction en temps réel. Le fichier Voyager est fourni en HTTP par son hébergeur historique : empreinte épinglée, sans signature scientifique indépendante. Respecter les conditions des fournisseurs avant toute redistribution de données brutes ; l’export inclut des résultats dérivés, pas les fichiers H5 ou SPK.

## EN — SOTA+++: three executable commons

`/space/commons/benchmark`, `/space/commons/market` and `/space/commons/citizen` use engines installed in `.local/space-runtime`: Basilisk 2.12.0, Orekit 13.1.9, SGP4 2.25, SpiceyPy 8.2.0, OR-Tools 9.15.6755, ION 4.2.0, blimpy 2.1.4 and turboSETI 2.3.2 on CPU. No simulated result replaces a missing engine. Published cases are recorded computations; replay is explicitly distinguished from fresh execution.

- **Mission Benchmark Commons**: shared initial states, gravity and fixed inertial axes; separate Basilisk RK4/Orekit KeplerianPropagator error, energy and SGP4 or JPL DE440s residual. ISS over 3 h and Moon over 24 h, steps 10/30/60/120 s, educational 100 m threshold. Perturbations absent from the two-body model explain part of the residual; this is not flight qualification.
- **Contact Market**: ISS windows from the TLE archived October 10, 2026, WGS84 city coordinates, GMST rotation, 10° threshold and conservative 30 s sampling. TEME/rotation conversion is approximate, without polar motion or refraction correction. Antennas, rates, values and credits are assumptions. CP-SAT maximizes value, then minimizes cost, with budget, deadlines and one antenna; status and bound are exposed. Comparison with first-come-first-served. Two ION nodes transmit the manifest over localhost BPv7/UDP. Received SHA-256 hashes are checked before signing a local Ed25519 receipt. No real payment, certified identity or radio transfer of scenario megabytes is claimed.
- **Citizen Mission**: public Voyager 1/GBT radio file read with blimpy and actual turboSETI Doppler search, SNR 10/25/50, drift ±1 or ±4 Hz/s. Maximum-per-bin waterfall for display, search on original channels. Known human spacecraft; no OFF observation in this dataset and no extraterrestrial conclusion.

Daily UTC challenges rotate through a finite catalog of archived-data configurations; no new observation is collected each day. `commons-v1` URLs with bounded parameters, numerical prediction, local history, JSON evidence and PNG cards in FR/EN/ES. Evidence exposes versions, parameters, hashes and assumptions. The browser verifies its hash and receipt signatures; the signature uses a local key without identity certification. The static edition replays only recorded cases, without local APIs or automatic traffic measurement.

Setup from the repository root: Python 3.11–3.13, curl, C compiler, make, autoconf and libtool; JDK 17+ on Linux, automatically downloaded on macOS ARM. `SPACE_PYTHON`, `SPACE_JAVA` and `SPACE_JAVAC` may supply executable paths. Python dependencies are constrained by `engines/requirements.lock.txt`. Data and archives are pinned in `engines/datasets.json` and `engines/toolchain.json`. Binaries and large datasets are not distributed in the npm package. Build tools must already exist; no system shared-memory settings are changed. ION uses computation-owned keys and directories, followed by node-only shutdown.

```bash
npm run space:setup
npm run space:test:engines
npm run space:fixtures
npm run space:public
# Optional HTTPS origin for a sitemap with absolute URLs:
SPACE_PUBLIC_ORIGIN=https://example.org npm run space:public
```

The `output/space-public` export is ready for a static host at a domain root. FR/EN/ES pages have separate paths, alternate links and metadata. Without an origin, no public domain is invented. The archived TLE provides reproducibility, not real-time prediction. The Voyager file is supplied over HTTP by its historical host: pinned hash, without an independent scientific signature. Follow providers’ terms before redistributing raw data; the export contains derived results, not H5 or SPK files.

## ES — SOTA+++: tres commons ejecutables

`/space/commons/benchmark`, `/space/commons/market` y `/space/commons/citizen` usan motores instalados en `.local/space-runtime`: Basilisk 2.12.0, Orekit 13.1.9, SGP4 2.25, SpiceyPy 8.2.0, OR-Tools 9.15.6755, ION 4.2.0, blimpy 2.1.4 y turboSETI 2.3.2 en CPU. Ningún resultado simulado sustituye un motor ausente. Los casos publicados son cálculos guardados; la reproducción se distingue explícitamente de una nueva ejecución.

- **Mission Benchmark Commons**: estados iniciales, gravedad y ejes inerciales fijos comunes; error Basilisk RK4/Orekit KeplerianPropagator, energía y residuo SGP4 o JPL DE440s separados. ISS durante 3 h y Luna durante 24 h, pasos 10/30/60/120 s, umbral educativo de 100 m. Las perturbaciones ausentes del modelo de dos cuerpos explican parte del residuo; no es certificación de vuelo.
- **Contact Market**: ventanas ISS del TLE archivado el 10 de octubre de 2026, coordenadas urbanas WGS84, rotación GMST, umbral 10° y muestreo conservador de 30 s. La conversión TEME/rotación es aproximada, sin corrección polar ni refracción. Antenas, tasas, valores y créditos son supuestos. CP-SAT maximiza valor y después minimiza coste, con presupuesto, plazos y una antena; se muestran estado y cota. Comparación con orden de llegada. Dos nodos ION transmiten el manifiesto por BPv7/UDP en localhost. Se verifican los SHA-256 recibidos antes de firmar un recibo local Ed25519. No se afirma pago real, identidad certificada ni transferencia de radio de los megabytes del escenario.
- **Citizen Mission**: archivo público de radio Voyager 1/GBT leído con blimpy y búsqueda Doppler real turboSETI, SNR 10/25/50, deriva ±1 o ±4 Hz/s. Espectrograma con máximo por bin para mostrar, búsqueda en canales originales. Sonda humana conocida; sin observación OFF en el conjunto ni conclusión extraterrestre.

Los desafíos diarios UTC recorren un catálogo finito de configuraciones de datos archivados; no se recoge una nueva observación cada día. URL `commons-v1` con parámetros limitados, predicción numérica, historial local, pruebas JSON y tarjetas PNG en FR/EN/ES. Las pruebas muestran versiones, parámetros, huellas y supuestos. El navegador verifica su huella y firmas de recibos; la firma usa una clave local sin certificación de identidad. La edición estática solo reproduce casos guardados, sin API locales ni medición automática de tráfico.

Instalación desde la raíz del repositorio: Python 3.11–3.13, curl, compilador C, make, autoconf y libtool; JDK 17+ en Linux, descargado automáticamente en macOS ARM. `SPACE_PYTHON`, `SPACE_JAVA` y `SPACE_JAVAC` permiten indicar ejecutables. Las dependencias Python están limitadas por `engines/requirements.lock.txt`. Datos y archivos están fijados en `engines/datasets.json` y `engines/toolchain.json`. Los binarios y grandes conjuntos no se distribuyen en el paquete npm. Las herramientas de compilación deben existir; no se cambian parámetros del sistema de memoria compartida. ION usa claves y directorios propios del cálculo, seguidos de apagado por nodo.

```bash
npm run space:setup
npm run space:test:engines
npm run space:fixtures
npm run space:public
# Origen HTTPS opcional para un sitemap con URL absolutas:
SPACE_PUBLIC_ORIGIN=https://example.org npm run space:public
```

El export `output/space-public` está listo para alojamiento estático en la raíz de un dominio. Las páginas FR/EN/ES tienen rutas propias, enlaces alternativos y metadatos. Sin origen, no se inventa un dominio público. El TLE archivado permite reproducción, no predicción en tiempo real. El archivo Voyager se ofrece por HTTP en su servidor histórico: huella fijada, sin firma científica independiente. Respetar condiciones de proveedores antes de redistribuir datos brutos; el export incluye resultados derivados, no archivos H5 ni SPK.
