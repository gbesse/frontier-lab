export const translations = {
  selectFile: ['Choisir un fichier', 'Choose a file', 'Elegir un archivo'],
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
    'Mesurer, corriger, ou économiser une étape ?',
    'Measure, correct, or save a step?',
    '¿Medir, corregir o ahorrar un paso?',
  ],
  intro: [
    'Trois stratégies fabriquent un film virtuel malgré une dérive du procédé et un capteur bruité. Comparez rendement et coût sur les mêmes épisodes.',
    'Three strategies fabricate a virtual film despite process drift and noisy sensing. Compare yield and cost on the same episodes.',
    'Tres estrategias fabrican una película virtual con deriva del proceso y sensor ruidoso. Compara rendimiento y coste en los mismos episodios.',
  ],
  notice: [
    'Fabrication entièrement simulée : film scalaire et paramètres synthétiques. Aucun jumeau numérique du Matter Compiler, aucune stratégie entraînée sur une usine réelle.',
    'Fully simulated fabrication: scalar film and synthetic parameters. No Matter Compiler digital twin or policy trained on a real factory.',
    'Fabricación totalmente simulada: película escalar y parámetros sintéticos. Sin gemelo digital del Matter Compiler ni estrategia entrenada en una fábrica real.',
  ],
  summary: [
    '{count} épisodes communs par stratégie ; graine et budgets conservés.',
    '{count} shared episodes per strategy; seed and budgets preserved.',
    '{count} episodios comunes por estrategia; semilla y presupuestos conservados.',
  ],
  methodText: [
    'Le dépôt et le retrait subissent un gain inconnu constant par épisode et un bruit de procédé. Le capteur a un biais et un bruit indépendants. L’agent voit les mesures, jamais l’épaisseur réelle ; celle-ci sert uniquement à l’évaluation finale. Les trois stratégies sont des règles de référence, pas des agents RL entraînés.',
    'Deposition and removal have an unknown gain fixed per episode and process noise. The sensor has independent bias and noise. The agent sees measurements, never true thickness; truth is used only for final evaluation. The three strategies are rule-based baselines, not trained RL agents.',
    'Depósito y retirada tienen una ganancia desconocida fija por episodio y ruido de proceso. El sensor tiene sesgo y ruido independientes. El agente ve mediciones, nunca el espesor real; este solo sirve para evaluar al final. Las tres estrategias son reglas de referencia, no agentes RL entrenados.',
  ],
  next: [
    'L’API reset/step permet d’évaluer votre propre stratégie. L’adaptateur Python Gymnasium expose aussi ce problème aux outils de recherche RL.',
    'The reset/step API lets you evaluate your own policy. The Python Gymnasium adapter also exposes this problem to RL research tools.',
    'La API reset/step permite evaluar tu estrategia. El adaptador Python Gymnasium también expone el problema a herramientas de investigación RL.',
  ],
  openLoop: ['Sans mesure', 'Open loop', 'Sin medición'],
  measured: ['Correction prudente', 'Cautious correction', 'Corrección prudente'],
  adaptive: ['Estimation du gain', 'Gain estimation', 'Estimación de ganancia'],
  simulationOnly: [
    'Le rendement décrit ce simulateur ; il ne prédit pas un rendement industriel.',
    'Yield describes this simulator; it does not predict industrial yield.',
    'El rendimiento describe este simulador; no predice rendimiento industrial.',
  ],
  invalidPolicy: ['Stratégie inconnue.', 'Unknown policy.', 'Estrategia desconocida.'],
  seed: ['Graine', 'Seed', 'Semilla'],
  episodes: ['Épisodes', 'Episodes', 'Episodios'],
  drift: ['Écart-type du gain', 'Gain standard deviation', 'Desviación típica de ganancia'],
  sensor: ['Bruit du capteur (µm)', 'Sensor noise (µm)', 'Ruido del sensor (µm)'],
  tolerance: ['Tolérance (µm)', 'Tolerance (µm)', 'Tolerancia (µm)'],
  policy: ['Stratégie', 'Policy', 'Estrategia'],
  yield: ['Réussite (%)', 'Success (%)', 'Éxito (%)'],
  error: ['Erreur absolue moyenne (µm)', 'Mean absolute error (µm)', 'Error absoluto medio (µm)'],
  cost: ['Coût moyen', 'Mean cost', 'Coste medio'],
  measurements: ['Mesures moyennes', 'Mean measurements', 'Mediciones medias'],
  xAxis: ['Épisode', 'Episode', 'Episodio'],
  yAxis: ['Erreur finale (µm)', 'Final error (µm)', 'Error final (µm)'],
};
export function message(key, locale = 'fr', values = {}) {
  const index = ['fr', 'en', 'es'].indexOf(locale);
  if (index < 0) throw Error(translations.invalidLocale[0]);
  if (!Object.hasOwn(translations, key))
    throw Error('Unknown translation / Traduction inconnue / Traducción desconocida: ' + key);
  return translations[key][index].replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '{' + k + '}');
}
