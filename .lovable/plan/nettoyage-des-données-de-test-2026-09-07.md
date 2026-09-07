# Nettoyage des données de test

## État actuel (vérifié dans la base)

Le système de changement de mot de passe fonctionne : le compte test de cette fonctionnalité (`pwtest.sitdown@example.com`) a bien été supprimé après le test. Mais il reste des traces de tests :

**Compte de test encore actif :**
- `Test Client` — test.booking@thesharpway.at (créé en mars 2026)
  - 1 réservation liée (Haarschnitt, 15.07.2026, confirmée)
  - 1 carte de fidélité vide
  - 1 rôle "user"

**Logs orphelins (comptes déjà supprimés mais traces restantes) :**
- 2 lignes dans le journal des changements de mot de passe (pwtest.sitdown@example.com)
- 6 lignes dans le journal d'envoi d'emails (pwtest.sitdown@example.com et reset.test.sitdown@example.com)

## Actions prévues

1. **Supprimer le compte "Test Client"** et toutes ses données liées (réservation, fidélité, rôle, profil, compte d'authentification).
2. **Purger les logs de test** : supprimer les lignes de test dans `password_change_log` et `email_send_log` (uniquement les adresses @example.com de test).
3. **Vérification finale** : re-contrôle de toutes les tables pour confirmer qu'aucune donnée de test ne subsiste.

## Ne sera PAS touché

- Tous les vrais clients (Dominik, Tobias, Alexander, etc.)
- Ton compte admin (Diego) et celui d'Ibo
- Les logs authentiques de vrais utilisateurs

## Détails techniques

- Suppression du compte auth via l'API admin (cascade sur le profil), puis nettoyage manuel des lignes liées (bookings, user_loyalty, user_roles).
- Suppression des logs via migration SQL ciblée sur les emails de test (les policies bloquent le DELETE pour les utilisateurs, la migration passe en service).
