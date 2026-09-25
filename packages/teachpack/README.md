# Teachpack

Follow a shared window or screen and turn reviewed visual checkpoints into a guide. The existing structured path also compiles successful tool demonstrations into a parameterized skill. Local alpha, MIT, Node.js 22+. Package: `@gbesse/teachpack` (not yet published).

The visual path uses browser screen sharing and local Apple Vision OCR on macOS. It samples changed images, shows their thumbnails and recognized text, lets the user select/label useful moments, and follows a later screen share by matching text checkpoints. The structured path uses symbolic trace binding. Neither path calls a hosted model by default.

The local studio UI is available in French, English and Spanish via the **FR / EN / ES** selector. The choice persists in the browser and sets the priority for local OCR languages. Default visual step instructions and live status are localized; recognized screen text and user-written labels stay in their original language. No automatic translation is performed.

Optional click detection is available on macOS when sharing a full display with only one active display. Select the checkbox before recording; macOS may ask for Input Monitoring permission. Teachpack records left/right click time and normalized screen position, then shows clicks next to captured screens and in the exported guide. It does not capture keystrokes, identify a clicked control, or replay clicks. The listener sees clicks anywhere on the shared display while recording, so review the evidence before exporting.

During live follow, the studio displays a locally stored reference screenshot. Recorded clicks appear as approximate dots on the previous step's screen. They are guidance only: no control is identified or activated.

La détection facultative des clics fonctionne sur macOS si vous partagez l’écran entier et qu’un seul écran est actif. Cochez l’option avant d’enregistrer ; macOS peut demander l’autorisation « Surveillance des entrées ». Teachpack note l’instant et la position des clics gauche/droit, puis les affiche avec les captures et dans le guide exporté. Il n’enregistre pas les frappes clavier, n’identifie pas le contrôle cliqué et ne rejoue pas les clics. Le capteur observe tout l’écran partagé pendant l’enregistrement : vérifiez les données avant l’export.

Pendant le suivi, l’atelier affiche une capture de référence stockée localement. Les clics enregistrés apparaissent comme des points approximatifs sur l’écran de l’étape précédente. Ils servent seulement de guide : aucun contrôle n’est identifié ni activé.

La detección opcional de clics funciona en macOS al compartir toda la pantalla cuando solo hay una pantalla activa. Marca la opción antes de grabar; macOS puede solicitar el permiso de Supervisión de entrada. Teachpack registra el momento y la posición de los clics izquierdo y derecho y los muestra junto a las capturas y en la guía exportada. No registra teclas, no identifica el control pulsado ni reproduce los clics. El sensor observa toda la pantalla compartida durante la grabación: revisa los datos antes de exportar.

Durante el seguimiento, el taller muestra una captura de referencia guardada localmente. Los clics grabados aparecen como puntos aproximados en la pantalla del paso anterior. Solo sirven de guía: no se identifica ni se activa ningún control.

## Show your screen

1. Start the local studio with `npm start`, open `http://127.0.0.1:4317/#teach`, choose **FR / EN / ES**, and click **Share and record** (or its translation). The browser asks you to choose a window or screen. Chrome is a fallback if the in-app browser does not expose `getDisplayMedia`.
2. Work in the selected source. The page samples the shared video about every 1.8 seconds and stores a JPEG when the screen changes (with a periodic check). If click detection is enabled, a click also triggers an image shortly afterward. Apple Vision recognizes visible text locally. A capture is limited to 120 images / 15 minutes, with each JPEG limited to 700 KB.
3. Stop sharing, select at least two meaningful images, optionally label what you did, and create the visual guide. A JSON export contains screen text checkpoints and your instructions. Images and recognized text remain in the local ignored `.local/teach-visual/` and `.local/studio.json` directories.
4. Click **Follow my screen** (or its translation) and choose the window again. The guide advances when at least 70% of the step’s distinct text markers are visible. Steps without reliable text can be confirmed manually. The monitor does not click or type in another app.

Example programmatic analysis:

```js
import { compileVisualSkill, matchVisualStep } from '@gbesse/teachpack/visual';
const guide = compileVisualSkill(capturedFrames, { title: 'My procedure', selected: [0, 2] });
const result = matchVisualStep(guide.steps[1], newScreenOcr);
```

The studio’s macOS OCR bridge lives in `studio/vision-ocr.swift`; the published package core accepts OCR observations and does not require Swift. Screen capture requires a browser that supports the Screen Capture API and a user-selected source. This alpha understands visible text changes, not the exact mouse click or the business meaning of a screen. Screen sharing is never started automatically. Be deliberate about which window you choose; local JPEGs can include sensitive content.

## Structured tool demonstrations

### Try it

At the repository root, `npm ci`, then `npm run demo`. The output directory includes `demonstrations.json`, `skill.json` and a rehearsal report.

```sh
npx teachpack learn demonstrations.json new-skill.json
npx teachpack validate new-skill.json
npx teachpack rehearse new-skill.json inputs.json
```

`inputs.json`: `{"customerId":"c-delta","sku":"lamp","quantity":4}`. Output files are created exclusively: an existing file is never silently overwritten. Exit codes: 0 success, 1 failed rehearsal, 2 invalid input or invocation.

### API

```js
import { learn, execute, recordDemo } from '@gbesse/teachpack';
import { World } from '@gbesse/branch-lab';
const examples = [
  { customerId: 'c-alice', sku: 'lamp', quantity: 2 },
  { customerId: 'c-benoit', sku: 'chair', quantity: 3 },
  { customerId: 'c-clara', sku: 'desk', quantity: 1 },
].map((input) => recordDemo(new World(), input));
const skill = learn(examples);
const world = new World();
const report = await execute(
  skill,
  { customerId: 'c-delta', sku: 'lamp', quantity: 4 },
  { simulation: true, execute: world.execute.bind(world) },
  { allow: skill.permissions, runId: 'job-123' },
);
```

Each demonstration is `{inputs, steps:[{tool,args,result,ok:true}]}`. Inputs and arguments are flat JSON scalars; input values cannot be null. Skills contain input bindings, prior-result references, literal constants, declared tool permissions and source trace hashes. `validate(skill)` checks the schema and reference order.

Learning requires 2–100 aligned demonstrations. Vary all inputs that affect the workflow. Ambiguous input matches, unexplained variation, differing step sequences, and an unchanged value indistinguishable from an input are rejected. Result reference inference currently requires matching argument/result field names. Repeated identical result lineage is disclosed as a warning and uses the first producer; validate on held-out examples with shifted identifiers.

### Execution safety and limits

An explicit tool allowlist is mandatory. Non-simulation adapters additionally require `allowLive:true`. This is an authorization signal, not a security sandbox: adapters must enforce their own credentials, input validation and business permissions. Generated idempotency keys must be honored by the adapter. Use the same `runId` only to retry the same logical job, and a new one for a genuinely new job.

Execution stops on the first error and reports already completed steps. It does not roll back external effects. There is no conditional branching, loop learning, arbitrary UI automation or guarantee that a few examples prove correctness. The included Branch adapter keeps all effects synthetic. Visual guides and structured tool skills are distinct artifacts in this release; a screen recording is not silently promoted into permission to execute business actions.
