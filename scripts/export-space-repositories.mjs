import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url)),
  destination = resolve(process.argv[2] || resolve(root, '.local/space-repositories')),
  commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const prefix = 'packages/space-mission-lab/';
const source = (path) =>
  execFileSync('git', ['show', `${commit}:${path}`], { cwd: root, maxBuffer: 10e6 });
const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', commit], {
  cwd: root,
  encoding: 'utf8',
}).split('\n');
const originalI18n = await import(
  'data:text/javascript;base64,' + source('studio/i18n.js').toString('base64')
);
const projects = [
  {
    kind: 'benchmark',
    slug: 'mission-benchmark-commons',
    name: 'Mission Benchmark Commons',
    port: 4323,
    requirements: [
      'bsk==2.12.0',
      'sgp4==2.25',
      'spiceypy==8.2.0',
      'numpy==2.3.5',
      'matplotlib==3.10.6',
    ],
    datasets: ['iss-2026-10-10', 'de440s', 'naif0012'],
    functions: ['sha', 'verified', 'version', 'satellite', 'benchmark', 'main'],
    tagline: [
      'Comparer la précision de deux moteurs orbitaux.',
      'Compare the accuracy of two orbital engines.',
      'Comparar la precisión de dos motores orbitales.',
    ],
    purpose: [
      'Basilisk RK4 et Orekit KeplerianPropagator partagent les états initiaux ISS/SGP4 ou Lune/JPL DE440s. Inspecter les écarts numériques, la dérive d’énergie et les résidus du modèle.',
      'Basilisk RK4 and Orekit KeplerianPropagator share ISS/SGP4 or Moon/JPL DE440s initial states. Inspect numerical differences, energy drift and model residuals.',
      'Basilisk RK4 y Orekit KeplerianPropagator comparten estados iniciales ISS/SGP4 o Luna/JPL DE440s. Inspeccionar diferencias numéricas, deriva de energía y residuos del modelo.',
    ],
    tools: ['Basilisk 2.12.0', 'Orekit 13.1.9', 'SGP4 2.25', 'SpiceyPy 8.2.0'],
    prerequisites: [
      'Python 3.11–3.13 et curl ; Java 17+ sur Linux, JDK téléchargé sur macOS ARM.',
      'Python 3.11–3.13 and curl; Java 17+ on Linux, JDK downloaded on macOS ARM.',
      'Python 3.11–3.13 y curl; Java 17+ en Linux, JDK descargado en macOS ARM.',
    ],
    topics: [
      'space',
      'spaceflight',
      'orbital-mechanics',
      'mission-design',
      'basilisk',
      'orekit',
      'spiceypy',
      'benchmarking',
      'scientific-computing',
      'open-source',
    ],
  },
  {
    kind: 'market',
    slug: 'contact-market',
    name: 'Contact Market',
    port: 4324,
    requirements: ['sgp4==2.25', 'ortools==9.15.6755', 'numpy==2.3.5'],
    datasets: ['iss-2026-10-10'],
    functions: ['sha', 'verified', 'version', 'satellite', 'contact_windows', 'market', 'main'],
    tagline: [
      'Optimiser la science transmise sous budget.',
      'Optimize transmitted science under a budget.',
      'Optimizar la ciencia transmitida con presupuesto.',
    ],
    purpose: [
      'Calculer les contacts ISS depuis un TLE archivé, optimiser les demandes avec OR-Tools CP-SAT, comparer à premier arrivé/premier servi et vérifier un manifeste ION BPv7/UDP sur localhost.',
      'Compute ISS contacts from an archived TLE, optimize requests with OR-Tools CP-SAT, compare against first-come-first-served and verify an ION BPv7/UDP manifest on localhost.',
      'Calcular contactos ISS desde un TLE archivado, optimizar solicitudes con OR-Tools CP-SAT, comparar con orden de llegada y verificar un manifiesto ION BPv7/UDP en localhost.',
    ],
    tools: ['SGP4 2.25', 'OR-Tools 9.15.6755', 'ION 4.2.0', 'Ed25519'],
    prerequisites: [
      'Python 3.11–3.13, curl, compilateur C, make, autoconf et libtool. ION est compilé localement sans modification des paramètres système.',
      'Python 3.11–3.13, curl, C compiler, make, autoconf and libtool. ION is compiled locally without changing system settings.',
      'Python 3.11–3.13, curl, compilador C, make, autoconf y libtool. ION se compila localmente sin cambiar parámetros del sistema.',
    ],
    topics: [
      'space',
      'spaceflight',
      'satellite-communications',
      'delay-tolerant-networking',
      'ion-dtn',
      'bundle-protocol',
      'operations-research',
      'or-tools',
      'scheduling',
      'open-source',
    ],
  },
  {
    kind: 'citizen',
    slug: 'citizen-mission',
    name: 'Citizen Mission',
    port: 4325,
    requirements: ['blimpy==2.1.4', 'turbo-seti==2.3.2', 'numpy==2.3.5', 'matplotlib==3.10.6'],
    datasets: ['voyager-1'],
    functions: ['sha', 'verified', 'version', 'citizen', 'main'],
    tagline: [
      'Retrouver Voyager dans une observation radio réelle.',
      'Recover Voyager from a real radio observation.',
      'Recuperar Voyager en una observación de radio real.',
    ],
    purpose: [
      'Lire l’observation publique Voyager 1/GBT avec blimpy, chercher sa dérive Doppler avec turboSETI sur CPU et explorer spectrogramme, porteuse et provenance.',
      'Read the public Voyager 1/GBT observation with blimpy, search its Doppler drift with turboSETI on CPU and explore the waterfall, carrier and provenance.',
      'Leer la observación pública Voyager 1/GBT con blimpy, buscar su deriva Doppler con turboSETI en CPU y explorar espectrograma, portadora y procedencia.',
    ],
    tools: ['blimpy 2.1.4', 'turboSETI 2.3.2', 'CPU'],
    prerequisites: [
      'Python 3.11–3.13 et curl. Aucun GPU, Java ni ION requis.',
      'Python 3.11–3.13 and curl. No GPU, Java or ION required.',
      'Python 3.11–3.13 y curl. No se requiere GPU, Java ni ION.',
    ],
    topics: [
      'space',
      'spaceflight',
      'voyager',
      'radio-astronomy',
      'seti',
      'breakthrough-listen',
      'doppler',
      'signal-processing',
      'citizen-science',
      'open-source',
    ],
  },
];
const templates = [
  'src/server.js',
  'src/index.js',
  'src/method.js',
  'bin/cli.js',
  'bin/serve.js',
  'scripts/build.mjs',
  'scripts/fixtures.mjs',
  'scripts/engines.mjs',
  'test/core.test.js',
  'test/browser.mjs',
];
const coreNotices = (
  await import(
    'data:text/javascript;base64,' + source(prefix + 'src/commons.js').toString('base64')
  )
).commonsNotices;
for (const project of projects) {
  const dir = resolve(destination, project.slug);
  let exists = false;
  try {
    await access(dir);
    exists = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (exists) {
    if (!process.argv.includes('--refresh-owned')) throw new Error('DESTINATION_EXISTS ' + dir);
    const owner = JSON.parse(await readFile(resolve(dir, 'upstream.json'), 'utf8'));
    if (
      owner.repository !== 'https://github.com/gbesse/frontier-lab' ||
      owner.extraction !== project.kind
    )
      throw new Error('DESTINATION_NOT_OWNED');
  }
  const upstream = {
    repository: 'https://github.com/gbesse/frontier-lab',
    commit,
    extraction: project.kind,
    sourceSha256: {},
  };
  async function save(path, content) {
    const file = resolve(dir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  async function copy(from, to, transform = (x) => x) {
    const bytes = source(from);
    upstream.sourceSha256[from] = createHash('sha256').update(bytes).digest('hex');
    await save(to, transform(bytes.toString()));
  }
  await save(
    'src/project.js',
    'export const project = ' + JSON.stringify({ ...project, version: '0.1.0' }, null, 2) + ';\n',
  );
  await copy(prefix + 'src/commons.js', 'src/commons.js', (text) =>
    text.replace("['benchmark', 'market', 'citizen']", JSON.stringify([project.kind])),
  );
  await copy(prefix + 'src/commons-engine.js', 'src/commons-engine.js', (text) =>
    text
      .replace(
        "new URL('../../../.local/space-runtime/', import.meta.url)",
        "new URL('../.local/space-runtime/', import.meta.url)",
      )
      .replace(
        'export const defaultRuntime = fileURLToPath(',
        'export const defaultRuntime = process.env.SPACE_RUNTIME ? resolve(process.env.SPACE_RUNTIME) : fileURLToPath(',
      ),
  );
  const i18n = Object.fromEntries(
    Object.entries(originalI18n.messageTranslations).filter(([key]) => key.startsWith('commons')),
  );
  i18n.commonsTitle = project.tagline;
  i18n.commonsIntro = project.purpose;
  i18n.standaloneOutputExists = [
    'Le fichier de sortie existe déjà.',
    'The output file already exists.',
    'El archivo de salida ya existe.',
  ];
  await save(
    'src/i18n.js',
    'export const messageTranslations = ' + JSON.stringify(i18n, null, 2) + ';\n',
  );
  for (const template of templates)
    await save(template, await readFile(resolve(root, 'scripts/space-repo-template', template)));
  await copy('studio/space-commons.js', 'public/app.js', (text) =>
    text
      .replaceAll('/api/space/scenario', '/api/session')
      .replaceAll('/api/space/commons', '/api/run')
      .replace("'/api/run?'", "'/api/replay?'")
      .replaceAll('x-studio-token', 'x-project-token'),
  );
  for (const file of ['style.css', 'space.css', 'space-commons.css'])
    await copy('studio/' + file, 'public/' + file);
  const links = projects
    .filter((item) => item.kind !== project.kind)
    .map((item) => `<a href="https://github.com/gbesse/${item.slug}">${item.name} ↗</a>`)
    .join('');
  await copy('studio/space-commons-page.js', 'src/page.js', (text) =>
    text
      .slice(0, text.indexOf('export function renderCommonsMethod'))
      .concat("export {renderCommonsMethod} from './method.js';\n")
      .replaceAll("'../packages/space-mission-lab/src/commons.js'", "'./commons.js'")
      .replaceAll("'./i18n.js'", "'./i18n.js'")
      .replace(
        '<a class="brand" href="${publicMode ? \'/\' + lang : \'\'}/space?lang=${lang}">f↗ <span>frontier / Space Mission Lab</span></a>',
        '<a class="brand" href="/">↗ <span>' + project.name + '</span></a>',
      )
      .replace('frontier / Space Mission Lab', project.name)
      .replace(
        "<a href=\"${publicMode ? '/' + lang : ''}/space/explore?lang=${lang}\">SOTA ↗</a>",
        links,
      )
      .replaceAll('npm run space:setup', 'npm run setup:engines')
      .replaceAll('npm run space:test:engines', 'npm run test:engines')
      .replaceAll('npm run space:fixtures', 'npm run fixtures:refresh')
      .replaceAll('npm run space:public', 'npm run build')
      .replace('f↗ <span>Space Mission Lab</span>', '↗ <span>' + project.name + '</span>'),
  );
  const datasets = JSON.parse(source(prefix + 'engines/datasets.json'));
  datasets.datasets = datasets.datasets.filter((data) => project.datasets.includes(data.id));
  await save('engines/datasets.json', JSON.stringify(datasets, null, 2) + '\n');
  await copy(prefix + 'engines/requirements.lock.txt', 'engines/requirements.lock.txt');
  await save('engines/requirements.txt', project.requirements.join('\n') + '\n');
  const tools = JSON.parse(source(prefix + 'engines/toolchain.json'));
  tools.artifacts = tools.artifacts.filter((item) =>
    project.kind === 'benchmark'
      ? item.file.startsWith('jars/') || item.file === 'jdk.tar.gz'
      : project.kind === 'market'
        ? ['ion.tar.gz', 'automake.tar.gz', 'pkg.m4'].includes(item.file)
        : false,
  );
  await save('engines/toolchain.json', JSON.stringify(tools, null, 2) + '\n');
  if (project.kind === 'benchmark')
    await copy(prefix + 'engines/OrekitAdapter.java', 'engines/OrekitAdapter.java');
  if (project.kind === 'market')
    await copy(prefix + 'engines/ion_worker.py', 'engines/ion_worker.py');
  const python = `import ast,sys\ns=sys.stdin.read();t=ast.parse(s);names=${JSON.stringify(project.functions)};parts=[]\nfor n in t.body:\n if isinstance(n,(ast.Import,ast.ImportFrom)) or isinstance(n,ast.FunctionDef) and n.name in names or isinstance(n,ast.If):parts.append(ast.get_source_segment(s,n))\nprint('\\n\\n'.join(parts).replace('{"benchmark": benchmark, "market": market, "citizen": citizen}', '{"${project.kind}": ${project.kind}}'))\n`;
  await save(
    'engines/worker.py',
    execFileSync('python3', ['-c', python], {
      input: source(prefix + 'engines/worker.py'),
      encoding: 'utf8',
    }),
  );
  if (project.kind !== 'citizen')
    await save('fixtures/iss-2026-10-10.tle', source(prefix + 'fixtures/iss-2026-10-10.tle'));
  for (const file of tracked.filter(
    (path) =>
      path.startsWith(prefix + `fixtures/commons/${project.kind}-`) && path.endsWith('.json'),
  ))
    await copy(file, 'fixtures/commons/' + file.split('/').at(-1));
  let setup = source('scripts/space-setup.mjs')
    .toString()
    .replace(
      "engine = resolve(root, 'packages/space-mission-lab/engines')",
      "engine = resolve(root, 'engines')",
    )
    .replace(
      "runtime = resolve(root, '.local/space-runtime')",
      "runtime = resolve(process.env.SPACE_RUNTIME || resolve(root, '.local/space-runtime'))",
    )
    .replace(
      "join(root, 'packages/space-mission-lab/fixtures', data.fixture)",
      "join(root, 'fixtures', data.fixture)",
    )
    .replaceAll('npm run space:test:engines', 'npm run test:engines');
  const javaStart = setup.indexOf('  for (const item of tools.filter'),
    javaEnd = setup.indexOf('  const manifest =', javaStart);
  if (project.kind !== 'benchmark') setup = setup.slice(0, javaStart) + setup.slice(javaEnd);
  if (project.kind !== 'market') {
    const ionStart = setup.indexOf("  if (!existsSync(join(runtime, 'ion/bin/bpsendfile')))"),
      ionEnd = setup.indexOf('  await chmod(runtime', ionStart);
    setup = setup.slice(0, ionStart) + setup.slice(ionEnd);
  }
  await save('scripts/setup.mjs', setup);
  await copy('scripts/space-public-preview.mjs', 'scripts/preview.mjs', (text) =>
    text
      .slice(0, text.indexOf('\nif (process.argv[1]'))
      .replace("resolve('output/space-public')", "resolve('output/site')"),
  );
  await copy('LICENSE', 'LICENSE');
  await copy('AGENTS.md', 'AGENTS.md', (text) => text.replace('studio/i18n.js', 'src/i18n.js'));
  await copy('.prettierrc.json', '.prettierrc.json');
  await save(
    '.gitignore',
    'node_modules/\n.env\n.env.*\n.local/\noutput/\n*.tgz\n__pycache__/\n.DS_Store\n*.log\n',
  );
  await save('.prettierignore', 'node_modules/\n.local/\noutput/\npackage-lock.json\n');
  await save('.gitattributes', '*.tle -text\n*.png binary\n');
  await save(
    'package.json',
    JSON.stringify(
      {
        name: '@gbesse/' + project.slug,
        version: '0.1.0',
        type: 'module',
        main: 'src/index.js',
        exports: '.' + '/src/index.js',
        bin: { [project.slug]: 'bin/cli.js' },
        files: [
          'src',
          'bin',
          'public',
          'engines',
          'scripts',
          'fixtures',
          'docs',
          'README.md',
          'README.en.md',
          'README.es.md',
          'LICENSE',
          'upstream.json',
        ],
        scripts: {
          start: 'node bin/serve.js',
          demo: 'node bin/cli.js demo',
          test: 'node --test test/*.test.js',
          'test:browser': 'node scripts/build.mjs && node test/browser.mjs',
          'test:engines': 'node scripts/engines.mjs',
          'setup:engines': 'node scripts/setup.mjs',
          'fixtures:refresh': 'node scripts/fixtures.mjs',
          build: 'node scripts/build.mjs',
          'format:check': 'prettier --check .',
        },
        engines: { node: '>=22' },
        license: 'MIT',
        repository: { type: 'git', url: `https://github.com/gbesse/${project.slug}.git` },
        homepage: `https://github.com/gbesse/${project.slug}#readme`,
        description: project.tagline
          .map((text, index) => ['FR : ', 'EN: ', 'ES: '][index] + text)
          .join(' '),
        keywords: project.topics,
        devDependencies: { playwright: '1.63.0', prettier: '3.9.9' },
      },
      null,
      2,
    ) + '\n',
  );
  await mkdir(resolve(dir, 'docs'), { recursive: true });
  for (const [index, locale] of ['fr', 'en', 'es'].entries()) {
    const headings = [
      ['Essayer en une minute', 'Try in one minute', 'Probar en un minuto'],
      ['Exécuter les vrais moteurs', 'Run the real engines', 'Ejecutar motores reales'],
      ['Méthode, données et limites', 'Method, data and limitations', 'Método, datos y límites'],
      ['Vérifier et contribuer', 'Verify and contribute', 'Verificar y contribuir'],
    ];
    const cached = [
      'La démo utilise des calculs réellement exécutés et archivés, fournis dans ce dépôt autonome. Node.js 22+ suffit ; aucun compte, clé API, dépôt parent ou service externe n’est nécessaire pour la relecture.',
      'The demo uses actual computations archived and supplied in this standalone repository. Node.js 22+ is sufficient; no account, API key, parent repository or external service is needed for replay.',
      'La demo usa cálculos reales archivados e incluidos en este repositorio autónomo. Node.js 22+ basta; no se necesita cuenta, clave API, repositorio padre ni servicio externo para reproducir.',
    ];
    const flows = [
      'Interface locale FR/EN/ES, défi quotidien UTC dans un catalogue figé, prédiction scorée, URL de paramètres reproductible, preuve JSON et carte PNG. L’historique est local ; aucun classement mondial ni trafic inventé.',
      'Local FR/EN/ES UI, daily UTC challenge in a fixed catalog, scored prediction, reproducible parameter URL, JSON evidence and PNG card. History is local; no global leaderboard or invented traffic.',
      'Interfaz local FR/EN/ES, desafío diario UTC de un catálogo fijo, predicción evaluada, URL reproducible de parámetros, prueba JSON y tarjeta PNG. Historial local; sin clasificación global ni tráfico inventado.',
    ];
    const runtimes = [
      'Le bouton « Exécuter » et la commande `run` lancent les moteurs installés ; « Rejouer » ne relance aucun moteur. Aucun résultat de secours synthétique. L’installation télécharge seulement les dépendances de ce projet, dans `.local/space-runtime`, ignoré par Git. `SPACE_RUNTIME` peut désigner un runtime déjà installé ; `SPACE_LOCALE` choisit la langue du script.',
      'The “Run” button and `run` command start installed engines; “Replay” does not rerun an engine. No synthetic fallback. Setup downloads only this project’s dependencies into Git-ignored `.local/space-runtime`. `SPACE_RUNTIME` may point to an existing runtime; `SPACE_LOCALE` sets setup language.',
      'El botón «Ejecutar» y el comando `run` inician motores instalados; «Reproducir» no inicia ningún motor. Sin sustitución sintética. La instalación descarga solo dependencias del proyecto en `.local/space-runtime`, ignorado por Git. `SPACE_RUNTIME` puede indicar un runtime existente; `SPACE_LOCALE` selecciona idioma de instalación.',
    ];
    const build = [
      '`npm run build` exporte `output/site` pour un hébergement statique à la racine d’un domaine. Cette édition rejoue les cas publiés, sans moteur ni API locale exposée.',
      '`npm run build` exports `output/site` for static hosting at a domain root. This edition replays published cases, without exposing engines or local APIs.',
      '`npm run build` exporta `output/site` para alojamiento estático en la raíz de un dominio. Esta edición reproduce casos publicados, sin exponer motores ni API locales.',
    ];
    const caveats = [
      'Les versions, paramètres, empreintes et notices sont inclus. Les grands fichiers H5/SPK et les binaires ne sont pas redistribués ; leurs sources et SHA-256 sont épinglés. Les dépendances et données externes conservent leurs conditions respectives.',
      'Versions, parameters, hashes and notices are included. Large H5/SPK files and binaries are not redistributed; their sources and SHA-256 are pinned. External dependencies and data retain their respective terms.',
      'Se incluyen versiones, parámetros, huellas y avisos. No se redistribuyen archivos H5/SPK ni binarios; sus fuentes y SHA-256 están fijados. Dependencias y datos externos mantienen sus condiciones.',
    ];
    const independent = [
      'Projet logiciel indépendant sous licence MIT, sans affiliation NASA/JPL, ESA ou fournisseurs cités. Aucun logiciel ni API de machine de fabrication requis. Code extrait de Frontier Lab, adapté à un dépôt autonome ; provenance dans `upstream.json`. Les données utilisateur ne sont pas traduites. Les exports CLI n’écrasent pas les fichiers.',
      'Independent MIT software project, without affiliation with NASA/JPL, ESA or cited providers. No fabrication machine software or API is required. Code extracted from Frontier Lab and adapted to a standalone repository; provenance in `upstream.json`. User data is not translated. CLI exports never overwrite files.',
      'Proyecto de software independiente MIT, sin afiliación con NASA/JPL, ESA ni proveedores citados. No necesita software ni API de máquinas de fabricación. Código extraído de Frontier Lab y adaptado a repositorio autónomo; procedencia en `upstream.json`. No se traducen datos del usuario. Las exportaciones CLI no sobrescriben archivos.',
    ];
    const readme = `# ${project.name}\n\n${locale === 'fr' ? 'Français · [English](README.en.md) · [Español](README.es.md)' : locale === 'en' ? '[Français](README.md) · English · [Español](README.es.md)' : '[Français](README.md) · [English](README.en.md) · Español'}\n\n${project.tagline[index]}\n\n${project.purpose[index]}\n\n![${project.name}](docs/${project.slug}-${locale}.png)\n\n## ${headings[0][index]}\n\n${cached[index]}\n\n\`\`\`sh\ngit clone https://github.com/gbesse/${project.slug}.git\ncd ${project.slug}\nnode bin/cli.js demo --locale=${locale}\nnpm start\n\`\`\`\n\nhttp://127.0.0.1:${project.port}/?lang=${locale}\n\n${flows[index]}\n\n## ${headings[1][index]}\n\n${project.prerequisites[index]}\n\n${project.tools.join(' · ')}\n\n\`\`\`sh\nnpm run setup:engines\nnpm run test:engines\nnode bin/cli.js run --locale=${locale}\n\`\`\`\n\n${runtimes[index]}\n\n## ${headings[2][index]}\n\n${coreNotices[project.kind][locale]}\n\n${caveats[index]}\n\n${independent[index]}\n\n## ${headings[3][index]}\n\n\`\`\`sh\nnpm ci\nnpm test\nnpx playwright install chromium\nnpm run test:browser\nnpm run format:check\n\`\`\`\n\n${build[index]}\n\n[Mission Benchmark Commons](https://github.com/gbesse/mission-benchmark-commons) · [Contact Market](https://github.com/gbesse/contact-market) · [Citizen Mission](https://github.com/gbesse/citizen-mission)\n`;
    await save(locale === 'fr' ? 'README.md' : `README.${locale}.md`, readme);
  }
  await save(
    '.github/workflows/ci.yml',
    `name: verify\non: [push, pull_request, workflow_dispatch]\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n    strategy:\n      matrix:\n        node: [22, 24]\n    steps:\n      - uses: actions/checkout@v7\n        with:\n          persist-credentials: false\n      - uses: actions/setup-node@v7\n        with:\n          node-version: \${{ matrix.node }}\n          cache: npm\n      - run: npm ci\n      - run: npx playwright install --with-deps chromium\n      - run: npm test\n      - run: npm run format:check\n      - run: npm run test:browser\n      - run: npm audit --audit-level=moderate\n`,
  );
  await save('upstream.json', JSON.stringify(upstream, null, 2) + '\n');
  console.log(`${project.slug}: ${dir}`);
}
