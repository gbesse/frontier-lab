# Frontier Lab

English · [Español](README.es.md) · [Français](README.md)

Eleven open-source projects in a **local alpha**: four in the interactive studio and seven command-line labs. Names and scope are provisional. This repository is not a hosted service, and its packages are not published on npm.

The agent extensions have their own repositories: [Agent Commerce Ledger for OpenClaw and Hermes](https://github.com/gbesse/agent-commerce-ledger) records message receipts and approvals for configured tools; [Caller Context for OpenClaw](https://github.com/gbesse/openclaw-caller-context) looks up local caller context. They do not create CRM contacts or send follow-ups.

| Project                | What works                                                                                                                                        | Explicit limit of this alpha                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Teachpack**          | Follows a shared window or screen, reads text locally and creates a reviewable visual guide; also compiles structured demonstrations into a skill | The visual guide recognizes screen states but does not control other applications                                                   |
| **Branch**             | Simulates orders, stock reservations, customer credit and notifications, with forks and injected failures                                         | An explicit in-memory business model, not an automatic ERP clone or an arbitrary-code sandbox                                       |
| **Exit**               | Turns a customer/job/attachment export into an editable standalone application                                                                    | Explicit mapping, local single-user app; original SaaS permissions and automations are not recreated                                |
| **Agent Checkout Lab** | Tests a quote journey in Chromium and checks the data actually saved                                                                              | A `/api/quote` test contract and deterministic drivers, not a universal agent-compatibility score or proof of commercial conversion |

The seven labs are separate from the studio; their demos connect to no external service:

| Project                  | First executable proof                                                                    | Explicit limit                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Machine Data Lab**     | Reconciles two synthetic machine exports, normalizes units and flags gaps with provenance | Access rights are declared, not verified; no manufacturer access or Data Act verdict |
| **Supplier Evidence**    | Reuses synthetic evidence for two buyers with hash checking and scoped disclosure         | Does not verify claim truth or product-passport compliance                           |
| **Handover Drill**       | Copies a small app, restores a snapshot and checks a business outcome                     | Trusted code only; does not prove production recovery                                |
| **Payee Exceptions**     | Triages supplied VoP results and flags cases needing review                               | Does not contact banks or initiate payments                                          |
| **Invoice Path**         | Reconciles accounting-firm and platform events and flags route gaps                       | Sends no invoices and does not implement platform APIs                               |
| **Provenance Last Mile** | Compares C2PA manifests in local files before and after publication                       | Delegates validation to `c2patool`; demo is synthetic                                |
| **PQC Cutover**          | Reviews observed hybrid TLS negotiation and fallback attempts                             | Does not collect handshakes or certify security                                      |

```sh
node packages/machine-data/bin/cli.js demo --locale=en
node packages/supplier-evidence/bin/cli.js demo --locale=en
node packages/handover-drill/bin/cli.js demo --locale=en
node packages/payee-exceptions/bin/cli.js demo --locale=en
node packages/invoice-path/bin/cli.js demo --locale=en
node packages/provenance-last-mile/bin/cli.js demo --locale=en
node packages/pqc-cutover/bin/cli.js demo --locale=en
```

## Quick tour of the seven labs

`npm run demo:labs -- --locale=en` runs all seven offline demonstrations and collects their summaries and limits in one JSON report. Data is synthetic; no account or external service is required. Choose `fr` or `es` for the other languages.

## Try it

Use Node.js 22+ and npm. On macOS, Teachpack uses Apple Vision for local screen-text recognition. Choose the window or display in the browser's sharing dialog; try Chrome if the in-app browser has no screen-sharing option. No account or API key is required.

```sh
npm ci
npx playwright install chromium
npm start
```

Open **http://127.0.0.1:4317**. The server listens on localhost only. Use `PORT=4320 npm start` for another port. Studio data and reports live in Git-ignored `.local/`. No real email, order or external service is involved.

The studio supports French, English and Spanish: choose **FR / EN / ES** at the top right. The choice persists in your browser. Teachpack localizes its interface, follow-up messages and generated default steps, and prioritizes these languages in local OCR. Visible screen text and your own labels remain as written; they are not automatically translated.

Teachpack can also detect clicks on macOS if you opt in before sharing a full display. The first Input Monitoring permission may need to be granted in System Settings. This alpha records click time and position, not the clicked control's identity or keystrokes; one active display is supported. Screen capture remains available if permission is denied.

During live follow, the guide now shows a locally stored reference screenshot. When clicks were recorded, dots indicate their approximate positions on the previous screen; they do not identify a particular button or trigger any action.

Suggested five-minute tour:

1. **Teachpack:** open “Show your screen”, select a window, perform two visible steps, stop, select useful frames and create a guide. Share the window again to see live recognition. The structured-tool demo remains in the technical section below.
2. **Branch:** run the five scenarios and inspect expected errors, effects already committed and absence of duplicates.
3. **Exit:** inspect the sample export, generate and download the application. Extract it, enter the generated directory and run `npm start`. It starts on port 4318 without `npm install`.
4. **Checkout:** run the semantic driver before and after the accessibility fix, then the structured driver. The expected results are fail/pass/pass. Missing labels deliberately block this semantic driver, not all possible agents.

Teachpack captures and Exit exports stay on your disk in `.local/`; they may include sensitive visible content. Do not publish `.local/` or `output/`. Test-site quotes are in memory; test reports persist.

## Verify

```sh
npm test               # business rules, learning, migration, API and persistence
npm run demo           # skill, rehearsal and standalone app in output/
npm run test:browser   # Chromium, studio, generated app, quotes, simulated sharing (Apple Vision on Mac)
npm run pack:check     # pack, install and run each CLI outside the monorepo
npm run format:check
npm audit --audit-level=moderate
```

On Linux CI, install system libraries with `npx playwright install --with-deps chromium`. `pack:check` uses npm to install Playwright in a temporary directory; our package tarballs remain local. The GitHub workflow tests Node 22 and 24 on Linux; a macOS check of the Swift bridges can be run manually. None of these tests grants the system click-monitoring permission.

## Eleven packages, four in the shared studio

```text
packages/teachpack/         → symbolic learning + CLI
packages/branch/            → business simulator + CLI
packages/exit/              → migration + standalone-app generator + CLI
packages/checkout/          → browser + business-result verification + CLI
packages/machine-data/      → machine-export reconciliation + CLI
packages/supplier-evidence/ → scoped supplier-evidence sharing + CLI
packages/handover-drill/    → application handover drill + CLI
packages/payee-exceptions/  → VoP exception triage + CLI
packages/invoice-path/      → invoice-event reconciliation + CLI
packages/provenance-last-mile/ → post-publication C2PA check + CLI
packages/pqc-cutover/       → hybrid TLS cutover observation review + CLI
studio/                     → local studio and test site
test/                       → rules, integration and browser tests
```

Each package has its own README, MIT license, ESM exports and executable, and can be packed independently. Teachpack uses Branch for its rehearsal command. This monorepo supports cross-project experiments; it does not imply that eleven separate GitHub repositories already exist.

Detailed references: [Teachpack](packages/teachpack/README.md), [Branch](packages/branch/README.md), [Exit](packages/exit/README.md), [Agent Checkout](packages/checkout/README.md), [Machine Data Lab](packages/machine-data/README.md), [Supplier Evidence](packages/supplier-evidence/README.md), [Handover Drill](packages/handover-drill/README.md), [Payee Exceptions](packages/payee-exceptions/README.md), [Invoice Path](packages/invoice-path/README.md), [Provenance Last Mile](packages/provenance-last-mile/README.md) and [PQC Cutover](packages/pqc-cutover/README.md). See [security and limits](SECURITY.md) and [contributing](CONTRIBUTING.md). Strategy and launch notes stay local and are not part of the public repository.

## Status

These are alpha implementations, not commercially validated products. Local validation has not used a real LLM provider. The optional model driver needs explicit configuration and may incur provider charges. Click detection has been tested with a simulated event; system permission and a real click still need a consenting macOS test before claiming end-to-end validation.

MIT — see [LICENSE](LICENSE).

## Tour one lab

`npm run demo:labs -- --locale=en --project=payee-exceptions` runs only the chosen offline demonstration. The seven valid names are listed above; an unknown name is rejected.

## Contrôle d’adoption · Adoption check · Comprobación de adopción

[Try a synthetic adoption case](examples/adoption-check.md).

Run `npm run demo:branch-failure` to see a synthetic notification failure after confirmation: the command checks that the order stays confirmed and no message is queued. This does not simulate an ERP transaction or send real mail.
