import { matterTranslations } from '/i18n.js';
const names = [
  'FabReplay',
  'SwitchBench',
  'MicroFabGym',
  'CoolantForge',
  'QualifyDiff',
  'FabPort',
  'FabResume',
  'MeasurePlan',
  'MicroBlocks',
  'FabTrace',
];
const slugs = [
  'fabreplay',
  'switchbench',
  'microfabgym',
  'coolantforge',
  'qualifydiff',
  'fabport',
  'fabresume',
  'measureplan',
  'microblocks',
  'fabtrace',
];
const selector = document.getElementById('locale');
selector.value = ['fr', 'en', 'es'].includes(new URL(location.href).searchParams.get('lang'))
  ? new URL(location.href).searchParams.get('lang')
  : 'fr';
function render() {
  const locale = selector.value,
    index = ['fr', 'en', 'es'].indexOf(locale);
  document.documentElement.lang = locale;
  for (const key of ['title', 'intro', 'notice'])
    document.getElementById(key).textContent = matterTranslations[key][index];
  const projects = document.getElementById('projects');
  projects.replaceChildren();
  for (const [i, name] of names.entries()) {
    const card = document.createElement('article');
    card.className = 'panel';
    const title = document.createElement('h2');
    title.textContent = name;
    const text = document.createElement('p');
    text.textContent = matterTranslations[slugs[i]][index];
    const link = document.createElement('a');
    link.href = `/matter/${slugs[i]}/?lang=${locale}`;
    link.textContent = matterTranslations.open[index];
    card.append(title, text, link);
    projects.append(card);
  }
  const url = new URL(location.href);
  url.searchParams.set('lang', locale);
  history.replaceState(null, '', url);
}
selector.addEventListener('change', render);
render();
