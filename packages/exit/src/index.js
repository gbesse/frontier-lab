import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const digest = (value) => createHash('sha256').update(value).digest('hex');
const fail = (code, message) => {
  throw Object.assign(new Error(message), { code });
};
const fields = {
  customers: ['id', 'name', 'email'],
  tickets: ['id', 'customerId', 'title', 'status', 'notes'],
};
export const defaultMapping = {
  customers: { id: 'id', name: 'name', email: 'email' },
  tickets: { id: 'id', customerId: 'customerId', title: 'title', status: 'status', notes: 'notes' },
  statuses: { open: 'open', scheduled: 'scheduled', done: 'done' },
};

export function parseCSV(text) {
  if (typeof text !== 'string') fail('INVALID_CSV', 'CSV text required');
  text = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [],
    cell = '',
    quoted = false,
    closed = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
      continue;
    }
    if (c === '"') {
      if (cell || closed) fail('INVALID_CSV', 'Quote inside unquoted field');
      quoted = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
      closed = false;
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      closed = false;
    } else {
      if (closed) fail('INVALID_CSV', 'Unexpected characters after closing quote');
      cell += c;
    }
  }
  if (quoted) fail('INVALID_CSV', 'Unclosed quoted field');
  if (cell || row.length || closed) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows.shift();
  if (
    headers.some((h) => !h || ['__proto__', 'constructor', 'prototype'].includes(h)) ||
    new Set(headers).size !== headers.length
  )
    fail('INVALID_CSV', 'Headers must be unique, nonempty and safe');
  return rows
    .filter((r) => !(r.length === 1 && r[0] === ''))
    .map((r, i) => {
      if (r.length !== headers.length)
        fail('INVALID_CSV', `Row ${i + 2}: expected ${headers.length} cells, got ${r.length}`);
      return Object.fromEntries(headers.map((h, j) => [h, r[j]]));
    });
}

export function migrate(source, mapping = defaultMapping) {
  if (!source || typeof source !== 'object' || Array.isArray(source))
    fail('INVALID_EXPORT', 'Object export required');
  const errors = [],
    warnings = [],
    unmapped = [],
    data = { schemaVersion: 1, revision: 0, customers: [], tickets: [], attachments: [] };
  for (const type of ['customers', 'tickets']) {
    if (!Array.isArray(source[type])) {
      errors.push({ code: 'MISSING_COLLECTION', path: type, message: `${type} must be an array` });
      continue;
    }
    if (!mapping[type] || typeof mapping[type] !== 'object')
      fail('INVALID_MAPPING', `${type} mapping required`);
    for (const target of Object.keys(mapping[type]))
      if (!fields[type].includes(target))
        fail('INVALID_MAPPING', `Unknown target ${type}.${target}`);
    for (const src of Object.values(mapping[type]))
      if (typeof src !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(src))
        fail('INVALID_MAPPING', 'Mapping values must be safe field names');
    const seen = new Set();
    source[type].forEach((row, i) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        errors.push({
          code: 'INVALID_RECORD',
          path: `${type}/${i}`,
          message: 'Record object required',
        });
        return;
      }
      const dest = {};
      for (const field of fields[type]) {
        const key = mapping[type][field];
        let value = key && Object.hasOwn(row, key) ? row[key] : undefined;
        if (value === undefined && ['notes', 'email'].includes(field)) value = '';
        if (typeof value !== 'string' || (!['notes', 'email'].includes(field) && !value.trim()))
          errors.push({
            code: 'INVALID_FIELD',
            path: `${type}/${i}/${field}`,
            message: 'Expected a nonempty string (notes/email may be empty)',
          });
        dest[field] = value ?? '';
      }
      if (seen.has(dest.id))
        errors.push({
          code: 'DUPLICATE_ID',
          path: `${type}/${i}/id`,
          message: `Duplicate ID ${dest.id}`,
        });
      seen.add(dest.id);
      if (type === 'tickets') {
        const status =
          mapping.statuses && Object.hasOwn(mapping.statuses, dest.status)
            ? mapping.statuses[dest.status]
            : null;
        if (!['open', 'scheduled', 'done'].includes(status))
          errors.push({
            code: 'UNMAPPED_STATUS',
            path: `tickets/${i}/status`,
            message: `Map source status ${dest.status}`,
          });
        else dest.status = status;
      }
      for (const key of Object.keys(row))
        if (!Object.values(mapping[type]).includes(key))
          unmapped.push({ path: `${type}/${i}/${key}`, field: key });
      data[type].push(dest);
    });
  }
  const customerIds = new Set(data.customers.map((c) => c.id)),
    ticketIds = new Set(data.tickets.map((t) => t.id));
  for (const t of data.tickets)
    if (!customerIds.has(t.customerId))
      errors.push({
        code: 'ORPHAN_TICKET',
        path: `tickets/${t.id}/customerId`,
        message: `Unknown customer ${t.customerId}`,
      });
  if (source.attachments !== undefined && !Array.isArray(source.attachments))
    errors.push({ code: 'INVALID_ATTACHMENTS', path: 'attachments', message: 'Array required' });
  const attachmentIds = new Set();
  let bytes = 0;
  for (const [i, a] of (Array.isArray(source.attachments) ? source.attachments : []).entries()) {
    if (
      !a ||
      typeof a !== 'object' ||
      !['id', 'ticketId', 'filename'].every((k) => typeof a[k] === 'string' && a[k]) ||
      typeof a.contentBase64 !== 'string'
    ) {
      errors.push({
        code: 'INVALID_ATTACHMENT',
        path: `attachments/${i}`,
        message: 'id, ticketId, filename and contentBase64 are required',
      });
      continue;
    }
    if (attachmentIds.has(a.id))
      errors.push({ code: 'DUPLICATE_ATTACHMENT', path: `attachments/${i}`, message: a.id });
    attachmentIds.add(a.id);
    if (!ticketIds.has(a.ticketId))
      errors.push({ code: 'ORPHAN_ATTACHMENT', path: `attachments/${i}`, message: a.ticketId });
    if (
      !/^[A-Za-z0-9+/]*={0,2}$/.test(a.contentBase64) ||
      Buffer.from(a.contentBase64, 'base64').toString('base64') !== a.contentBase64
    ) {
      errors.push({
        code: 'INVALID_BASE64',
        path: `attachments/${i}`,
        message: 'Canonical base64 required',
      });
      continue;
    }
    const buffer = Buffer.from(a.contentBase64, 'base64');
    bytes += buffer.length;
    if (bytes > 20 * 1024 * 1024)
      errors.push({
        code: 'ATTACHMENT_LIMIT',
        path: `attachments/${i}`,
        message: 'Combined attachments exceed 20 MiB',
      });
    data.attachments.push({
      id: a.id,
      ticketId: a.ticketId,
      filename: a.filename,
      contentBase64: a.contentBase64,
      sha256: digest(buffer),
      bytes: buffer.length,
    });
    for (const key of Object.keys(a))
      if (!['id', 'ticketId', 'filename', 'contentBase64'].includes(key))
        unmapped.push({ path: `attachments/${i}/${key}`, field: key });
  }
  for (const key of Object.keys(source))
    if (!['customers', 'tickets', 'attachments'].includes(key))
      unmapped.push({ path: key, field: key });
  if (unmapped.length)
    warnings.push(
      'Some source fields have no active destination behavior. Originals are retained in source.json; accepting this loss is required to generate.',
    );
  const report = {
    schemaVersion: 1,
    ok: errors.length === 0,
    errors,
    warnings,
    unmapped,
    counts: {
      customers: data.customers.length,
      tickets: data.tickets.length,
      attachments: data.attachments.length,
    },
    attachmentBytes: bytes,
    sourceSha256: digest(JSON.stringify(source)),
    dataSha256: digest(JSON.stringify(data)),
    limitations: [
      'No automatic recreation of source permissions, automations or historical behavior.',
      'The generated application is single-user and localhost-only.',
      'Field mapping is explicit; no AI inferred mapping is silently applied.',
    ],
  };
  return { data, report };
}

export async function generate(source, mapping, directory, { acceptLoss = false } = {}) {
  const { data, report } = migrate(source, mapping);
  if (!report.ok) fail('MIGRATION_BLOCKED', JSON.stringify(report.errors));
  if (report.unmapped.length && !acceptLoss)
    fail(
      'UNACCEPTED_LOSS',
      'Review unmapped fields, then explicitly accept loss of their active behavior',
    );
  const destination = resolve(directory);
  await mkdir(destination, { recursive: false, mode: 0o700 });
  const files = {
    LICENSE: await readFile(new URL('../LICENSE', import.meta.url), 'utf8'),
    'data.json': JSON.stringify(data, null, 2),
    'source.json': JSON.stringify(source, null, 2),
    'mapping.json': JSON.stringify(mapping ?? defaultMapping, null, 2),
    'migration-report.json': JSON.stringify({ ...report, acceptedLoss: acceptLoss }, null, 2),
    'package.json': JSON.stringify(
      {
        name: 'exit-owned-workflow',
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: { start: 'node server.js' },
        engines: { node: '>=22' },
      },
      null,
      2,
    ),
    'server.js': await readFile(new URL('./portable-server.js', import.meta.url), 'utf8'),
    'index.html': await readFile(new URL('./portable.html', import.meta.url), 'utf8'),
    'README.md':
      '# Your intervention workspace\n\nRun `npm start` with Node 22+. No npm install or external service required. Opens at http://127.0.0.1:4318 (or PORT). Single-user local application. Edit ticket status/notes, search, download original attachments, export the current dataset. Original input, mapping and migration report are retained. Initial migration hashes do not describe later edits. Back up the entire directory. No authentication for remote use: the server deliberately binds to loopback only.\n',
  };
  const manifest = { schemaVersion: 1, files: {} };
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(destination, name), content, { flag: 'wx', mode: 0o600 });
    manifest.files[name] = digest(content);
  }
  await writeFile(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2), {
    flag: 'wx',
    mode: 0o600,
  });
  return { directory: destination, report, manifest };
}
