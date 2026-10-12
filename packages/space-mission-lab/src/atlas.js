// Primary-source summaries; maturity describes the cited capability, not every project deployment.
export const reviewedAt = '2026-10-10';
export const atlasEntries = [
  {
    id: 'spice',
    name: 'SPICE / NAIF',
    stage: 'available',
    category: 'flight',
    text: [
      'Éphémérides, repères et géométrie d’observation NASA/JPL. Essentiel pour calculer des contacts à partir de positions réelles au lieu de fenêtres inventées.',
      'NASA/JPL ephemerides, reference frames and observation geometry. Essential for deriving contacts from real positions instead of invented windows.',
      'Efemérides, marcos de referencia y geometría de observación NASA/JPL. Esencial para derivar contactos de posiciones reales en vez de ventanas inventadas.',
    ],
    sources: [['NASA/JPL NAIF', 'https://naif.jpl.nasa.gov/naif/']],
  },
  {
    id: 'nos3',
    name: 'NOS3',
    stage: 'available',
    category: 'operations',
    text: [
      'Environnement NASA de développement, intégration, formation et validation, avec modèles logiciels du matériel et simulations dynamiques. Une piste pour des essais plus proches d’un véhicule complet.',
      'NASA environment for development, integration, training and validation, with software hardware models and dynamics simulations. A path toward testing a more complete vehicle.',
      'Entorno NASA de desarrollo, integración, formación y validación, con modelos de hardware y simulación dinámica. Vía para probar un vehículo más completo.',
    ],
    sources: [['NASA NOS3', 'https://github.com/nasa/nos3']],
  },
  {
    id: 'spaceros',
    name: 'Space ROS',
    stage: 'development',
    category: 'flight',
    text: [
      'Cadriciel ouvert de robotique spatiale basé sur ROS, visant des processus et artefacts compatibles avec les exigences aérospatiales. L’objectif de certification ne qualifie pas automatiquement un robot.',
      'Open ROS-based space robotics framework targeting processes and artifacts aligned with aerospace requirements. A certification goal does not automatically qualify a robot.',
      'Marco abierto de robótica espacial basado en ROS, orientado a procesos y artefactos compatibles con requisitos aeroespaciales. El objetivo de certificación no cualifica automáticamente un robot.',
    ],
    sources: [['Space ROS', 'https://space.ros.org/']],
  },
  {
    id: 'gmat',
    name: 'GMAT / Orekit / Tudat / Basilisk',
    stage: 'available',
    category: 'flight',
    text: [
      'Trajectoires, mécanique orbitale, navigation et simulation dynamique. À connecter au lab pour remplacer ses ressources par créneaux par une simulation physique.',
      'Trajectories, orbital mechanics, navigation and dynamics simulation. Connect to the lab to replace time-slot resources with physical simulation.',
      'Trayectorias, mecánica orbital, navegación y simulación dinámica. Conectar al laboratorio para sustituir recursos por intervalos por simulación física.',
    ],
    sources: [
      ['GMAT', 'https://software.nasa.gov/software/GSC-19640-1'],
      ['Orekit', 'https://www.orekit.org/'],
      ['Tudat', 'https://docs.tudat.space/en/latest/'],
      ['Basilisk', 'https://hanspeterschaub.info/basilisk/'],
    ],
  },
  {
    id: 'flight',
    name: 'cFS / F´',
    stage: 'available',
    category: 'flight',
    text: [
      'Architectures embarquées modulaires pour le logiciel de vol. Elles apportent des composants réutilisables ; la qualification dépend du matériel et de la mission.',
      'Modular flight-software architectures. They provide reusable components; qualification depends on hardware and mission.',
      'Arquitecturas modulares de software de vuelo. Aportan componentes reutilizables; la cualificación depende del hardware y la misión.',
    ],
    sources: [
      ['NASA cFS', 'https://github.com/nasa/cFS'],
      ['F´ projects', 'https://fprime.jpl.nasa.gov/overview/projects/'],
    ],
  },
  {
    id: 'operations',
    name: 'Open MCT / PlanDev / SeqDev',
    stage: 'available',
    category: 'operations',
    text: [
      'Télémesure web, modèles de mission et séquences opérationnelles. PlanDev est le nouveau nom d’Aerie ; ces outils structurent les opérations au sol.',
      'Web telemetry, mission models and operational sequences. PlanDev is the new name of Aerie; these tools structure ground operations.',
      'Telemetría web, modelos de misión y secuencias operativas. PlanDev es el nuevo nombre de Aerie; estas herramientas estructuran las operaciones terrestres.',
    ],
    sources: [
      ['Open MCT', 'https://nasa.github.io/openmct/'],
      ['PlanDev', 'https://github.com/NASA-AMMOS/plandev'],
      ['AMMOS', 'https://ammos.nasa.gov/'],
    ],
  },
  {
    id: 'control',
    name: 'Yamcs / OpenC3 COSMOS',
    stage: 'available',
    category: 'operations',
    text: [
      'Réception, archivage et visualisation de télémesure, télécommandes et procédures. Points d’intégration possibles pour une console de mission.',
      'Telemetry reception, archiving and visualization, telecommands and procedures. Possible integration points for a mission console.',
      'Recepción, archivo y visualización de telemetría, telecomandos y procedimientos. Posibles integraciones para una consola de misión.',
    ],
    sources: [
      ['Yamcs', 'https://yamcs.org/'],
      ['OpenC3', 'https://openc3.com/'],
    ],
  },
  {
    id: 'commercial',
    name: 'STK / FreeFlyer / MONTE',
    stage: 'available',
    category: 'flight',
    text: [
      'Outils professionnels d’analyse de mission et de navigation. Accès et licences diffèrent ; logiciel spécialisé ne signifie pas code libre.',
      'Professional mission-analysis and navigation tools. Access and licenses differ; specialized software does not imply open source.',
      'Herramientas profesionales de análisis de misión y navegación. Acceso y licencias varían; software especializado no implica código abierto.',
    ],
    sources: [
      ['STK', 'https://space.ansys.com/plan-the-mission'],
      ['FreeFlyer', 'https://ai-solutions.com/freeflyer-features/'],
      ['MONTE', 'https://montepy.jpl.nasa.gov/'],
    ],
  },
  {
    id: 'ion',
    name: 'ION-DTN / Bundle Protocol v7',
    stage: 'available',
    category: 'communications',
    text: [
      'Messages conservés puis transmis selon les contacts disponibles. ION implémente des protocoles DTN ; BPv7 est normalisé. Une bibliothèque réelle à éprouver après le simulateur pédagogique.',
      'Messages stored then forwarded through available contacts. ION implements DTN protocols; BPv7 is standardized. A real library to exercise after the educational simulator.',
      'Mensajes almacenados y reenviados según los contactos disponibles. ION implementa protocolos DTN; BPv7 está normalizado. Biblioteca real que probar tras el simulador educativo.',
    ],
    sources: [
      ['ION-DTN', 'https://github.com/nasa-jpl/ION-DTN'],
      ['RFC 9171', 'https://www.rfc-editor.org/rfc/rfc9171.html'],
    ],
  },
  {
    id: 'hdtn',
    name: 'HDTN',
    stage: 'available',
    category: 'communications',
    text: [
      'Pipeline NASA pour ingestion, stockage, routage et sortie de messages DTN à haut débit. Augmente le débit de traitement, sans réduire le temps de propagation de la lumière.',
      'NASA pipeline for high-throughput DTN ingestion, storage, routing and egress. Increases processing throughput without reducing light propagation time.',
      'Pipeline NASA para ingestión, almacenamiento, encaminamiento y salida DTN de alto caudal. Aumenta el procesamiento sin reducir el tiempo de propagación de la luz.',
    ],
    sources: [['NASA HDTN', 'https://github.com/nasa/HDTN']],
  },
  {
    id: 'lunanet',
    name: 'LunaNet / Moonlight',
    stage: 'development',
    category: 'communications',
    text: [
      'Spécification d’interopérabilité lunaire NASA/ESA/JAXA et infrastructure de communication-navigation en développement chez ESA. Une base pour des services lunaires, pas un réseau interstellaire opérationnel.',
      'NASA/ESA/JAXA lunar interoperability specification and ESA communication-navigation infrastructure under development. A basis for lunar services, not an operational interstellar network.',
      'Especificación de interoperabilidad lunar NASA/ESA/JAXA e infraestructura ESA de comunicación-navegación en desarrollo. Base para servicios lunares, no red interestelar operativa.',
    ],
    sources: [
      [
        'LunaNet',
        'https://www.nasa.gov/directorates/somd/space-communications-navigation-program/lunanet-interoperability-specification/',
      ],
      [
        'Moonlight',
        'https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Moonlight2',
      ],
    ],
  },
  {
    id: 'dsoc',
    name: 'Deep Space Optical Communications',
    stage: 'demonstrated',
    category: 'communications',
    text: [
      'Démonstration de liaison optique NASA : 267 Mbit/s à 31 millions de km en décembre 2023. Le terminal et le canal physique restent distincts du logiciel et de la latence.',
      'NASA optical-link demonstration: 267 Mbit/s at 31 million km in December 2023. The terminal and physical channel remain separate from software and latency.',
      'Demostración óptica NASA: 267 Mbit/s a 31 millones de km en diciembre de 2023. Terminal y canal físico siguen siendo distintos del software y la latencia.',
    ],
    sources: [
      [
        'NASA/JPL DSOC',
        'https://www.jpl.nasa.gov/missions/deep-space-optical-communications-dsoc/',
      ],
    ],
  },
  {
    id: 'ground',
    name: 'SatNOGS / gr-satellites',
    stage: 'available',
    category: 'communications',
    text: [
      'Réseau participatif de stations au sol et décodeurs GNU Radio pour satellites. Porte d’entrée pour observations, contributions et ateliers communautaires.',
      'Participatory ground-station network and GNU Radio satellite decoders. Entry point for observations, contributions and community workshops.',
      'Red participativa de estaciones terrestres y decodificadores GNU Radio para satélites. Entrada a observaciones, contribuciones y talleres comunitarios.',
    ],
    sources: [
      ['SatNOGS', 'https://satnogs.org/'],
      ['gr-satellites', 'https://github.com/daniestevez/gr-satellites'],
    ],
  },
  {
    id: 'seti',
    name: 'blimpy / turboSETI / hyperseti / BLIPSS',
    stage: 'research',
    category: 'signals',
    text: [
      'Pipelines Breakthrough Listen : lecture de données, dérives Doppler, recherche accélérée et signaux périodiques. Ce sont des outils de recherche de technosignatures ; une détection candidate doit être validée.',
      'Breakthrough Listen pipelines: data loading, Doppler drift, accelerated searches and periodic signals. Technosignature research tools; candidate detections require validation.',
      'Pipelines Breakthrough Listen: lectura de datos, deriva Doppler, búsqueda acelerada y señales periódicas. Herramientas de investigación de tecnofirmas; los candidatos requieren validación.',
    ],
    sources: [
      ['blimpy', 'https://github.com/UCBerkeleySETI/blimpy'],
      ['turboSETI', 'https://github.com/UCBerkeleySETI/turbo_seti'],
      ['hyperseti', 'https://github.com/UCBerkeleySETI/hyperseti'],
      ['BLIPSS', 'https://seti.berkeley.edu/blipss/'],
    ],
  },
  {
    id: 'proxima',
    name: 'Proxima Centauri',
    stage: 'hypothetical',
    category: 'communications',
    text: [
      'À environ 4,25 années-lumière, une réponse implique au moins 8,5 ans aller-retour dans le modèle fixe. Aucun logiciel ne supprime cette limite ; capacité et énergie d’une liaison restent à établir.',
      'At about 4.25 light-years, a reply implies at least 8.5 years round trip in the fixed model. Software cannot remove this limit; link capacity and energy remain to be established.',
      'A unos 4,25 años luz, una respuesta implica al menos 8,5 años de ida y vuelta en el modelo fijo. El software no elimina este límite; faltan capacidad y energía del enlace.',
    ],
    sources: [
      [
        'NASA: nearest stars',
        'https://science.nasa.gov/exoplanets/other-stars-other-worlds/our-nearest-celestial-neighbor-an-exotic-3-star-system/',
      ],
    ],
  },
  {
    id: 'offline',
    name: 'BIS Project Polaris / offline payments',
    stage: 'research',
    category: 'economy',
    text: [
      'Les paiements hors ligne terrestres éclairent budgets locaux, sécurité des terminaux et doubles dépenses. Aucun standard de monnaie interstellaire opérationnelle identifié dans les sources examinées.',
      'Terrestrial offline payments inform local budgets, device security and double spending. No operational interstellar-currency standard identified in the examined sources.',
      'Los pagos terrestres sin conexión orientan presupuestos locales, seguridad de terminales y dobles gastos. No se identificó un estándar operativo de moneda interestelar en las fuentes consultadas.',
    ],
    sources: [
      [
        'BIS Polaris',
        'https://www.bis.org/publications/project-polaris-handbook-offline-payments-cbdc',
      ],
    ],
  },
  {
    id: 'escrow',
    name: 'Escrow / bounded counters',
    stage: 'research',
    category: 'economy',
    text: [
      'Des droits de dépense préalloués permettent de préserver un invariant numérique pendant une partition réseau. La publication concerne les bases distribuées, pas une monnaie spatiale déjà déployée.',
      'Preallocated spending rights can preserve numeric invariants during network partitions. The publication concerns distributed databases, not a deployed space currency.',
      'Derechos de gasto preasignados pueden preservar invariantes numéricos durante particiones de red. La publicación trata bases distribuidas, no moneda espacial desplegada.',
    ],
    sources: [['Numeric invariants, SRDS 2015', 'https://arxiv.org/abs/1503.09052']],
  },
  {
    id: 'localfirst',
    name: 'Automerge / IPFS',
    stage: 'available',
    category: 'economy',
    text: [
      'Fusion de documents hors ligne et adressage de contenus. Utile pour journaux et preuves reproductibles ; ni finalité financière ni transport spatial DTN ne sont automatiques.',
      'Offline document merging and content addressing. Useful for journals and reproducible evidence; financial finality and space DTN transport are not automatic.',
      'Fusión de documentos sin conexión y direccionamiento de contenidos. Útil para diarios y pruebas reproducibles; finalidad financiera y transporte espacial DTN no son automáticos.',
    ],
    sources: [
      ['Automerge', 'https://automerge.org/docs/hello/'],
      ['IPFS', 'https://docs.ipfs.tech/concepts/what-is-ipfs/'],
    ],
  },
];
export const atlasIdeas = [
  {
    name: 'Light Cone / Relay Rescue',
    state: 'built',
    text: [
      'Voyez une réponse revenir en 2035 ; sauvez les observations malgré une liaison coupée. Défi quotidien déterministe et URL de scénario partageable.',
      'See a reply return in 2035; rescue observations despite a broken link. Deterministic daily challenge and shareable scenario URL.',
      'Ve una respuesta regresar en 2035; rescata observaciones pese a un enlace cortado. Reto diario determinista y URL de escenario compartible.',
    ],
  },
  {
    name: 'Space Credits / Signal Hunter',
    state: 'built',
    text: [
      'Déclenchez une double dépense, inspectez les reçus et distinguez une dérive synthétique d’une interférence. Passeport de mission exportable avec empreintes.',
      'Trigger double spending, inspect receipts and distinguish synthetic drift from interference. Exportable mission passport with fingerprints.',
      'Provoca un doble gasto, inspecciona recibos y distingue deriva sintética de interferencia. Pasaporte de misión exportable con huellas.',
    ],
  },
  {
    name: 'Mission Benchmark Commons',
    state: 'built',
    href: '/space/commons/benchmark',
    repository: 'https://github.com/gbesse/mission-benchmark-commons',
    text: [
      'Basilisk 2.12 et Orekit 13.1.9 exécutés sur les mêmes états ISS/SGP4 ou Lune/JPL DE440s. Écarts numériques, résidus du modèle, énergie, versions et SHA-256. Défis de précision partageables.',
      'Basilisk 2.12 and Orekit 13.1.9 executed on shared ISS/SGP4 or Moon/JPL DE440s states. Numerical differences, model residuals, energy, versions and SHA-256. Shareable accuracy challenges.',
      'Basilisk 2.12 y Orekit 13.1.9 ejecutados con estados comunes ISS/SGP4 o Luna/JPL DE440s. Diferencias numéricas, residuos del modelo, energía, versiones y SHA-256. Desafíos de precisión compartibles.',
    ],
  },
  {
    name: 'Contact Market / Science Bounties',
    state: 'built',
    href: '/space/commons/market',
    repository: 'https://github.com/gbesse/contact-market',
    text: [
      'Contacts ISS calculés par SGP4, calendrier optimisé par OR-Tools CP-SAT et comparé à une stratégie premier arrivé, premier servi. ION BPv7/UDP transporte un manifeste sur localhost ; reçu Ed25519 local. Crédits fictifs.',
      'ISS contacts computed with SGP4, schedule optimized with OR-Tools CP-SAT and compared to first-come-first-served. ION BPv7/UDP transports a manifest on localhost; local Ed25519 receipt. Fictional credits.',
      'Contactos ISS calculados con SGP4, calendario optimizado con OR-Tools CP-SAT y comparado con orden de llegada. ION BPv7/UDP transporta un manifiesto por localhost; recibo Ed25519 local. Créditos ficticios.',
    ],
  },
  {
    name: 'Citizen Mission / SETI Replay',
    state: 'built',
    href: '/space/commons/citizen',
    repository: 'https://github.com/gbesse/citizen-mission',
    text: [
      'Observation réelle publique Voyager 1/GBT : blimpy lit le fichier et turboSETI cherche la dérive Doppler sur CPU. Spectrogramme, porteuse, provenance et défi de prédiction. Sonde humaine connue ; aucune observation OFF disponible.',
      'Real public Voyager 1/GBT observation: blimpy reads the file and turboSETI searches Doppler drift on CPU. Waterfall, carrier, provenance and prediction challenge. Known human spacecraft; no OFF observation available.',
      'Observación real pública Voyager 1/GBT: blimpy lee el archivo y turboSETI busca deriva Doppler en CPU. Espectrograma, portadora, procedencia y desafío de predicción. Sonda humana conocida; sin observación OFF disponible.',
    ],
  },
];
export function spaceAtlas(locale = 'fr') {
  if (!['fr', 'en', 'es'].includes(locale)) locale = 'fr';
  const index = { fr: 0, en: 1, es: 2 }[locale];
  return {
    reviewedAt,
    locale,
    entries: atlasEntries.map(({ text, ...item }) => ({ ...item, text: text[index] })),
    ideas: atlasIdeas.map(({ text, ...item }) => ({ ...item, text: text[index] })),
  };
}
