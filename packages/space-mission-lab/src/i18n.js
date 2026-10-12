export const messages = {
  frontierInvalid: [
    'Paramètres invalides pour cette expérience spatiale.',
    'Invalid parameters for this space experiment.',
    'Parámetros no válidos para este experimento espacial.',
  ],
  moon: ['Lune', 'Moon', 'Luna'],
  mars: ['Mars', 'Mars', 'Marte'],
  proxima: ['Proxima Centauri', 'Proxima Centauri', 'Proxima Centauri'],
  lightNotice: [
    'Distances fixes : Lune moyenne, Mars illustratif à 150 millions de km, Proxima à 4,25 années-lumière. Dates depuis le 10 octobre 2026 à 12 h UTC ; réponse immédiate idéale, sans mouvement ni attente de contact.',
    'Fixed distances: mean Moon, illustrative Mars at 150 million km, Proxima at 4.25 light-years. Dates from October 10, 2026 at 12:00 UTC; ideal immediate reply, no motion or contact waiting.',
    'Distancias fijas: Luna media, Marte ilustrativo a 150 millones de km, Proxima a 4,25 años luz. Fechas desde el 10 de octubre de 2026 a las 12:00 UTC; respuesta inmediata ideal, sin movimiento ni espera de contacto.',
  ],
  relayNotice: [
    'Simulation de contacts dirigés : débit, capacité, délai, attente et expiration. Messages non fragmentés, stockage illimité, canaux indépendants ; aucune exécution BPv7 réelle.',
    'Directed contact simulation: rate, capacity, delay, waiting and expiry. Unfragmented messages, unlimited storage, independent channels; no actual BPv7 execution.',
    'Simulación de contactos dirigidos: caudal, capacidad, demora, espera y caducidad. Mensajes sin fragmentar, almacenamiento ilimitado, canales independientes; sin ejecución real de BPv7.',
  ],
  ionNotice: [
    'Fragment de contacts ION : fenêtres arrondies vers l’intérieur, délais arrondis vers le haut. Initialisation des nœuds et transports à ajouter ; export non testé dans ION.',
    'ION contact fragment: windows rounded inward, delays rounded up. Node and transport initialization must be added; export untested in ION.',
    'Fragmento de contactos ION: ventanas redondeadas hacia dentro, demoras hacia arriba. Hay que añadir la inicialización de nodos y transportes; exportación no probada en ION.',
  ],
  creditsNotice: [
    'Crédits fictifs préalloués. Règlement après arrivée de tous les reçus déclarés ; conflits mis en quarantaine. SHA-256 assure la cohérence des traces, pas l’identité. Aucune monnaie, signature, finalité ouverte ou protection matérielle contre le clonage.',
    'Fictional preallocated credits. Settlement after all declared receipts arrive; conflicts quarantined. SHA-256 ensures trace consistency, not identity. No currency, signatures, open-world finality or hardware protection against cloning.',
    'Créditos ficticios preasignados. Liquidación tras llegar todos los recibos declarados; conflictos en cuarentena. SHA-256 garantiza la coherencia de trazas, no la identidad. Sin moneda, firmas, finalidad abierta ni protección física contra la clonación.',
  ],
  signalsNotice: [
    'Spectres entièrement synthétiques ON/OFF, recherche de dérive entière et rejet d’interférences communes. Aucun signal réel, seuil statistique calibré ou preuve extraterrestre.',
    'Entirely synthetic ON/OFF spectra, integer drift search and shared interference rejection. No real signal, calibrated statistical threshold or extraterrestrial evidence.',
    'Espectros completamente sintéticos ON/OFF, búsqueda de deriva entera y rechazo de interferencias comunes. Sin señal real, umbral estadístico calibrado ni prueba extraterrestre.',
  ],
  delivered: ['Livré', 'Delivered', 'Entregado'],
  unreachable: [
    'Aucun trajet avant expiration',
    'No route before expiry',
    'Sin ruta antes de caducar',
  ],
  pending: [
    'Acceptation locale provisoire',
    'Tentative local acceptance',
    'Aceptación local provisional',
  ],
  tentative: [
    'Acceptation locale provisoire',
    'Tentative local acceptance',
    'Aceptación local provisional',
  ],
  settled: ['Réconcilié dans le modèle', 'Reconciled in the model', 'Conciliado en el modelo'],
  conflict: [
    'Conflit : budget en quarantaine',
    'Conflict: budget quarantined',
    'Conflicto: presupuesto en cuarentena',
  ],
  duplicate: ['Doublon ignoré', 'Duplicate ignored', 'Duplicado ignorado'],
  'invalid-proof': ['Preuve invalide', 'Invalid proof', 'Prueba no válida'],
  'budget-blocked': [
    'Budget ou séquence bloquée',
    'Budget or sequence blocked',
    'Presupuesto o secuencia bloqueados',
  ],
  interference: [
    'Interférence commune ON/OFF',
    'Shared ON/OFF interference',
    'Interferencia común ON/OFF',
  ],
  'synthetic-candidate': ['Candidat synthétique', 'Synthetic candidate', 'Candidato sintético'],
  notice: [
    'Modèle synthétique de ressources par créneaux ; aucune dynamique orbitale ni commande réelle. Assistant à règles, allocation gloutonne ; validation limitée aux scénarios déclarés.',
    'Synthetic resource model by time slot; no orbital dynamics or real commands. Rule-based assistant, greedy allocation; validation limited to declared scenarios.',
    'Modelo sintético de recursos por intervalos; sin dinámica orbital ni comandos reales. Asistente basado en reglas, asignación voraz; validación limitada a los escenarios declarados.',
  ],
  invalid: [
    'Mission, programme ou options invalides. Consultez le contrat du README.',
    'Invalid mission, schedule or options. See the README contract.',
    'Misión, programa u opciones no válidos. Consulta el contrato del README.',
  ],
  nominal: ['Sans panne', 'No fault', 'Sin fallo'],
  'link-outage': ['Liaison indisponible', 'Link unavailable', 'Enlace no disponible'],
  'low-power': ['Énergie réduite', 'Reduced power', 'Energía reducida'],
  'sensor-stale': ['Capteur périmé', 'Stale sensor', 'Sensor desactualizado'],
  POWER: [
    'Réserve énergétique insuffisante',
    'Insufficient power reserve',
    'Reserva energética insuficiente',
  ],
  STORAGE: [
    'Capacité de stockage dépassée',
    'Storage capacity exceeded',
    'Capacidad de almacenamiento superada',
  ],
  DATA: [
    'Données insuffisantes pour la transmission',
    'Insufficient data for downlink',
    'Datos insuficientes para transmitir',
  ],
  CONTACT: [
    'Fenêtre radio indisponible',
    'Radio window unavailable',
    'Ventana de radio no disponible',
  ],
  SENSOR: [
    'Mesure de capteur périmée',
    'Stale sensor measurement',
    'Medición del sensor desactualizada',
  ],
  CONFLICT: ['Engin déjà occupé', 'Vehicle already busy', 'Vehículo ya ocupado'],
  observe: ['Observation', 'Observation', 'Observación'],
  downlink: ['Transmission', 'Downlink', 'Transmisión'],
  completed: ['Exécutée dans le modèle', 'Executed in the model', 'Ejecutada en el modelo'],
  blocked: [
    'Bloquée par les protections',
    'Blocked by safeguards',
    'Bloqueada por las protecciones',
  ],
  unsafe: [
    'Exécutée malgré une violation',
    'Executed despite a violation',
    'Ejecutada pese a una infracción',
  ],
  unassigned: [
    'Aucun créneau réalisable avec cet allocateur',
    'No feasible slot found by this allocator',
    'Este asignador no encontró un intervalo viable',
  ],
  healthy: [
    'Aucune violation observée ; vérifiez aussi les objectifs non exécutés.',
    'No violation observed; also review unexecuted objectives.',
    'No se observó ninguna infracción; revisa también los objetivos no ejecutados.',
  ],
  review: [
    'Revoir la procédure à partir de la trace {eventId}.',
    'Review the procedure using trace {eventId}.',
    'Revisar el procedimiento a partir de la traza {eventId}.',
  ],
  replan: [
    'Prévisualiser une nouvelle allocation avec la panne déclarée.',
    'Preview a new allocation with the declared fault.',
    'Previsualizar una nueva asignación con el fallo declarado.',
  ],
  validation: [
    '{passed}/{total} scénarios respectent les invariants ; les objectifs exécutés sont comptés séparément.',
    '{passed}/{total} scenarios satisfy the invariants; executed objectives are counted separately.',
    '{passed}/{total} escenarios cumplen los invariantes; los objetivos ejecutados se contabilizan por separado.',
  ],
  usage: [
    'Usage : space-mission-lab frontier [--destination=moon|mars|proxima] [--relay=store-forward|immediate-direct] [--outage=0|1] [--conflict=0|1] [--seed=20261010] [--signal=0|1] [--locale=fr|en|es] ; demo | analyze mission.json [rapport.json] [--locale=fr|en|es] [--fault=nominal|link-outage|low-power|sensor-stale] [--policy=guarded|unguarded]',
    'Usage: space-mission-lab frontier [--destination=moon|mars|proxima] [--relay=store-forward|immediate-direct] [--outage=0|1] [--conflict=0|1] [--seed=20261010] [--signal=0|1] [--locale=fr|en|es]; demo | analyze mission.json [report.json] [--locale=fr|en|es] [--fault=nominal|link-outage|low-power|sensor-stale] [--policy=guarded|unguarded]',
    'Uso: space-mission-lab frontier [--destination=moon|mars|proxima] [--relay=store-forward|immediate-direct] [--outage=0|1] [--conflict=0|1] [--seed=20261010] [--signal=0|1] [--locale=fr|en|es]; demo | analyze mission.json [informe.json] [--locale=fr|en|es] [--fault=nominal|link-outage|low-power|sensor-stale] [--policy=guarded|unguarded]',
  ],
  failure: [
    'Exécution impossible ; vérifiez les données, les options et le chemin de sortie.',
    'Execution failed; check data, options and output path.',
    'No se pudo ejecutar; comprueba los datos, las opciones y la ruta de salida.',
  ],
};
export function say(key, locale = 'fr', params = {}) {
  if (!['fr', 'en', 'es'].includes(locale))
    throw new Error('Langue / Language / Idioma: fr, en, es');
  return messages[key][{ fr: 0, en: 1, es: 2 }[locale]].replace(/\{(\w+)\}/g, (_, name) =>
    String(params[name] ?? ''),
  );
}
