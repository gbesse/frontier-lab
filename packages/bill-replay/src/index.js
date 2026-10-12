import { createHash } from 'node:crypto';

const locales = ['fr', 'en', 'es'];
const copy = {
  invalid: ['Entrée invalide.', 'Invalid input.', 'Entrada no válida.'],
  notice: [
    'Rapprochement local des données fournies, sans vérification du fournisseur ni avis juridique. Une ligne non expliquée reste non expliquée.',
    'Local reconciliation of supplied data, without supplier verification or legal opinion. An unexplained line remains unexplained.',
    'Conciliación local de los datos aportados, sin verificar al proveedor ni emitir asesoría jurídica. Una línea sin explicar sigue sin explicar.',
  ],
  summary: [
    '{findings} écart(s) ou manque(s) ; énergie {status}.',
    '{findings} discrepancy/discrepancies or gaps; energy {status}.',
    '{findings} discrepancia(s) o faltante(s); energía {status}.',
  ],
  complete: ['calculable', 'replayable', 'calculable'],
  incomplete: ['non calculable', 'not replayable', 'no calculable'],
  RATE_GAP: [
    'Tarif absent pour un relevé.',
    'No rate covers a reading.',
    'Falta una tarifa para una lectura.',
  ],
  RATE_OVERLAP: [
    'Plusieurs tarifs couvrent un relevé.',
    'Multiple rates cover a reading.',
    'Varias tarifas cubren una lectura.',
  ],
  METER_DUPLICATE: [
    'Horodatage de relevé répété.',
    'Repeated meter timestamp.',
    'Marca temporal de lectura repetida.',
  ],
  METER_MISSING: [
    'Aucun relevé fourni.',
    'No meter readings supplied.',
    'No se aportaron lecturas del contador.',
  ],
  OUT_OF_PERIOD: [
    'Relevé hors période.',
    'Reading outside the period.',
    'Lectura fuera del período.',
  ],
  ENERGY_MISMATCH: [
    'La ligne énergie facturée diffère du calcul.',
    'Billed energy differs from replay.',
    'La energía facturada difiere del cálculo.',
  ],
  CHARGE_MISSING: [
    'Ligne attendue absente de la facture.',
    'Expected charge missing from invoice.',
    'Falta en la factura un cargo esperado.',
  ],
  CHARGE_MISMATCH: [
    'Montant de charge différent.',
    'Charge amount differs.',
    'El importe del cargo difiere.',
  ],
  UNMAPPED_INVOICE: [
    'Ligne facturée sans règle fournie.',
    'Billed line has no supplied rule.',
    'Línea facturada sin regla aportada.',
  ],
};
const message = (key, locale, vars = {}) => {
  const index = locales.indexOf(locale);
  if (index < 0) throw Error('Locale / Langue / Idioma: fr, en, es');
  return copy[key][index].replace(/\{(\w+)\}/g, (_, field) => vars[field]);
};
const object = (v) => v && typeof v === 'object' && !Array.isArray(v);
const string = (v) => typeof v === 'string' && v.trim() !== '';
const instant = (v) =>
  typeof v === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(v) &&
  Number.isFinite(Date.parse(v));
const decimal = (v, digits, allowNegative = false) => {
  const pattern =
    digits === 0
      ? `^${allowNegative ? '-?' : ''}\\d+$`
      : `^${allowNegative ? '-?' : ''}\\d+(?:\\.\\d{1,${digits}})?$`;
  if (!string(v) || !new RegExp(pattern).test(v)) throw Error('invalid');
  const [whole, fraction = ''] = v.split('.');
  return (
    BigInt(whole) * 10n ** BigInt(digits) +
    BigInt((whole.startsWith('-') ? '-' : '') + (fraction.padEnd(digits, '0') || '0'))
  );
};
const cents = (v) => decimal(v, 0, true);
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const roundCents = (microEuroKwh) => (microEuroKwh * 100n + 500000000000n) / 1000000000000n;
const sortIds = (rows) => rows.map((row) => row.id).sort();

export function replayBill(input, { locale = 'fr' } = {}) {
  message('invalid', locale);
  try {
    if (
      !object(input) ||
      !object(input.period) ||
      !instant(input.period.from) ||
      !instant(input.period.to) ||
      Date.parse(input.period.from) >= Date.parse(input.period.to) ||
      !Array.isArray(input.meter) ||
      !Array.isArray(input.tariffs) ||
      !Array.isArray(input.charges) ||
      !object(input.invoice) ||
      !Array.isArray(input.invoice.charges)
    )
      throw Error('invalid');
    const readings = input.meter.map((row) => {
      if (!object(row) || !instant(row.at) || !string(row.source)) throw Error('invalid');
      return { ...row, units: decimal(row.kWh, 6), time: Date.parse(row.at) };
    });
    const rates = input.tariffs.map((row) => {
      if (
        !object(row) ||
        !string(row.id) ||
        !instant(row.from) ||
        !instant(row.to) ||
        Date.parse(row.from) >= Date.parse(row.to) ||
        !string(row.source)
      )
        throw Error('invalid');
      return {
        ...row,
        value: decimal(row.euroPerKWh, 6),
        fromMs: Date.parse(row.from),
        toMs: Date.parse(row.to),
      };
    });
    const charges = input.charges.map((row) => {
      if (!object(row) || !string(row.id) || !string(row.source)) throw Error('invalid');
      return { ...row, value: cents(row.expectedCents) };
    });
    const billed = input.invoice.charges.map((row) => {
      if (!object(row) || !string(row.id)) throw Error('invalid');
      return { ...row, value: cents(row.cents) };
    });
    const energyBilled = cents(input.invoice.energyCents);
    for (const rows of [rates, charges, billed])
      if (new Set(sortIds(rows)).size !== rows.length) throw Error('invalid');
    const findings = [];
    const add = (code, ref) => findings.push({ code, message: message(code, locale), ref });
    const seen = new Set();
    let product = 0n;
    let covered = readings.length > 0;
    const lines = [];
    if (!covered) add('METER_MISSING', 'meter');
    for (const row of readings) {
      const key = new Date(row.time).toISOString();
      if (seen.has(key)) {
        add('METER_DUPLICATE', row.source);
        covered = false;
        continue;
      }
      seen.add(key);
      if (row.time < Date.parse(input.period.from) || row.time >= Date.parse(input.period.to)) {
        add('OUT_OF_PERIOD', row.source);
        covered = false;
        continue;
      }
      const match = rates.filter((rate) => rate.fromMs <= row.time && row.time < rate.toMs);
      if (match.length !== 1) {
        add(match.length ? 'RATE_OVERLAP' : 'RATE_GAP', row.source);
        covered = false;
        continue;
      }
      product += row.units * match[0].value;
      lines.push({
        at: row.at,
        kWh: row.kWh,
        tariffId: match[0].id,
        meterSource: row.source,
        tariffSource: match[0].source,
      });
    }
    const energyExpected = covered ? roundCents(product) : null;
    if (energyExpected !== null && energyExpected !== energyBilled)
      add('ENERGY_MISMATCH', 'invoice.energyCents');
    const chargeLines = charges.map((charge) => {
      const line = billed.find((item) => item.id === charge.id);
      if (!line) add('CHARGE_MISSING', charge.id);
      else if (line.value !== charge.value) add('CHARGE_MISMATCH', charge.id);
      return {
        id: charge.id,
        expectedCents: charge.value.toString(),
        billedCents: line?.value.toString() ?? null,
        source: charge.source,
      };
    });
    for (const line of billed)
      if (!charges.some((charge) => charge.id === line.id)) add('UNMAPPED_INVOICE', line.id);
    return {
      schemaVersion: 1,
      locale,
      notice: message('notice', locale),
      summary: message('summary', locale, {
        findings: findings.length,
        status: message(covered ? 'complete' : 'incomplete', locale),
      }),
      inputSha256: hash(input),
      energy: {
        complete: covered,
        expectedCents: energyExpected?.toString() ?? null,
        billedCents: energyBilled.toString(),
        includedReadings: lines.length,
        totalReadings: readings.length,
        lines,
      },
      charges: chargeLines,
      findings,
    };
  } catch {
    throw Error(message('invalid', locale));
  }
}
