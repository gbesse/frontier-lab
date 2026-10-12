# Frontier Lab

English · [Español](README.es.md) · [Français](README.md)

Frontier Lab is the general software catalogue. Matter Lab groups fabrication and hardware tools; the space projects now have three standalone repositories: [Mission Benchmark Commons](https://github.com/gbesse/mission-benchmark-commons), [Contact Market](https://github.com/gbesse/contact-market), [Citizen Mission](https://github.com/gbesse/citizen-mission). Each repository can be cloned and run separately, with FR/EN/ES UI and documentation, an MIT license, specialized engines, archived evidence and shareable challenges.

Thirty-one open-source projects in a **local alpha**: four in the main studio, sixteen command-line labs, Space Mission Lab and ten fabrication tools and labs in Matter Lab. Names and scope are provisional. This repository is not a hosted service, and its packages are not published on npm.

The agent extensions have their own repositories: [Agent Commerce Ledger for OpenClaw and Hermes](https://github.com/gbesse/agent-commerce-ledger) records message receipts and approvals for configured tools; [Caller Context for OpenClaw](https://github.com/gbesse/openclaw-caller-context) looks up local caller context. They do not create CRM contacts or send follow-ups.

| Project                | What works                                                                                                                                        | Explicit limit of this alpha                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Teachpack**          | Follows a shared window or screen, reads text locally and creates a reviewable visual guide; also compiles structured demonstrations into a skill | The visual guide recognizes screen states but does not control other applications                                                   |
| **Branch**             | Simulates orders, stock reservations, customer credit and notifications, with forks and injected failures                                         | An explicit in-memory business model, not an automatic ERP clone or an arbitrary-code sandbox                                       |
| **Exit**               | Turns a customer/job/attachment export into an editable standalone application                                                                    | Explicit mapping, local single-user app; original SaaS permissions and automations are not recreated                                |
| **Agent Checkout Lab** | Tests a quote journey in Chromium and checks the data actually saved                                                                              | A `/api/quote` test contract and deterministic drivers, not a universal agent-compatibility score or proof of commercial conversion |

The sixteen labs are separate from the studio; their demos connect to no external service:

| Project                  | First executable proof                                                                    | Explicit limit                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Machine Data Lab**     | Reconciles two synthetic machine exports, normalizes units and flags gaps with provenance | Access rights are declared, not verified; no manufacturer access or Data Act verdict |
| **Supplier Evidence**    | Reuses synthetic evidence for two buyers with hash checking and scoped disclosure         | Does not verify claim truth or product-passport compliance                           |
| **Handover Drill**       | Copies a small app, restores a snapshot and checks a business outcome                     | Trusted code only; does not prove production recovery                                |
| **Payee Exceptions**     | Triages supplied VoP results and flags cases needing review                               | Does not contact banks or initiate payments                                          |
| **Invoice Path**         | Reconciles accounting-firm and platform events and flags route gaps                       | Sends no invoices and does not implement platform APIs                               |
| **Provenance Last Mile** | Compares C2PA manifests in local files before and after publication                       | Delegates validation to `c2patool`; demo is synthetic                                |
| **PQC Cutover**          | Reviews observed hybrid TLS negotiation and fallback attempts                             | Does not collect handshakes or certify security                                      |
| **Bill Replay**          | Recalculates an energy line from meter readings and dated rates using exact decimal math  | Depends on supplied data; does not validate meter or contract                        |
| **GARAN Witness**        | Observes visible guarantee notices across a Chromium purchase journey                     | Does not certify product eligibility or official artwork                             |
| **Age Proof Lab**        | Tests `mdoc`/ZKP decisions against a negative matrix and finds HAR canaries               | Does not validate cryptography or certify compliance                                 |
| **Last Signal**          | Links declared assets to copper/2G/3G shutdown dates and replacement tests                | Does not discover devices or test live networks                                      |
| **Recall-to-Receipt**    | Matches recalls to sales and stock using GTIN, lot and period                             | Does not stop sales or send customer messages                                        |
| **DSN Replay**           | Simulates payroll corrections and flags duplicate corrections                             | Takes structured input, not native DSN/CRM files                                     |
| **Water Witness**        | Distinguishes measurements, quantification limits and missing water data by unit          | Does not issue a drinking-water safety verdict                                       |
| **CEE Proof Graph**      | Checks consistency of dated rules and declared evidence                                   | Synthetic demo rules; does not certify CEE eligibility                               |
| **PICS Stress Lab**      | Replays resource conflicts across six communes under injected failures                    | Fictional offline exercise; does not verify real responders or decision authority    |

```sh
node packages/machine-data/bin/cli.js demo --locale=en
node packages/supplier-evidence/bin/cli.js demo --locale=en
node packages/handover-drill/bin/cli.js demo --locale=en
node packages/payee-exceptions/bin/cli.js demo --locale=en
node packages/invoice-path/bin/cli.js demo --locale=en
node packages/provenance-last-mile/bin/cli.js demo --locale=en
node packages/pqc-cutover/bin/cli.js demo --locale=en
node packages/bill-replay/bin/cli.js demo --locale=en
node packages/garan-witness/bin/cli.js demo --locale=en
node packages/age-proof-lab/bin/cli.js demo --locale=en
node packages/last-signal/bin/cli.js demo --locale=en
node packages/recall-to-receipt/bin/cli.js demo --locale=en
node packages/dsn-replay/bin/cli.js demo --locale=en
node packages/water-witness/bin/cli.js demo --locale=en
node packages/cee-proof-graph/bin/cli.js demo --locale=en
node packages/pics-stress-lab/bin/cli.js demo --locale=en
```

## Quick tour of the seven labs

`npm run demo:labs -- --locale=en` runs all seven offline demonstrations and collects their summaries and limits in one JSON report. Data is synthetic; no account or external service is required. Choose `fr` or `es` for the other languages.

## Try it

Use Node.js 22+ and npm. Python 3 is required for the Hermes extension test. On macOS, Teachpack uses Apple Vision for local screen-text recognition. Choose the window or display in the browser's sharing dialog; try Chrome if the in-app browser has no screen-sharing option. No account or API key is required.

```sh
npm ci
npm run browsers:install
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

### Synthetic databases with Jev

`npm run synthetic:databases -- --locale=en --seed=20261001` creates three local SQLite databases in `output/synthetic-databases/20261001/`: maintenance, invoicing and simulated payee verification. Tables are related, amounts and timelines are checked, and the seed makes generation reproducible. Names, addresses and accounts are fictional. Use `--output=path` for another directory; an existing directory is not overwritten.

This command requires `TYPESAFE_API_KEY` in the environment or the Git-ignored `.env` file. It makes one paid Jev call per database and records its opinion, local checks, samples and SHA-256 hashes in `validation.json`. A “credible” verdict assesses only the supplied samples and distributions; it does not prove every row is realistic. `--offline` generates the same databases with local checks only and marks the Jev opinion unavailable. `--locale=fr` or `--locale=es` generates text and the report in the chosen language.

## Verify

```sh
npm test               # business rules, learning, migration, API and persistence
npm run demo           # skill, rehearsal and standalone app in output/
npm run test:browser   # Chromium, studio, generated app, quotes, simulated sharing (Apple Vision on Mac)
npm run pack:check     # pack, install and run each CLI outside the monorepo
npm run format:check
npm audit --audit-level=moderate
```

On Linux CI, install system libraries with `npm run browsers:install -- --with-deps`. `pack:check` uses npm to install Playwright in a temporary directory; our package tarballs remain local. The GitHub workflow tests Node 22 and 24 on Linux; a macOS check of the Swift bridges can be run manually. None of these tests grants the system click-monitoring permission.

## Thirty-one packages, four in the main studio

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
packages/bill-replay/       → electricity-bill reconciliation + CLI
packages/garan-witness/     → guarantee-notice observation + CLI
packages/age-proof-lab/     → age-verifier tests and canaries + CLI
packages/last-signal/       → copper and 2G/3G dependency audit + CLI
packages/recall-to-receipt/ → recall, sales and stock matching + CLI
packages/dsn-replay/        → DSN correction simulation + CLI
packages/water-witness/     → water-measurement provenance + CLI
packages/cee-proof-graph/   → CEE evidence consistency + CLI
packages/pics-stress-lab/   → intercommunal PCS/PICS resource exercise + CLI
studio/                     → local studio and test site
test/                       → rules, integration and browser tests
```

Each package has its own README, MIT license, ESM exports and executable, and can be packed independently. Teachpack uses Branch for its rehearsal command. This monorepo supports cross-project experiments; it does not imply that twenty separate GitHub repositories already exist.

Detailed references: [Teachpack](packages/teachpack/README.md), [Branch](packages/branch/README.md), [Exit](packages/exit/README.md), [Agent Checkout](packages/checkout/README.md), [Machine Data Lab](packages/machine-data/README.md), [Supplier Evidence](packages/supplier-evidence/README.md), [Handover Drill](packages/handover-drill/README.md), [Payee Exceptions](packages/payee-exceptions/README.md), [Invoice Path](packages/invoice-path/README.md), [Provenance Last Mile](packages/provenance-last-mile/README.md) and [PQC Cutover](packages/pqc-cutover/README.md). See [security and limits](SECURITY.md) and [contributing](CONTRIBUTING.md). Strategy and launch notes stay local and are not part of the public repository.

New labs: [Bill Replay](packages/bill-replay/README.md), [GARAN Witness](packages/garan-witness/README.md) and [Age Proof Lab](packages/age-proof-lab/README.md). The last tests synthetic observations and is not an age-proof certification.

This iteration adds [Last Signal](packages/last-signal/README.md), [Recall-to-Receipt](packages/recall-to-receipt/README.md), [DSN Replay](packages/dsn-replay/README.md), [Water Witness](packages/water-witness/README.md) and [CEE Proof Graph](packages/cee-proof-graph/README.md). External data and official rules still need validated connectors before operational use.

[PICS Stress Lab](packages/pics-stress-lab/README.md) adds a synthetic exercise for sharing resources across communes. It dispatches no real response.

## Status

These are alpha implementations, not commercially validated products. Local validation has not used a real LLM provider. The optional model driver needs explicit configuration and may incur provider charges. Click detection has been tested with a simulated event; system permission and a real click still need a consenting macOS test before claiming end-to-end validation.

MIT — see [LICENSE](LICENSE).

## Space Mission Lab

The expedition adds Light Cone, Relay Rescue, Space Credits and Signal Hunter: light delays to Proxima, relayed messages, fictional budgets and synthetic drift searches. Sourced SOTA atlas at `/space/explore?lang=en`, daily challenge, replayable links, PNG card and JSON passport. Links share settings, never mission JSON. `node packages/space-mission-lab/bin/cli.js frontier --locale=en --destination=proxima` runs the extension. The three commons below now execute Basilisk/Orekit, SGP4/OR-Tools/ION and blimpy/turboSETI on archived public data; the expedition keeps its synthetic models. No measured public traffic.

[Space Mission Lab](packages/space-mission-lab/README.md) combines four modules: multi-vehicle allocation, resource simulation, a trace-based rule assistant and autonomy fault trials. After `npm start`, open **http://127.0.0.1:4317/space**; UI and reports in FR / EN / ES. `node packages/space-mission-lab/bin/cli.js demo --locale=en` runs all four modules. These four modules use a local synthetic model without a real spacecraft connection. The commons add Basilisk/Orekit orbital dynamics separately; GMAT and cFS integrations remain to be built.

### SOTA+++ — space engines and challenges

All three tracks are executable: **Mission Benchmark Commons** (Basilisk/Orekit, ISS and JPL DE440s), **Contact Market** (SGP4, OR-Tools CP-SAT, ION BPv7/UDP manifest and local Ed25519 receipt), and **Citizen Mission** (real Voyager 1/GBT observation, blimpy and turboSETI on CPU). Routes `/space/commons/benchmark`, `/space/commons/market`, `/space/commons/citizen` ship in FR/EN/ES with daily challenges, predictions, share links, JSON and PNG. Fictional credits, scenario antennas and a known human carrier are explicitly identified.

`npm run space:setup` installs engines in `.local/space-runtime`. `npm run space:test:engines` checks actual computations. `npm run space:fixtures` records evidence; `npm run space:public` creates `output/space-public`, a publishable static site that replays recorded cases without exposing local APIs. Setup and limitations: [FR/EN/ES documentation](packages/space-mission-lab/README.md). No public deployment or measured traffic is presumed.

`npm run space:repositories -- /path/new-directory` extracts the three standalone applications from Git-tracked sources, with a provenance manifest. The destination directory must be new; local runtimes and untracked files are excluded. The GitHub repositories above have their own versions and tests.

## Matter Lab — ten standalone repositories

After `npm start`, open **http://127.0.0.1:4317/matter?lang=en**. All ten demos, interfaces, errors and reports support FR/EN/ES. Each package also runs independently with `npm start` in its directory, on port 4321.

| Project                                            | First executable evidence                                               | Limitation                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| [FabReplay](packages/fabreplay/README.en.md)       | Stiffness comparison, specimen CIs, test conditions and CSV imports     | Synthetic demo readings; sensor not verified                   |
| [SwitchBench](packages/switchbench/README.en.md)   | RL fault, extinction and clamp energy; ngspice export and execution     | Generic switches, no validated arc or hybrid commutation model |
| [MicroFabGym](packages/microfabgym/README.en.md)   | Policies on shared episodes, reset/step API and Gymnasium adapter       | Simulated scalar film; no RL training or factory connection    |
| [CoolantForge](packages/coolantforge/README.en.md) | Bounded search, Pareto front and microchannel SVG schematic             | Reduced model; no 3D CFD or manufacturable CAD                 |
| [QualifyDiff](packages/qualifydiff/README.en.md)   | Change propagation, scoped evidence and requalification plan            | Declared coverage; no certification                            |
| [FabPort](packages/fabport/README.en.md)           | Capability compatibility, substitutions and dated evidence              | Declared profiles; no machine connector                        |
| [FabResume](packages/fabresume/README.en.md)       | Attempt journal and resumption conditional on physical state            | Plan only; declared idempotency contract                       |
| [MeasurePlan](packages/measureplan/README.en.md)   | Exact inspection search under budget and obligations                    | Declared sensitivities and assumed independence                |
| [MicroBlocks](packages/microblocks/README.en.md)   | Five blocks with contracts, illustrative OpenSCAD geometry and evidence | Synthetic measurements; unvalidated functions                  |
| [FabTrace](packages/fabtrace/README.en.md)         | Part histories, limits and statistical associations                     | Descriptive associations; no established causality             |

`npm run matter:test:engines` verifies ngspice and Gymnasium. Install these tools following package READMEs; `SWITCHBENCH_NGSPICE` and `MICROFABGYM_PYTHON` can select their executables. All ten projects are independent of Atomic Machines and have no Matter Compiler access.

## Tour one lab

`npm run demo:labs -- --locale=en --project=payee-exceptions` runs only the chosen offline demonstration. The seven valid names are listed above; an unknown name is rejected.

## Contrôle d’adoption · Adoption check · Comprobación de adopción

[Try a synthetic adoption case](examples/adoption-check.md).

Run `npm run demo:branch-failure` to see a synthetic notification failure after confirmation: the command checks that the order stays confirmed and no message is queued. This does not simulate an ERP transaction or send real mail.
