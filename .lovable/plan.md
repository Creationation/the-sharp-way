# Migration des emails Resend → Gmail (hello@sitdownvienna.app)

## Objectif

Tous les emails transactionnels (confirmations, rappels, contact, reset, admin) partent depuis la vraie boîte **`hello@sitdownvienna.app`** via le connecteur Google Mail déjà lié au projet. Les réponses clients arrivent directement dans cette boîte Gmail — visible aussi dans l'Admin Panel → Inbox.

## Ce qui change

### 1. Nouveau helper partagé
**`supabase/functions/_shared/gmail-sender.ts`** — fonction unique `sendGmail(...)` qui :
- Encode le message au format RFC 2822 en base64url (HTML + texte, support `cc`, `bcc`, `reply_to`)
- Appelle `POST https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send`
- Headers : `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${GOOGLE_MAIL_API_KEY}`
- `From` figé à **`Sitdown Vienna <hello@sitdownvienna.app>`**
- Logue dans `email_send_log` (status `pending` → `sent`/`failed`) pour cohérence avec le dashboard existant

### 2. Migration des 7 edge functions
Dans chaque fichier, je remplace l'appel `fetch("https://api.resend.com/emails", ...)` par `sendGmail(...)`. Le HTML, la logique métier et les déclencheurs restent **inchangés**.

| Fonction | Rôle |
|---|---|
| `send-booking-confirmation` | Confirmation de réservation au client |
| `process-reminders` | Rappels 24h / 5h / 2h avant rendez-vous |
| `send-contact-message` | Formulaire contact (destinataire interne) |
| `send-password-reset` | Reset mot de passe |
| `verify-setup` | Email de test admin |
| `process-attendance` | Notification d'absence/no-show |
| `send-all-test-emails` | Bouton "envoyer tous les tests" admin |

### 3. Ce qui ne change PAS
- **Auth emails** (signup, magic link, recovery via Supabase) restent sur **Lovable Emails** (`noreply@sitdownvienna.app`) — c'est plus fiable pour les emails système et déjà fonctionnel ✅
- **Admin Inbox** (`InboxView` + `gmail-list/get/thread/modify`) déjà branchée sur la même boîte → continue de fonctionner sans modification ✅
- **`gmail-send`** (réponses admin depuis l'Inbox) reste sur `sendLovableEmail` — hors scope de ta demande
- **`RESEND_API_KEY`** laissée en place (suppression manuelle plus tard si tu veux)

## Détails techniques

- **Encodage RFC 2822** : headers `From`, `To`, `Subject` (UTF-8 base64 si non-ASCII), `Reply-To`, `MIME-Version: 1.0`, `Content-Type: multipart/alternative` avec parts `text/plain` + `text/html`
- **Gestion d'erreur** : si la passerelle renvoie 401/403 (scope/token), on log dans `email_send_log` avec `status=failed` et `error_message` — pas de retry automatique
- **Aucune migration DB** requise
- **Aucun changement DNS** requis (le domaine racine est déjà géré par Google Workspace)
- **Aucun nouveau secret** requis (`LOVABLE_API_KEY` et `GOOGLE_MAIL_API_KEY` déjà présents)

## Vérification après build

1. Tester `verify-setup` depuis l'admin → email arrive depuis `hello@sitdownvienna.app`
2. Créer une réservation test → confirmation reçue avec bon expéditeur
3. Vérifier le log dans `email_send_log` (statut `sent`)
4. Répondre à l'email reçu → la réponse apparaît dans Admin Panel → Inbox
