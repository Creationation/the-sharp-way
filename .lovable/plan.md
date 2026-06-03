## Objectif
Permettre au bot Telegram d'envoyer chaque notification (nouvelle réservation, annulation, etc.) à **deux destinataires en parallèle** : toi + un nouvel utilisateur.

## Étapes

### 1. Ajouter un nouveau secret
Créer un secret `TELEGRAM_CHAT_ID_2` via l'outil sécurisé de Lovable Cloud. Tu y colleras le chat ID du nouvel utilisateur.

> Comment l'obtenir : le nouvel utilisateur doit envoyer `/start` au bot, puis ouvrir
> `https://api.telegram.org/bot<token>/getUpdates` — ou plus simple, parler à `@userinfobot` sur Telegram qui renvoie directement son chat ID.

### 2. Modifier `supabase/functions/send-telegram-notification/index.ts`
- Lire les deux variables : `TELEGRAM_CHAT_ID` (obligatoire) et `TELEGRAM_CHAT_ID_2` (optionnel).
- Construire un tableau de destinataires (1 ou 2 selon ce qui est configuré).
- Envoyer le message à chaque chat ID via `Promise.allSettled` pour qu'un échec d'un destinataire ne bloque pas l'autre.
- Logger les éventuelles erreurs par destinataire, retourner `{ ok: true, sent: N, failed: M }`.

### 3. Rien d'autre à toucher
Les fonctions qui appellent `send-telegram-notification` (`cancel-booking`, `send-booking-confirmation`, etc.) restent inchangées — la logique multi-destinataire est centralisée dans une seule fonction.

## Question avant de coder
Veux-tu pouvoir **désactiver** facilement un destinataire (par ex. en vidant son secret), ou veux-tu carrément une petite table `telegram_recipients` en base pour pouvoir en ajouter/retirer plus tard sans toucher au code ? Pour 2 utilisateurs la version "secret" suffit largement ; la table devient utile à partir de 3-4.
