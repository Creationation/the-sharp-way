## Objectif

Simplifier le bouton « Répondre » de l'inbox admin pour qu'il envoie simplement le texte saisi. Pas de threading complexe, pas de conversion HTML, pas d'alias. Juste : je tape → ça part.

## Constat

Actuellement, la réponse passe par `gmail-send` avec :
- conversion `\n` → `<br>` + Content-Type `text/html`
- headers `In-Reply-To`, `References`, `threadId`
- encodage base64 du body

L'un de ces éléments fait que l'email arrive vide côté destinataire.

## Changements (minimaux)

### 1. `supabase/functions/gmail-send/index.ts`
- Repasser en `Content-Type: text/plain; charset="UTF-8"`.
- Garder l'encodage base64 du body (nécessaire pour les accents).
- Garder `From`, `To`, `Subject`, `threadId` optionnel.
- Retirer `In-Reply-To` / `References` du build par défaut (ils seront optionnels mais non utilisés depuis le client pour éviter les soucis de format).

### 2. `src/components/admin/InboxView.tsx` — `handleReply`
- Envoyer `replyBody` brut (pas de `.replace(/\n/g, "<br>")`).
- Ne plus envoyer `inReplyTo` / `references` — uniquement `threadId` pour que Gmail garde la conversation groupée.
- Garder le sujet `Re: ...`.

### 3. Redéploiement
- Redéployer `gmail-send` après modification.

## Validation
1. Ouvrir une conversation dans l'admin.
2. Cliquer Répondre, taper un message court avec accents et saut de ligne.
3. Vérifier dans la boîte du destinataire que le texte arrive bien (pas vide).
4. Vérifier dans Gmail que la réponse est groupée dans le même thread.

Si après ça tu préfères toujours répondre depuis Gmail directement, on pourra simplement masquer le bouton Répondre.
