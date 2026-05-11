## Problèmes identifiés

**1. Erreur "Failed to send a request to the Edge Function"**
Logs `gmail-list` :
```
TypeError: supabase.auth.getClaims is not a function
  at requireAdmin (_shared/gmail-auth.ts:33)
```
La méthode `auth.getClaims()` n'existe pas sur la version du SDK utilisée. Il faut la remplacer par `auth.getUser(token)` qui retourne `{ data: { user: { id } } }`.

**2. Tout l'admin Emails est en français**
Le projet est strictement bilingue **EN/DE** (mémoire core). Il faut router toutes les chaînes via `LanguageContext` (`t()`).

---

## Plan

### A. Fix edge function auth (1 fichier)
- `supabase/functions/_shared/gmail-auth.ts` :
  - Remplacer `supabase.auth.getClaims(token)` par `supabase.auth.getUser(token)`
  - Récupérer `userId` depuis `data.user.id`
- Redéployer les 4 fonctions : `gmail-list`, `gmail-get`, `gmail-modify`, `gmail-send`

### B. Traduire l'UI admin Emails en EN/DE
Ajouter les clés de traduction dans `src/lib/translations.ts` (sections `en` + `de`), puis remplacer toutes les chaînes FR codées en dur par `t('admin.emails.xxx')` dans :

- `src/components/admin/EmailsTab.tsx` (onglets : Historique / Composer / Réception, sous-titres)
- `src/components/admin/InboxView.tsx` :
  - Filtres : Tous / Non lus / Stripe / Clients → All / Unread / Stripe / Clients (DE: Alle / Ungelesen / Stripe / Kunden)
  - Placeholder "Rechercher..." → Search / Suchen
  - Boutons : Retour, Répondre, Annuler, Envoyer
  - États : Chargement, Aucun email, Erreur, (sans sujet)
  - Toasts : Archivé, Supprimé, Réponse envoyée, Échec d'envoi
  - Reply : "À ·", placeholder "Ta réponse..."
  - Préfixe sujet "Re:" reste tel quel (standard email)
- Locale `date-fns` : utiliser `enUS` ou `de` selon `language` du `LanguageContext` au lieu de `fr`

### C. Vérification
- Redéployer les edge functions
- Tester la Réception en EN puis switch DE pour valider l'affichage

---

## Notes techniques
- Aucun changement de schéma DB
- Aucun secret à ajouter
- Pas de modif Stripe ni ImprovMX (déjà OK)
- Le contenu des emails reçus reste dans leur langue d'origine — seule l'UI est traduite
