## Migration Stripe · ce que le client doit te fournir

Le compte Stripe du client est déjà créé et son IBAN est connecté · parfait. Il ne reste qu'à récupérer **3 informations** depuis son Dashboard Stripe, puis je m'occupe du reste.

### Ce que le client doit t'envoyer

Toutes ces valeurs se trouvent dans son Dashboard Stripe (https://dashboard.stripe.com) · **en mode Live** (toggle en haut à droite · pas "Test mode").

| # | Info | Où la trouver | Format |
|---|---|---|---|
| 1 | **Secret key** | Développeurs → Clés API → "Secret key" (cliquer "Reveal live key") | `sk_live_...` |
| 2 | **Publishable key** | Même page · "Publishable key" | `pk_live_...` |
| 3 | **Webhook signing secret** | Développeurs → Webhooks → créer un endpoint (voir étape ci-dessous) | `whsec_...` |

#### Détail pour le webhook (étape 3)

Une fois que tu m'auras donné les 2 premières clés, je te donnerai **l'URL exacte du webhook** à coller dans Stripe. Le client devra :

1. Aller dans Développeurs → Webhooks → **Add endpoint**
2. Coller l'URL que je lui fournis
3. Sélectionner les événements : `setup_intent.succeeded`, `setup_intent.setup_failed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Sauvegarder · puis cliquer sur le webhook créé → **Signing secret** → "Reveal" → copier le `whsec_...`

### Ce que je fais ensuite de mon côté

1. Mettre à jour `STRIPE_SECRET_KEY` avec la nouvelle `sk_live_...`
2. Remplacer la `pk_live_...` dans le code frontend (composants de paiement de l'acompte)
3. Ajouter / mettre à jour `STRIPE_WEBHOOK_SECRET` avec le `whsec_...`
4. Vérifier les 3 edge functions Stripe : `create-setup-intent`, `charge-daily-deposits`, `verify-setup`
5. **Test bout-en-bout** : créer une vraie réservation < 24h, valider que l'acompte de 5€ apparaît bien dans le Dashboard Stripe du client (puis annuler / rembourser pour le test)

### Points importants à vérifier côté client

- Compte bien **activé en Live** (sinon les vraies cartes seront refusées)
- IBAN ajouté **et vérifié** pour recevoir les virements
- Méthodes de paiement activées : **Cards** au minimum · activer **SEPA / Apple Pay / Google Pay** si souhaité (Settings → Payment methods)
- Devise par défaut : **EUR**
- Adresse de l'entreprise renseignée (obligatoire pour les reçus)

### Question avant de continuer

**Dis-moi quand tu as les 2 premières clés** (`sk_live_...` et `pk_live_...`) · je les intègre et je te donne l'URL du webhook à transmettre au client dans la foulée.
