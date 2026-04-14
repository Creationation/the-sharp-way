

## Bot Telegram — Notifications de réservation pour Sitdown Wien

### Objectif
Envoyer automatiquement un message Telegram à l'admin/owner du salon quand :
- Un client **réserve** un rendez-vous (nouvelle réservation confirmée)
- Un client **annule** un rendez-vous

### Prérequis (à faire par toi)
1. Ouvre Telegram et parle à **@BotFather**
2. Envoie `/newbot`, choisis un nom (ex: "Sitdown Wien Bot") et un username (ex: `sitdown_wien_bot`)
3. Copie le **token** que BotFather te donne
4. Envoie un message à ton bot (pour activer le chat), puis récupère ton **chat_id** en visitant `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Plan technique

**Etape 1 — Stocker les secrets**
- Ajouter 2 secrets dans le projet : `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID` (le chat_id de l'admin qui recevra les notifications)

**Etape 2 — Créer l'edge function `send-telegram-notification`**
- Nouvelle edge function qui reçoit un payload (type: "new_booking" ou "cancellation", + détails du RDV)
- Formate un message lisible avec les infos : client, service, barber, date, heure, prix
- Envoie le message via l'API Telegram (`sendMessage`) au chat_id de l'admin
- Messages formatés en HTML avec emojis pour une lecture rapide

**Etape 3 — Intégrer dans `verify-setup/index.ts` (nouvelle réservation)**
- Après la sauvegarde du booking et l'envoi de l'email de confirmation, appeler `send-telegram-notification` avec les détails de la réservation

**Etape 4 — Intégrer dans `cancel-booking/index.ts` (annulation)**
- Après la mise à jour du statut "cancelled", appeler `send-telegram-notification` avec les détails de l'annulation (+ info si le dépôt a été facturé ou non)

### Exemple de message Telegram

```text
✂️ Neuer Termin gebucht!

👤 Max Mustermann
📧 max@email.com
💇 Haarschnitt — 20€
🧔 Barber: Alex
📅 15.04.2026 um 14:30
💳 Karte hinterlegt (5€ Anzahlung)

→ Admin Dashboard öffnen
```

```text
❌ Termin storniert

👤 Max Mustermann
💇 Haarschnitt — 20€
📅 15.04.2026 um 14:30
💰 5€ Stornogebühr abgebucht ✅
```

### Fichiers modifiés
- `supabase/functions/send-telegram-notification/index.ts` — **nouveau**
- `supabase/functions/verify-setup/index.ts` — ajout appel Telegram après booking
- `supabase/functions/cancel-booking/index.ts` — ajout appel Telegram après annulation

