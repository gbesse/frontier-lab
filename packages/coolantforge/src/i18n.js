export const translations = {
  selectFile: ['Choisir un fichier', 'Choose a file', 'Elegir un archivo'],
  downloadChannels: ['Exporter les canaux SVG', 'Export channel SVG', 'Exportar canales SVG'],
  language: ['Langue', 'Language', 'Idioma'],
  eyebrow: [
    'Open source · laboratoire physique',
    'Open source · physical lab',
    'Código abierto · laboratorio físico',
  ],
  settings: ['Votre expérience', 'Your experiment', 'Tu experimento'],
  run: ['Calculer', 'Calculate', 'Calcular'],
  reset: ['Reprendre la démo', 'Reset demo', 'Restablecer demo'],
  results: ['Résultats reproductibles', 'Reproducible results', 'Resultados reproducibles'],
  inputData: ['Utiliser ses données', 'Use your own data', 'Usar tus datos'],
  jsonInput: ['Données JSON', 'JSON data', 'Datos JSON'],
  apply: ['Appliquer le JSON', 'Apply JSON', 'Aplicar JSON'],
  upload: ['Importer un fichier JSON', 'Import a JSON file', 'Importar un archivo JSON'],
  download: ['Exporter le rapport JSON', 'Export JSON report', 'Exportar informe JSON'],
  downloadSvg: ['Exporter le graphique SVG', 'Export SVG chart', 'Exportar gráfico SVG'],
  reportData: [
    'Voir les calculs et les traces',
    'Inspect calculations and traces',
    'Ver cálculos y trazas',
  ],
  method: ['Hypothèses du modèle', 'Model assumptions', 'Hipótesis del modelo'],
  footer: [
    'Alpha MIT · calculs locaux · aucun équipement connecté',
    'MIT alpha · local calculations · no connected equipment',
    'Alfa MIT · cálculos locales · ningún equipo conectado',
  ],
  invalidInput: [
    'Entrée invalide : vérifiez le schéma, les unités et les plages indiquées.',
    'Invalid input: check the schema, units and documented ranges.',
    'Entrada no válida: comprueba el esquema, las unidades y los rangos indicados.',
  ],
  invalidLocale: [
    'Langue non prise en charge : fr, en, es. / Unsupported language: fr, en, es. / Idioma no admitido: fr, en, es.',
    'Langue non prise en charge : fr, en, es. / Unsupported language: fr, en, es. / Idioma no admitido: fr, en, es.',
    'Langue non prise en charge : fr, en, es. / Unsupported language: fr, en, es. / Idioma no admitido: fr, en, es.',
  ],
  invalidJson: [
    'JSON invalide : le résultat précédent est conservé.',
    'Invalid JSON: the previous result is retained.',
    'JSON no válido: se conserva el resultado anterior.',
  ],
  notFound: ['Ressource introuvable.', 'Resource not found.', 'Recurso no encontrado.'],
  serverError: [
    'Serveur indisponible : vérifiez le port.',
    'Server unavailable: check the port.',
    'Servidor no disponible: comprueba el puerto.',
  ],
  listening: [
    'Démo locale / Local demo / Demo local : {url}',
    'Démo locale / Local demo / Demo local : {url}',
    'Démo locale / Local demo / Demo local : {url}',
  ],
  ready: ['Calcul terminé.', 'Calculation complete.', 'Cálculo terminado.'],
  failure: [
    'Commande impossible : vérifiez les arguments et le fichier.',
    'Command failed: check the arguments and file.',
    'La orden falló: comprueba los argumentos y el archivo.',
  ],
  cliUsage: [
    'Usage : {name} demo | run fichier.json [--locale=fr|en|es] [--output=nouveau.json]',
    'Usage: {name} demo | run file.json [--locale=fr|en|es] [--output=new.json]',
    'Uso: {name} demo | run archivo.json [--locale=fr|en|es] [--output=nuevo.json]',
  ],
  noOverwrite: [
    'Le fichier existe déjà ; choisissez un nouveau chemin.',
    'The file already exists; choose a new path.',
    'El archivo ya existe; elige una ruta nueva.',
  ],
  sourceSynthetic: ['Données synthétiques', 'Synthetic data', 'Datos sintéticos'],
  sourceUser: [
    'Données fournies par l’utilisateur',
    'User-supplied data',
    'Datos proporcionados por el usuario',
  ],
  title: [
    'Diriger l’eau vers les points chauds.',
    'Route water toward hotspots.',
    'Dirigir el agua hacia los puntos calientes.',
  ],
  intro: [
    'Explorez des allocations de microcanaux entre zones thermiques. Comparez température estimée et puissance hydraulique sous contraintes de fabrication.',
    'Explore microchannel allocations between thermal zones. Compare estimated temperature and hydraulic power under manufacturing constraints.',
    'Explora distribuciones de microcanales entre zonas térmicas. Compara temperatura estimada y potencia hidráulica con restricciones de fabricación.',
  ],
  notice: [
    'Modèle réduit de présélection : eau monophasique et canaux parallèles. Pas de CFD 3D, de validation thermique ni de géométrie garantie fabricable chez Atomic Machines.',
    'Reduced screening model: single-phase water and parallel channels. No 3D CFD, thermal validation or guaranteed Atomic Machines manufacturability.',
    'Modelo reducido de preselección: agua monofásica y canales paralelos. Sin CFD 3D, validación térmica ni fabricación garantizada en Atomic Machines.',
  ],
  summary: [
    '{count} allocations explorées ; {feasible} admissibles dans ce modèle.',
    '{count} allocations explored; {feasible} feasible within this model.',
    '{count} distribuciones exploradas; {feasible} admisibles en este modelo.',
  ],
  methodText: [
    'Zones parallèles de largeur égale, débit total imposé et même perte de pression. Résistance hydraulique rectangulaire et Nusselt de Shah–London à flux uniforme sur les quatre parois, régime laminaire pleinement développé. Température estimée = entrée + échauffement du fluide + convection + conduction unidimensionnelle. Propriétés constantes de l’eau ; collecteurs, entrée hydrodynamique et étalement thermique omis.',
    'Parallel equal-width zones, fixed total flow and common pressure drop. Rectangular hydraulic resistance and Shah–London Nusselt for uniform heat flux on all four walls, fully developed laminar flow. Estimated temperature = inlet + bulk-fluid heating + convection + one-dimensional conduction. Constant water properties; manifolds, developing flow and thermal spreading omitted.',
    'Zonas paralelas de igual anchura, caudal total fijo y pérdida de presión común. Resistencia hidráulica rectangular y Nusselt de Shah–London con flujo térmico uniforme en las cuatro paredes, régimen laminar desarrollado. Temperatura estimada = entrada + calentamiento del fluido + convección + conducción unidimensional. Propiedades constantes del agua; se omiten colectores, flujo en desarrollo y difusión lateral.',
  ],
  next: [
    'Recherche sur un catalogue borné, sans optimisation topologique générale. Le SVG représente les canaux du meilleur candidat, sans collecteurs ni plan de fabrication.',
    'Bounded catalogue search, not general topology optimization. SVG shows channels of the best candidate, without manifolds or a manufacturing drawing.',
    'Búsqueda en catálogo limitado, sin optimización topológica general. El SVG muestra canales del mejor candidato, sin colectores ni plano de fabricación.',
  ],
  reducedModel: [
    'Candidat à confronter à une simulation CFD et à des mesures physiques.',
    'Candidate to compare against CFD and physical measurements.',
    'Candidato que debe compararse con CFD y mediciones físicas.',
  ],
  noFeasible: [
    'Aucune allocation admissible ; ajustez le débit, la géométrie ou le budget hydraulique.',
    'No feasible allocation; adjust flow, geometry or hydraulic budget.',
    'Ninguna distribución admisible; ajusta caudal, geometría o presupuesto hidráulico.',
  ],
  featureLimit: [
    'Largeur sous la limite de fabrication.',
    'Width below manufacturing limit.',
    'Anchura inferior al límite de fabricación.',
  ],
  pumpLimit: [
    'Budget hydraulique dépassé.',
    'Hydraulic budget exceeded.',
    'Presupuesto hidráulico superado.',
  ],
  laminarLimit: [
    'Reynolds dépasse 2000 : modèle laminaire hors périmètre.',
    'Reynolds exceeds 2000: outside the laminar model.',
    'Reynolds supera 2000: fuera del modelo laminar.',
  ],
  temperatureLimit: [
    'Température estimée supérieure à 80 °C : propriétés constantes hors périmètre.',
    'Estimated temperature above 80°C: outside constant-property screening scope.',
    'Temperatura estimada superior a 80 °C: fuera del alcance de propiedades constantes.',
  ],
  flow: ['Débit total (mL/min)', 'Total flow (mL/min)', 'Caudal total (mL/min)'],
  hotspot: [
    'Puissance de la zone centrale (W)',
    'Center zone power (W)',
    'Potencia de la zona central (W)',
  ],
  pumpBudget: ['Budget hydraulique (W)', 'Hydraulic budget (W)', 'Presupuesto hidráulico (W)'],
  feature: ['Largeur minimale (mm)', 'Minimum width (mm)', 'Anchura mínima (mm)'],
  temperature: [
    'Paroi maximale estimée (°C)',
    'Estimated maximum wall (°C)',
    'Pared máxima estimada (°C)',
  ],
  pump: ['Puissance hydraulique (W)', 'Hydraulic power (W)', 'Potencia hidráulica (W)'],
  pressure: ['Perte de pression (Pa)', 'Pressure drop (Pa)', 'Pérdida de presión (Pa)'],
  zone: ['Zone', 'Zone', 'Zona'],
  channels: ['Canaux', 'Channels', 'Canales'],
  width: ['Largeur (mm)', 'Width (mm)', 'Anchura (mm)'],
  reynolds: ['Reynolds', 'Reynolds', 'Reynolds'],
  pareto: [
    'Compromis température / puissance hydraulique',
    'Temperature / hydraulic power trade-off',
    'Compromiso temperatura / potencia hidráulica',
  ],
};
export function message(key, locale = 'fr', values = {}) {
  const index = ['fr', 'en', 'es'].indexOf(locale);
  if (index < 0) throw Error(translations.invalidLocale[0]);
  if (!Object.hasOwn(translations, key))
    throw Error('Unknown translation / Traduction inconnue / Traducción desconocida: ' + key);
  return translations[key][index].replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '{' + k + '}');
}
