## Findings

A full project scan (`rg -in "sharp|SHARP20"` across all source, edge functions, Android, emails, Telegram templates, configs) returned **zero matches**. The codebase is already clean.

The "SHARP20" still visible in the app (screenshot of the promo banner / marquee) comes from **two database rows**, not code:

1. `promotions` table — row `edd6d084…` 
   - `subtitle_en`: "First visit? 20% OFF — Code: **SHARP20**"
   - `subtitle_de`: "Erstbesuch? 20% Rabatt — Code: **SHARP20**"
2. `promo_codes` table — row `70ad7020…`
   - `code`: **SHARP20**

## Plan

Single SQL migration that:

1. Updates `promotions.subtitle_en` and `subtitle_de` → replace `SHARP20` with `SITDOWN20`.
2. Updates `promo_codes.code` from `SHARP20` to `SITDOWN20` (preserves usage stats, Stripe coupon link, expiry, etc.).

```sql
UPDATE public.promotions
SET subtitle_en = REPLACE(subtitle_en, 'SHARP20', 'SITDOWN20'),
    subtitle_de = REPLACE(subtitle_de, 'SHARP20', 'SITDOWN20')
WHERE subtitle_en ILIKE '%SHARP20%' OR subtitle_de ILIKE '%SHARP20%';

UPDATE public.promo_codes
SET code = 'SITDOWN20'
WHERE code = 'SHARP20';
```

After this, the promo banner the client sees will read `Code: SITDOWN20`, matching the hardcoded `PromoBanner.tsx` value already changed earlier. No code changes required.
