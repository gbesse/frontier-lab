# Exit

Migrate a bounded workflow into a small application its owner can run independently. Local alpha, MIT, Node.js 22+. Package: `@gbesse/exit-workflow` (not yet published).

Current domain: customers, service interventions, notes, statuses and attachments. This is not a universal SaaS clone.

## CLI

After `npm ci` at the workspace root:

```sh
npx exit-workflow inspect source.json
npx exit-workflow generate source.json NEW_DIRECTORY
cd NEW_DIRECTORY
npm start
```

The generated app needs **Node only**, no npm installation or API key. It runs at `http://127.0.0.1:4318` (`PORT` configurable). Search interventions, edit status/notes, retrieve attachments and export the updated dataset. Writes persist atomically to `data.json`; stale revisions are rejected. The app is local, single-user, not a multi-tenant hosted product.

## Source contract

```json
{
  "customers": [{ "id": "c-1", "name": "Example workshop", "email": "example@example.test" }],
  "tickets": [
    {
      "id": "t-1",
      "customerId": "c-1",
      "title": "Install lamps",
      "status": "open",
      "notes": "Two lamps"
    }
  ],
  "attachments": [
    { "id": "a-1", "ticketId": "t-1", "filename": "note.txt", "contentBase64": "aGk=" }
  ]
}
```

Supported destination statuses: `open`, `scheduled`, `done`. IDs must be unique strings; all relationships must resolve. Attachments use canonical base64, a SHA-256 checksum and a combined decoded 20 MiB limit. The studio has a smaller 8 MiB request limit; use the API/CLI for larger supported exports.

`--mapping mapping.json` maps destination fields to source names and source statuses to destination statuses. See exported `defaultMapping`. `exit-workflow csv file.csv` parses one comma-separated CSV collection, including quoted line breaks and escaped quotes; combine collections into the source JSON explicitly.

```js
import { migrate, generate, defaultMapping } from '@gbesse/exit-workflow';
const { data, report } = migrate(source, defaultMapping);
if (report.ok && !report.unmapped.length) {
  await generate(source, defaultMapping, '/absolute/new-directory');
}
```

## Loss is explicit

Invalid IDs, unknown statuses, orphan records and broken attachments block generation. Extra fields are enumerated in `report.unmapped`. Generation requires `--accept-loss` / `{acceptLoss:true}` when such fields exist: their original data remain in `source.json`, but their behavior is not implemented in the app.

The output includes source, mapping, migration report, initial file-hash manifest, application source and software license. The manifest describes generation-time bytes, not later edits. Existing directories are never overwritten. Back up the entire generated directory. Partial output may remain on an unexpected disk write failure; inspect it and use a new directory for a retry.

No source-system permissions, automations, historical semantics or third-party integrations are inferred. Localhost binding and request tokens are defenses for local use, not deployment authentication. Do not expose the generated app on the public internet without a separate security architecture. Data files are private and are not relicensed by the software license.
