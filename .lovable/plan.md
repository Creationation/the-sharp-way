# Plan · Réception emails hello@sitdownvienna.app

## Objectif
1. Recevoir tous les emails envoyés à `hello@sitdownvienna.app` (clients, Stripe, etc.) dans `sitdownvienna@gmail.com` via ImprovMX.
2. Afficher cette boîte Gmail directement dans l'onglet **Réception** de l'admin Sitdown · lecture, marquage lu/non-lu, recherche, réponse.

---

## Étape 1 · ImprovMX (action côté toi, je te guide)

ImprovMX est un service gratuit qui catch tous les emails sur ton domaine et les forwarde vers Gmail. Tu n'as rien à payer ni à coder.

**Ce que tu fais :**
1. Va sur improvmx.com · clique "Add Domain"
2. Entre `sitdownvienna.app`
3. ImprovMX te donne 2 enregistrements MX à ajouter
4. Crée l'alias : `hello` → `sitdownvienna@gmail.com`
5. Optionnel : `*` (catch-all) → `sitdownvienna@gmail.com` pour récupérer tous les emails du domaine

**Ce que je fais :**
- Je te liste les enregistrements DNS exacts à coller dans **Lovable → Domain → Manage DNS records** (MX × 2 + un TXT SPF mis à jour pour autoriser ImprovMX en plus de Lovable Emails)
- Important : le sous-domaine `notify.sitdownvienna.app` reste géré par Lovable (envoi). Le root `sitdownvienna.app` reçoit via ImprovMX. Aucun conflit.

Propagation DNS : 5 min à 2h en général.

**Test :** je t'envoie un email à `hello@sitdownvienna.app` depuis un autre compte · il doit arriver dans ton Gmail.

---

## Étape 2 · Connecter Gmail dans l'admin

Une fois le forwarding actif, je connecte le connecteur Gmail de Lovable à ton compte `sitdownvienna@gmail.com` (OAuth Google · 1 clic, pas de mot de passe à partager).

**Scopes demandés :**
- `gmail.readonly` · lire les emails
- `gmail.modify` · marquer lu/non-lu, archiver
- `gmail.send` · répondre depuis l'admin

---

## Étape 3 · Refaire l'onglet "Réception" en vraie inbox

Remplacement complet de l'écran d'instructions actuel par une vraie inbox connectée à Gmail.

**Liste des emails (gauche / haut)**
- Récupération via edge function `gmail-list` qui appelle `https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages?q=to:hello@sitdownvienna.app OR to:sitdownvienna@gmail.com&maxResults=50`
- Affichage : expéditeur · sujet · preview (snippet) · date · badge non-lu (point copper)
- Filtres : **Tous · Non-lus · Stripe · Clients**
- Recherche par texte (utilise le param `q` de Gmail)
- Pull-to-refresh + bouton refresh

**Détail email (clic ouvre overlay plein écran mobile)**
- Headers (de, à, date, sujet)
- Corps HTML rendu dans iframe sandbox sécurisée
- Marqué lu automatiquement à l'ouverture (`messages/{id}/modify` removeLabelIds: ["UNREAD"])
- Boutons : **Répondre · Archiver · Supprimer (trash)**

**Composer réponse**
- Pré-remplit le destinataire et le sujet (Re: ...)
- Envoi via `messages/send` (raw RFC 2822 base64url)
- Toast de confirmation + retour à la liste

**État vide / non connecté**
- Si Gmail pas connecté : CTA "Connecter Gmail" qui déclenche le flow OAuth
- Si erreur : message clair + bouton réessayer

---

## Étape 4 · Stripe

Une fois ImprovMX en place :
- Tu mets `hello@sitdownvienna.app` comme email de contact dans Stripe Dashboard
- Toutes les notifications Stripe (paiements, disputes, payouts) arriveront sur ton Gmail · visibles dans l'onglet Réception avec le filtre **Stripe**

---

## Détails techniques (pour info)

- **Edge functions créées :** `gmail-list`, `gmail-get`, `gmail-modify`, `gmail-send` · toutes avec validation JWT admin (seul l'admin connecté peut appeler)
- **Sécurité :** validation `has_role(auth.uid(), 'admin')` côté edge avant chaque appel gateway
- **Pas de cache DB :** lecture live depuis Gmail à chaque ouverture (on évite la duplication de données et les soucis de sync)
- **Connecteur Gmail :** workspace-level, 1 seule connexion (la tienne en tant que builder) partagée par tous les admins de l'app
- **Mobile-first :** liste + overlay détail, copper accent, font Bebas/Inter, radius 16px

---

## Ordre d'exécution

1. Tu confirmes le plan
2. Je te donne les 3 enregistrements DNS pour ImprovMX (à coller dans Lovable Domain settings)
3. Tu crées le compte ImprovMX + ajoutes le domaine + l'alias hello@
4. Je lance la connexion Gmail (popup OAuth · tu te connectes avec sitdownvienna@gmail.com)
5. Je refais l'onglet Réception en vraie inbox
6. Test bout-en-bout : envoi d'un email test → arrive dans l'admin

Dis-moi si on y va.
