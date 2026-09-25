# Agent Checkout Lab

Test whether a bounded quote journey actually writes the expected business data. Local alpha, MIT, Node.js 22+. Package: `@gbesse/agent-checkout-lab` (not yet published).

Uses real Playwright Chromium and an independent server readback. A success-looking page is not enough.

## Run

From the workspace root: `npm ci`, `npx playwright install chromium`, `npm start`. Use the studio's Checkout panel, or:

```sh
npx agent-checkout-lab run 'http://127.0.0.1:4317/fixture/checkout?mode=after' task.json --allow-submit --driver semantic --out output/checkout
```

`task.json`:

```json
{ "customerName": "Atelier Delta", "email": "achats@example.test", "sku": "lamp", "quantity": 4 }
```

Without `--allow-submit`, the runner refuses to open a browser. Submission authorization must cover the chosen site; use a sandbox with synthetic data. Exit code 1 means the journey failed; 2 means invalid configuration.

## Three drivers, different claims

- `semantic`: deterministic exact-label/role locators for the French reference form. The deliberately unassociated labels in `mode=before` fail; corrected labels in `mode=after` pass. This does **not** prove that all agents fail before, or that all succeed after.
- `structured`: calls the reference site's bounded `window.checkoutTools.requestQuote` adapter. This is a custom adapter, **not a claim of native WebMCP interoperability**. The fixture has optional experimental registration; that registration is not part of the verified path.
- `model`: an optional compatible chat-completions provider chooses among three bounded operations, up to eight steps. Configure `MODEL_BASE_URL` (including `/v1` where needed), `MODEL_NAME`, and optional `MODEL_API_KEY` in your shell; never commit secrets. The form observation and synthetic task are sent to the provider. Actual controls and values remain constrained by the runner. Provider charges may apply. No real-provider quality benchmark has been performed.

## Verification contract

The sandbox must support a stored quote readback at `GET /api/quote/:id`, returning `id`, `customerName`, `email`, `sku`, `quantity`, `simulation:true`. The runner compares all four task fields exactly. The semantic fixture submits to `POST /api/quote`; arbitrary sites need their own adapter and independent oracle.

Reports include steps, error, receipt, observed submissions, blocked request origins, duration, driver identity, screenshot path and scope limitations. Their `syntheticAgent` flag distinguishes deterministic baselines from a configured model driver. Receipts in the included studio are in-memory test data.

Cross-origin page HTTP requests are blocked and service workers disabled. This is not a hardened browser/network sandbox for malicious websites. Readback redirects are disallowed. Do not run against production checkout flows or sensitive documents without explicit authorization and a suitable isolation architecture.

No purchase is performed, no payment credentials are used, and there is no conversion-lift claim. An end-to-end baseline and a mocked provider protocol test are useful plumbing evidence, not evidence about any real model's capabilities.
