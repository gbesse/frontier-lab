# frontier-lab — contrôle d’adoption · adoption check · comprobación de adopción

## Français

Point de départ hors ligne : `npm run demo:branch-failure`.

Dans la simulation Branch, injectez une panne de stock après une réservation synthétique. Vérifiez que le journal montre l’échec et la transition d’état ; ce scénario ne reproduit pas un ERP réel.

## English

Offline starting point: `npm run demo:branch-failure`.

In the Branch simulation, inject a stock failure after a synthetic reservation. Check that the journal shows the failure and state transition; this does not reproduce a real ERP.

## Español

Punto de partida sin conexión: `npm run demo:branch-failure`.

En la simulación Branch, inyecte un fallo de existencias tras una reserva sintética. Compruebe que el registro muestra el fallo y la transición de estado; no reproduce un ERP real.

## Données fictives · Fictional data · Datos ficticios

```text
lab=Branch; event=stock_failure; expected=journal_entry
```

FR : adaptez une copie de la fixture locale ; ce cas n’est pas une mesure de performance ou de qualité Jev.

EN: adapt a copy of the local fixture; this case is not a Jev performance or quality measurement.

ES: adapte una copia de la fixture local; este caso no mide el rendimiento ni la calidad de Jev.
