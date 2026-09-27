# Machine Data Lab

## Français

Alpha locale pour **réconcilier des exports de machines connectées obtenus avec autorisation**. Le banc normalise température (°C), pression (kPa) et heures de fonctionnement, conserve la provenance et signale doublons, contradictions, valeurs invalides et trous de cadence. Les données d’exemple sont synthétiques.

```sh
machine-data-lab demo --locale=fr
machine-data-lab analyze export-autorise.json rapport.json --locale=fr
```

Le fichier d’entrée décrit les colonnes de chaque export dans `feeds[].measurements` et un périmètre d’accès **déclaré** dans `access`. Cet outil ne contacte aucun fabricant, ne vérifie pas juridiquement le droit d’accès et ne contourne aucune protection. Il ne conclut pas à la conformité au Data Act. Une mesure absente du périmètre déclaré n’est pas reprise dans le rapport. Les rapports peuvent contenir des données sensibles : conservez-les localement.

Copiez [l’entrée synthétique](fixtures/two-machines.json) pour voir les champs attendus. Chaque ligne porte un identifiant d’équipement et un horodatage ; le mapping associe les colonnes aux mesures. `expectedCadenceMinutes` déclenche un signalement quand l’écart dépasse 1,5 fois la cadence. Les unités de sortie sont °C, kPa et heures.

Pilote à valider : exports autorisés de deux fabricants, trois équipements et un réparateur indépendant. Mesurer le temps nécessaire pour obtenir une série exploitable et les anomalies détectées ; arrêter si les données disponibles n’aident pas un diagnostic réel.

## English

Local alpha for **reconciling connected-machine exports obtained with authorization**. It normalizes temperature (°C), pressure (kPa) and operating hours, keeps provenance, and flags duplicates, conflicts, invalid values and cadence gaps. Sample data is synthetic.

```sh
machine-data-lab demo --locale=en
machine-data-lab analyze authorized-export.json report.json --locale=en
```

The input describes each export’s columns in `feeds[].measurements` and a **declared** access scope in `access`. This tool does not contact manufacturers, legally verify access rights, bypass protections or certify Data Act compliance. Readings outside the declared scope are excluded from the report. Reports may contain sensitive data: keep them local.

Copy the [synthetic input](fixtures/two-machines.json) to see the expected fields. Each row carries an asset ID and timestamp; the mapping binds columns to metrics. `expectedCadenceMinutes` flags gaps above 1.5 times the cadence. Output units are °C, kPa and hours.

Pilot to validate: authorized exports from two manufacturers, three assets and one independent repairer. Measure time to a usable series and detected anomalies; stop if available data does not help a real diagnosis.

## Español

Alfa local para **conciliar exportaciones de máquinas conectadas obtenidas con autorización**. Normaliza temperatura (°C), presión (kPa) y horas de funcionamiento, conserva la procedencia y señala duplicados, contradicciones, valores no válidos e intervalos excesivos. Los datos de ejemplo son sintéticos.

```sh
machine-data-lab demo --locale=es
machine-data-lab analyze exportacion-autorizada.json informe.json --locale=es
```

La entrada describe las columnas de cada exportación en `feeds[].measurements` y un alcance de acceso **declarado** en `access`. Esta herramienta no contacta a fabricantes, no verifica jurídicamente los derechos de acceso, no elude protecciones ni certifica el cumplimiento del Data Act. Las mediciones fuera del alcance declarado se excluyen del informe. Los informes pueden contener datos sensibles: consérvalos localmente.

Copia la [entrada sintética](fixtures/two-machines.json) para ver los campos esperados. Cada fila contiene un identificador de equipo y una marca de tiempo; el mapeo vincula columnas y mediciones. `expectedCadenceMinutes` señala intervalos superiores a 1,5 veces la frecuencia. Las unidades de salida son °C, kPa y horas.

Piloto por validar: exportaciones autorizadas de dos fabricantes, tres equipos y un reparador independiente. Medir el tiempo hasta obtener una serie útil y las anomalías detectadas; detenerlo si los datos disponibles no ayudan a un diagnóstico real.

MIT — [LICENSE](LICENSE).
