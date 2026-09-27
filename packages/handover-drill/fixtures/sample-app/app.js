import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const records = JSON.parse(await readFile('data.json', 'utf8'));
createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  if (request.url === '/health') response.end(JSON.stringify({ ok: true }));
  else if (request.url === '/records')
    response.end(
      JSON.stringify({
        count: records.length,
        latest: records.at(-1).id,
        secretPresent: Boolean(process.env.FRONTIER_HANDOVER_SECRET_CANARY),
      }),
    );
  else {
    response.statusCode = 404;
    response.end(JSON.stringify({ code: 'NOT_FOUND' }));
  }
}).listen(Number(process.env.PORT), '127.0.0.1');
