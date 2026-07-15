# Mode Tagesplan plein écran (admin)

## Objectif
Permettre à l'admin d'activer un mode « Tagesplan direct » : à l'ouverture de l'app, il arrive sur un écran plein écran affichant uniquement le planning du jour, qui se met à jour tout seul. Un toggle discret visible uniquement pour l'admin sur la page d'accueil permet d'activer/désactiver ce mode à tout moment.

## Comportement

### Toggle sur l'accueil
- Placé sur `HomeDashboard`, visible **uniquement si l'utilisateur connecté est admin** (via `has_role`).
- Petit switch discret en haut de l'accueil : « Tagesplan-Modus / Tagesplan mode ».
- Persisté dans `localStorage` (par appareil), clé `sitdown.tagesplanMode`.

### Quand le mode est activé
- À chaque ouverture de l'app, si l'utilisateur est admin **et** que le toggle est activé → redirection automatique vers `/tagesplan`.
- L'écran `/tagesplan` est **plein écran** :
  - Pas de bottom nav.
  - En-tête minimal avec : date du jour, logo, bouton « Export .xlsx » (déjà existant), et bouton « Mode normal » pour désactiver et revenir à l'app classique.
  - Corps = le même contenu que l'onglet Planning du panneau Admin (liste des rendez-vous du jour, auto-refresh 30 s déjà en place).
- Si un non-admin tape l'URL `/tagesplan` → redirect vers `/`.

### Quand le mode est désactivé
- L'admin utilise l'app comme un utilisateur normal.
- Le toggle reste visible sur l'accueil pour réactiver.
- Accès à `/admin` toujours possible via les moyens habituels.

## Fichiers touchés

### Nouveaux
- `src/pages/TagesplanFullscreen.tsx` — écran plein écran, réutilise le composant de planning existant (`ScheduleTab` ou son contenu extrait), ajoute le bouton export et le bouton « Mode normal ».
- `src/hooks/useTagesplanMode.ts` — hook qui lit/écrit `localStorage` + expose `{ enabled, setEnabled }`.

### Modifiés
- `src/App.tsx` — ajouter la route `/tagesplan`.
- `src/pages/Index.tsx` (ou wrapper de `HomeDashboard`) — au montage, si `isAdmin && tagesplanMode` → `navigate('/tagesplan', { replace: true })`.
- `src/pages/HomeDashboard.tsx` — afficher le toggle en haut, visible seulement si `isAdmin`.

### Non touchés
- Panneau Admin, planning existant (juste réutilisé), écrans client, base de données, edge functions.

## Détails techniques
- Détection admin : hook existant basé sur `user_roles` + `has_role` (déjà utilisé dans le panneau Admin).
- Auto-refresh : le composant planning existant a déjà son `setInterval` / query invalidation, on ne le duplique pas.
- Aucun changement DB, aucune migration.

## Non inclus
- Pas d'app séparée / PWA distincte.
- Pas de synchronisation cross-device de la préférence (choix : rapide et local).
- Pas de modification du planning lui-même (contenu, colonnes, export) — on réutilise l'existant tel quel.
