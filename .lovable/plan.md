# Sélecteur Hommes / Femmes premium dans le flow de réservation

## Objectif

Remplacer la liste plate de services par un **toggle segmenté** (Herren / Damen) au-dessus de la liste. Chaque catégorie a son propre menu de prestations. La transition entre les deux est fluide et premium.

## Où

**Fichier** : `src/pages/BookingFlow.tsx` · bloc "Service selection" (~lignes 751-781).
**Fichier** : `src/lib/translations.ts` · 2 clés ajoutées.

## UI

```text
   WÄHLE DEINE LEISTUNG

  ┌───────────────────────────────┐
  │  ● Herren      ○ Damen        │  ← toggle segmenté (pill)
  └───────────────────────────────┘
       ↑ indicateur copper glissant

  [ Haarschnitt              20€ ]
  [ Maschinenschnitt         15€ ]
  [ … prestations de la catégorie active ]
```

### Toggle segmenté
- Container `bg-surface` arrondi (rounded-full, p-1, border copper/20)
- 2 boutons plein largeur (50/50)
- Indicateur : pastille interne `gradient-copper` qui **glisse** de gauche à droite via `transform: translateX` (transition 400ms `cubic-bezier(0.22, 1, 0.36, 1)` — courbe premium/spring-like)
- Label actif : `text-primary-foreground` · label inactif : `text-muted-foreground`
- Feedback tactile : léger `active:scale-[0.98]`

### Transition de la liste
- Quand on switch, la liste actuelle sort en `fade-out + translate-x` (opposé au sens du switch : Herren→Damen = sortie vers la gauche, entrée depuis la droite) sur 250ms
- Nouvelle liste entre en `fade-in + translate-x` avec `stagger` de 30ms par carte (effet cascade doux)
- Implémentation : clé React sur le container = catégorie active, combinée avec `animate-fade-in` déjà présent dans Tailwind config + `animation-delay` inline par index

## Comportement

- Catégorie par défaut à l'ouverture : **Herren**
- Un seul menu visible à la fois
- La sélection multi-services persiste quand on switch de catégorie (le client peut cocher Herren, switcher, cocher Damen, la carte récap en bas montre tout)
- La carte récapitulative sous la liste continue d'afficher **toutes** les prestations sélectionnées (les deux catégories confondues), inchangée
- Si une catégorie est vide → son bouton reste visible mais la liste affiche un message discret "Aucune prestation" (edge case, aujourd'hui les deux ont des services)

## Détails techniques

```tsx
const [activeGender, setActiveGender] = useState<"herren" | "damen">("herren");

const services = dbServices.map(s => ({ ...map local, category: s.category }));
const visibleServices = services.filter(s => s.category === activeGender);
```

- Container liste : `<div key={activeGender} className="animate-fade-in">`
- Cartes : `style={{ animationDelay: \`${i * 30}ms\` }}` sur `animate-fade-in`
- Toggle indicator : `<div className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full gradient-copper transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: activeGender === 'damen' ? 'translateX(100%)' : 'translateX(0)' }} />`

## Traductions (src/lib/translations.ts)

Réutilise les clés existantes `t.services.catHerren` / `t.services.catDamen` (déjà DE = "Herren"/"Damen", EN = "Men"/"Women"). Aucune nouvelle clé requise.

## Sélection par défaut

Le `useEffect` actuel qui pré-sélectionne `services[0]` reste. Si `services[0]` est Herren (c'est le cas · `sort_order=1`), le comportement initial est identique.

## Hors périmètre

- Pas de changement BDD, admin, ServicesScreen, ServicesSection
- Pas de changement de la logique de créneaux, prix, plafonds horaires
- La catégorie `kinder` n'est pas exposée dans le toggle (aucun service actif). Si besoin plus tard, ajouter un 3ᵉ segment.
