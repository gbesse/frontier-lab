export const translations = {
  selectFile: ['Choisir un fichier', 'Choose a file', 'Elegir un archivo'],
  checkUsage: [
    'check fichier.json : code 0 conforme, 1 sous le minimum, 3 indéterminé, 2 entrée invalide. CSV facultatifs : --baseline-csv=a.csv --candidate-csv=b.csv.',
    'check file.json: exit 0 passes, 1 below minimum, 3 inconclusive, 2 invalid input. Optional CSV: --baseline-csv=a.csv --candidate-csv=b.csv.',
    'check archivo.json: código 0 cumple, 1 bajo el mínimo, 3 indeterminado, 2 entrada no válida. CSV opcional: --baseline-csv=a.csv --candidate-csv=b.csv.',
  ],
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
    'Le diff entre deux objets fabriqués.',
    'The diff between two manufactured objects.',
    'Las diferencias entre dos objetos fabricados.',
  ],
  intro: [
    'Comparez la rigidité prévue et mesurée de deux révisions d’une micro-flexure. Les éprouvettes indépendantes déterminent l’incertitude.',
    'Compare predicted and measured stiffness for two micro-flexure revisions. Independent specimens determine uncertainty.',
    'Compara la rigidez prevista y medida de dos revisiones de una microflexura. Las probetas independientes determinan la incertidumbre.',
  ],
  notice: [
    'Démo : mesures synthétiques. Ajustement linéaire et intervalles de confiance ; aucune mesure réelle ni validation de fabrication.',
    'Demo: synthetic measurements. Linear fitting and confidence intervals; no real measurements or manufacturing validation.',
    'Demo: mediciones sintéticas. Ajuste lineal e intervalos de confianza; ninguna medición real ni validación de fabricación.',
  ],
  userNotice: [
    'Mesures fournies par l’utilisateur ; instrument et calibration déclarés, non vérifiés. Les intervalles ne couvrent pas les erreurs systématiques.',
    'User-supplied measurements; instrument and calibration are declared, not verified. Intervals do not cover systematic errors.',
    'Mediciones del usuario; instrumento y calibración declarados, no verificados. Los intervalos no cubren errores sistemáticos.',
  ],
  summary: [
    'Comparaison {baseline} → {candidate}.',
    'Comparison {baseline} → {candidate}.',
    'Comparación {baseline} → {candidate}.',
  ],
  methodText: [
    'Force en mN, déplacement en µm : la pente × 1000 donne la rigidité en N/m. Une régression avec intercept est ajustée par éprouvette. IC à 95 % de Student sur les éprouvettes indépendantes (valeur conservatrice pour n > 31). Conditions identiques requises ; R² inférieur à 0,98 rend le verdict indéterminé.',
    'Force in mN, displacement in µm: slope × 1000 gives stiffness in N/m. A regression with intercept is fitted per specimen. Student 95% CI across independent specimens (conservative critical value for n > 31). Identical conditions required; R² below 0.98 makes the verdict inconclusive.',
    'Fuerza en mN, desplazamiento en µm: pendiente × 1000 da rigidez en N/m. Regresión con intercepto por probeta. IC de Student al 95 % entre probetas independientes (valor conservador para n > 31). Se requieren condiciones idénticas; R² inferior a 0,98 deja el resultado indeterminado.',
  ],
  next: [
    'Prochaine preuve utile : importer trois éprouvettes par révision avec un instrument calibré.',
    'Next useful evidence: import three specimens per revision measured with a calibrated instrument.',
    'Siguiente prueba útil: importar tres probetas por revisión medidas con un instrumento calibrado.',
  ],
  needSpecimens: [
    'Au moins trois éprouvettes indépendantes sont requises par révision.',
    'At least three independent specimens are required per revision.',
    'Se necesitan al menos tres probetas independientes por revisión.',
  ],
  needPoints: [
    'Chaque éprouvette nécessite trois points et des déplacements distincts.',
    'Each specimen needs three points and distinct displacements.',
    'Cada probeta necesita tres puntos y desplazamientos distintos.',
  ],
  invalidSlope: [
    'La pente doit être positive ; vérifiez les axes et les unités.',
    'Slope must be positive; check axes and units.',
    'La pendiente debe ser positiva; comprueba ejes y unidades.',
  ],
  invalidCsv: [
    'CSV invalide. En-tête requis : specimen_id,displacement_um,force_mn.',
    'Invalid CSV. Required header: specimen_id,displacement_um,force_mn.',
    'CSV no válido. Cabecera requerida: specimen_id,displacement_um,force_mn.',
  ],
  conditionsChanged: [
    'Conditions différentes : changement mesuré non attribuable au seul design.',
    'Different conditions: measured change cannot be attributed to design alone.',
    'Condiciones distintas: el cambio medido no se puede atribuir solo al diseño.',
  ],
  nonlinear: [
    'Courbe insuffisamment linéaire : le modèle de rigidité doit être revu.',
    'Insufficiently linear curve: the stiffness model needs review.',
    'Curva insuficientemente lineal: hay que revisar el modelo de rigidez.',
  ],
  pass: [
    'La borne basse de l’IC atteint le minimum demandé.',
    'The lower CI bound meets the requested minimum.',
    'El límite inferior del IC alcanza el mínimo solicitado.',
  ],
  fail: [
    'La borne haute de l’IC reste sous le minimum demandé.',
    'The upper CI bound remains below the requested minimum.',
    'El límite superior del IC queda por debajo del mínimo solicitado.',
  ],
  inconclusive: [
    'Les mesures ne permettent pas de conclure sur le minimum demandé.',
    'The measurements do not establish whether the requested minimum is met.',
    'Las mediciones no permiten concluir si se alcanza el mínimo solicitado.',
  ],
  minimum: ['Rigidité minimale (N/m)', 'Minimum stiffness (N/m)', 'Rigidez mínima (N/m)'],
  changedConditions: [
    'Modifier la calibration de la révision B',
    'Change revision B calibration',
    'Cambiar calibración de revisión B',
  ],
  change: ['Changement mesuré (%)', 'Measured change (%)', 'Cambio medido (%)'],
  predicted: ['Rigidité prévue (N/m)', 'Predicted stiffness (N/m)', 'Rigidez prevista (N/m)'],
  measuredValue: ['Rigidité mesurée (N/m)', 'Measured stiffness (N/m)', 'Rigidez medida (N/m)'],
  revision: ['Révision', 'Revision', 'Revisión'],
  specimens: ['Éprouvettes', 'Specimens', 'Probetas'],
  confidence: ['IC 95 % (N/m)', '95% CI (N/m)', 'IC 95 % (N/m)'],
  residual: [
    'Écart à la prédiction (%)',
    'Prediction residual (%)',
    'Desviación de predicción (%)',
  ],
  csvBaseline: ['CSV de la révision A', 'Revision A CSV', 'CSV de revisión A'],
  csvCandidate: ['CSV de la révision B', 'Revision B CSV', 'CSV de revisión B'],
  csvHelp: [
    'Les CSV remplacent les points de mesure ; les conditions restent celles du JSON.',
    'CSV replaces measurement points; conditions remain those in the JSON.',
    'El CSV sustituye puntos de medida; las condiciones siguen siendo las del JSON.',
  ],
  xAxis: ['Déplacement (µm)', 'Displacement (µm)', 'Desplazamiento (µm)'],
  yAxis: ['Force (mN)', 'Force (mN)', 'Fuerza (mN)'],
};
export function message(key, locale = 'fr', values = {}) {
  const index = ['fr', 'en', 'es'].indexOf(locale);
  if (index < 0) throw Error(translations.invalidLocale[0]);
  if (!Object.hasOwn(translations, key))
    throw Error('Unknown translation / Traduction inconnue / Traducción desconocida: ' + key);
  return translations[key][index].replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '{' + k + '}');
}
