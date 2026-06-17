## Objectif
Limiter le dernier créneau réservable en fonction du type de service choisi, sans toucher aux horaires d'ouverture du barbier (qui restent corrects côté backend).

## Règles (plafonds fixes)
- Sélection contenant un service **barbe** (avec ou sans coupe) → dernier créneau **17:30**
- Sélection contenant uniquement de la **coupe** (sans barbe) → dernier créneau **18:00**
- Toute autre sélection (couleur, lavage, sourcils, services dames, etc.) → comportement actuel inchangé (jusqu'à 19:30 selon dispo)

Fermeture salon : 19:00 (info notée, mais les plafonds ci-dessus sont appliqués tels quels, comme demandé).

## Où ça se passe
Fichier unique : `src/pages/BookingFlow.tsx`

Étapes :
1. Ajouter deux helpers en haut du fichier :
   - `isBeardService(name)` → vrai si le nom contient « Bart » ou « Beard » (couvre *Bart Rasur*, *Moderne Bartrasur*, *Bart Färben*, *Beard Shave*, *Modern Beard Shave*, *Beard Color*).
   - `isCutService(name)` → vrai si le nom contient « schnitt », « Haircut », « Cut » (couvre les *Haarschnitt*, *Maschinenschnitt*, *Pensionisten Schnitt*, *Haircut + …*, *Trockenschnitt*, *Wash & Cut*, etc.) tout en excluant les noms déjà classés comme barbe.

2. Calculer, dans le rendu de l'étape « heure », un `lastAllowedSlot` :
   - barbe présente → `"17:30"`
   - sinon coupe présente → `"18:00"`
   - sinon → `"19:30"` (= dernier de `allTimeSlots`, donc pas de changement)

3. Filtrer la liste affichée :
   ```ts
   const visibleSlots = allTimeSlots.filter(s => s <= lastAllowedSlot);
   ```
   et utiliser `visibleSlots` à la place de `allTimeSlots` dans le `.map` (ligne ~703) **et** dans le calcul `firstFree` (ligne ~452) pour la mise en avant du premier créneau libre.

4. Si l'utilisateur change sa sélection de services après avoir choisi une heure désormais hors plafond, réinitialiser `selectedTime` pour forcer une nouvelle sélection valide.

## Hors scope
- Pas de modification de la base, des disponibilités barbier, des edge functions, du calendrier admin, ni des autres écrans.
- Pas de changement aux durées de service ni à la logique des dépôts/rappels.

## Validation
- Choisir « Haarschnitt » seul → dernier créneau visible = 18:00.
- Ajouter « Bart Rasur » → la liste se recoupe à 17:30 et l'heure précédemment choisie au-delà se réinitialise.
- Choisir « Augenbrauen Zupfen » seul → la liste va jusqu'à 19:30 (inchangé).
