import http from 'node:http';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = new URL('./', import.meta.url),
  token = randomBytes(24).toString('hex');
const statePath = fileURLToPath(new URL('data.json', root));
let data = JSON.parse(readFileSync(statePath, 'utf8'));
const page = readFileSync(new URL('index.html', root), 'utf8').replace('__TOKEN__', token);
const json = (res, status, value) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(value));
};
const server = http.createServer(async (req, res) => {
  try {
    const address = server.address();
    const expected = `127.0.0.1:${address.port}`;
    if (req.headers.host !== expected && req.headers.host !== `localhost:${address.port}`)
      return json(res, 403, { error: 'Invalid Host' });
    const url = new URL(req.url, `http://${expected}`);
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
      });
      res.end(page);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/data') return json(res, 200, data);
    if (req.method === 'GET' && url.pathname === '/api/attachment') {
      const a = data.attachments.find((a) => a.id === url.searchParams.get('id'));
      if (!a) return json(res, 404, { error: 'Not found' });
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(a.filename)}`,
      });
      res.end(Buffer.from(a.contentBase64, 'base64'));
      return;
    }
    if (req.method === 'PATCH' && url.pathname === '/api/ticket') {
      if (
        req.headers['x-workspace-token'] !== token ||
        (req.headers.origin &&
          !['http://' + expected, `http://localhost:${address.port}`].includes(req.headers.origin))
      )
        return json(res, 403, { error: 'Invalid request origin/token' });
      let body = '';
      for await (const c of req) {
        body += c;
        if (Buffer.byteLength(body) > 100000) return json(res, 413, { error: 'Request too large' });
      }
      const input = JSON.parse(body);
      if (input.revision !== data.revision)
        return json(res, 409, { error: 'Workspace changed; refresh before editing' });
      if (
        !['open', 'scheduled', 'done'].includes(input.status) ||
        typeof input.notes !== 'string' ||
        input.notes.length > 20000
      )
        return json(res, 422, { error: 'Invalid status/notes' });
      const draft = structuredClone(data),
        ticket = draft.tickets.find((t) => t.id === input.id);
      if (!ticket) return json(res, 404, { error: 'Unknown ticket' });
      ticket.status = input.status;
      ticket.notes = input.notes;
      draft.revision++;
      writeFileSync(statePath + '.tmp', JSON.stringify(draft, null, 2), { mode: 0o600 });
      renameSync(statePath + '.tmp', statePath);
      data = draft;
      return json(res, 200, { ok: true, revision: data.revision });
    }
    json(res, 404, { error: 'Not found' });
  } catch (e) {
    json(res, 400, { error: e.message });
  }
});
server.listen(Number(process.env.PORT ?? 4318), '127.0.0.1', () =>
  console.log(`Exit workspace: http://127.0.0.1:${server.address().port}`),
);
