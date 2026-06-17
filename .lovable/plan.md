## Objectif
Affiner les plafonds du dernier créneau réservable dans `src/pages/BookingFlow.tsx`, selon la sélection de services.

## Règles finales

- **Femmes (Damen)** présent dans la sélection → dernier créneau **17:00** (priorité la plus forte, car ces services prennent plus de temps).
- Sinon, **2 services ou plus** sélectionnés → dernier créneau **17:30** (combo / double manipulation).
- Sinon, sélection solo **Hommes (Herren)** ou **Enfants (Kinder)** (y compris barbe seule, coupe seule, etc.) → dernier créneau **18:00**.

Ordre d'évaluation : Damen → combo (2+) → solo.

Fermeture salon : 19:00 (non modifiée, les plafonds ci-dessus priment).

## Où ça se passe
Fichier unique : `src/pages/BookingFlow.tsx`

1. Remplacer la logique actuelle `isBeardService` / `isCutService` / `computeLastAllowedSlot` par une version basée sur **catégorie** + **nombre de services** :
   - Récupérer les objets `Service` complets des services sélectionnés (la liste vient déjà de `useServices`, donc on a accès à `category`).
   - `computeLastAllowedSlot(selectedServices)` :
     - si au moins un service a `category === "damen"` → `"17:00"`
     - sinon si `selectedServices.length >= 2` → `"17:30"`
     - sinon → `"18:00"`

2. Conserver le `useEffect` qui réinitialise `selectedTime` si l'heure choisie dépasse le nouveau plafond après changement de sélection.

3. Conserver `visibleSlots = allTimeSlots.filter(s => s <= lastAllowedSlot)` utilisé dans le rendu et dans le calcul du premier créneau libre.

## Hors scope
- Pas de modification BD, edge functions, calendrier admin, durées de service, dépôts, rappels.
- Pas de changement aux disponibilités barbier ni aux autres écrans.

## Validation
- « Haarschnitt » seul (Herren) → dernier créneau visible **18:00**.
- « Bart Rasur » seul (Herren) → **18:00**.
- « Haarschnitt » + « Bart Rasur » (Herren, 2 services) → **17:30**, l'heure précédemment choisie au-delà se réinitialise.
- « Pensionisten Schnitt » seul (Kinder/Herren solo) → **18:00**.
- N'importe quel service Damen (seul ou combiné) → **17:00**.
- Une couleur Damen + un soin Damen → **17:00** (la règle Damen prime sur la règle combo).
