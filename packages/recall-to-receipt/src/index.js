import { createHash } from 'node:crypto';

const locales = ['fr', 'en', 'es'];
const copy = {
  invalid: ['Données invalides.', 'Invalid data.', 'Datos no válidos.'],
  notice: [
    'Rapprochement local des données fournies : aucun arrêt de vente ni message client n’est déclenché. Une information de lot absente ne prouve jamais l’absence de risque.',
    'Local reconciliation of supplied data: no sale is stopped and no customer message is sent. Missing lot data never proves absence of risk.',
    'Conciliación local de los datos aportados: no se bloquea ninguna venta ni se envía ningún mensaje. La falta de datos del lote nunca demuestra ausencia de riesgo.',
  ],
  summary: [
    '{confirmed} correspondance(s) certaine(s), {possible} à vérifier.',
    '{confirmed} definite match(es), {possible} requiring review.',
    '{confirmed} coincidencia(s) confirmada(s), {possible} por revisar.',
  ],
  CONFIRMED: [
    'Produit inclus dans le périmètre déclaré du rappel.',
    'Product falls within the declared recall scope.',
    'Producto incluido en el alcance declarado de la retirada.',
  ],
  POSSIBLE: [
    'Correspondance possible : lot ou période insuffisamment documenté.',
    'Possible match: lot or period insufficiently documented.',
    'Posible coincidencia: lote o período insuficientemente documentado.',
  ],
};
const say = (key, locale, values = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return copy[key][index].replace(/\{(\w+)\}/g, (_, name) => values[name]);
};
const obj = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const str = (value) => typeof value === 'string' && value.trim() !== '';
const date = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(value).toISOString().slice(0, 10) === value;
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const validGtin = (value) => {
  if (typeof value !== 'string' || !/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  const digits = [...value].map(Number);
  const check = digits.pop();
  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
};
const unique = (rows) => new Set(rows.map((row) => row.id)).size === rows.length;
const lotMatch = (recall, lot) =>
  recall.lotCodes === null
    ? 'unknown'
    : recall.lotCodes.length === 0
      ? 'yes'
      : !str(lot)
        ? 'unknown'
        : recall.lotCodes.includes(lot)
          ? 'yes'
          : 'no';
const windowMatch = (recall, soldAt) =>
  recall.saleWindow === null
    ? 'unknown'
    : recall.saleWindow === 'all'
      ? 'yes'
      : soldAt < recall.saleWindow.from || soldAt > recall.saleWindow.to
        ? 'no'
        : 'yes';
const conclusion = (...parts) =>
  parts.includes('no') ? null : parts.includes('unknown') ? 'possible' : 'confirmed';

export function reconcileRecalls(input, { locale = 'fr' } = {}) {
  say('invalid', locale);
  try {
    if (
      !obj(input) ||
      !Array.isArray(input.recalls) ||
      !Array.isArray(input.transactions) ||
      !Array.isArray(input.stock)
    )
      throw Error('invalid');
    for (const collection of [input.recalls, input.transactions, input.stock])
      if (!unique(collection)) throw Error('invalid');
    for (const recall of input.recalls) {
      if (
        !obj(recall) ||
        !str(recall.id) ||
        !validGtin(recall.gtin) ||
        !str(recall.sourceUrl) ||
        !(
          recall.lotCodes === null ||
          (Array.isArray(recall.lotCodes) && recall.lotCodes.every(str))
        ) ||
        !(
          recall.saleWindow === null ||
          recall.saleWindow === 'all' ||
          (obj(recall.saleWindow) &&
            date(recall.saleWindow.from) &&
            date(recall.saleWindow.to) &&
            recall.saleWindow.from <= recall.saleWindow.to)
        )
      )
        throw Error('invalid');
    }
    for (const row of input.transactions)
      if (
        !obj(row) ||
        !str(row.id) ||
        !validGtin(row.gtin) ||
        !date(row.soldAt) ||
        !Number.isSafeInteger(row.units) ||
        row.units < 1 ||
        !(row.lotCode === null || str(row.lotCode))
      )
        throw Error('invalid');
    for (const row of input.stock)
      if (
        !obj(row) ||
        !str(row.id) ||
        !validGtin(row.gtin) ||
        !Number.isSafeInteger(row.units) ||
        row.units < 0 ||
        !(row.lotCode === null || str(row.lotCode))
      )
        throw Error('invalid');
    const matches = [];
    const inspect = (row, type, index) => {
      for (const recall of input.recalls) {
        if (row.gtin !== recall.gtin) continue;
        const status = conclusion(
          lotMatch(recall, row.lotCode),
          type === 'transaction' ? windowMatch(recall, row.soldAt) : 'yes',
        );
        if (status)
          matches.push({
            ref: `${type}.${index}`,
            recallId: recall.id,
            status,
            action: type === 'stock' ? 'review_stop_sale' : 'review_notification',
            message: say(status === 'confirmed' ? 'CONFIRMED' : 'POSSIBLE', locale),
          });
      }
    };
    input.transactions.forEach((row, index) => inspect(row, 'transaction', index));
    input.stock.forEach((row, index) => {
      if (row.units) inspect(row, 'stock', index);
    });
    const confirmed = matches.filter((row) => row.status === 'confirmed').length;
    return {
      schemaVersion: 1,
      locale,
      notice: say('notice', locale),
      summary: say('summary', locale, { confirmed, possible: matches.length - confirmed }),
      inputSha256: hash(input),
      matches,
    };
  } catch {
    throw Error(say('invalid', locale));
  }
}
