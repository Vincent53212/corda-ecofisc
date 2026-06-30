# Brief de design — Identité visuelle
**Projet :** Stratégie écofiscale — MRC Thérèse-De Blainville · **Cible :** identité large (app + livrables + decks)
**Généré par :** Design Studio (configurateur) · **Preset de base :** — (réglages manuels)

## Choix par axe
| Axe | Choix |
|---|---|
| Police de titres | Fraunces |
| Police de corps | Inter |
| Police chiffres/données | Space Mono |
| Ampleur typographique | Sobre |
| Palette de marque | Terrain |
| Accent / signature | Selon palette |
| Mode | Crème |
| Densité | Confortable |
| Forme (coins) | Doux |
| Composants | Surélevé |
| Style de graphe | Éditorial |
| Couleurs de catégories | Neuf |
| Échelle de favorabilité | Vert→rouge |
| Ornement | Marqué |
| Texture | Grain papier |

## Tokens résolus (variables CSS prêtes à copier)
```css
:root{
  --font-display: "Fraunces",Georgia,serif;
  --font-body: "Inter",system-ui,sans-serif;
  --font-mono: "Space Mono",ui-monospace,monospace;
  --color-bg: #FBF7F0; --color-surface: #F4ECDF; --color-ink: #211C15;
  --color-muted: #6B6256; --color-line: #E6DAC6;
  --color-accent: #4F7A3A; --color-accent-ink: #FFFFFF; --color-accent-2: #9A5B33;
  --radius: 8px; --border-width: 1px;
  --fs-display: 2.6rem; --fs-h1: 1.9rem; --fs-h2: 1.3rem; --fs-body: 1rem;
  --space-pad: 16px; --space-gap: 16px; --row-h: 42px; --lh-body: 1.62;
}
```

## Palettes de données
- **Catégories d'instruments (Neuf) :** #2A9D8F · #E9C46A · #E76F51 · #264653 · #8AB17D · #9D4EDD
- **Favorabilité (Vert→rouge) :** #2E7D45 · #88B04B · #9AA0A6 · #E0A030 · #C0392B

## Contraste (WCAG)
- Texte/fond : 15.84:1
- Accent/fond : 4.71:1

## Notes de Vincent
J'adore cette version! Évidemment, certains trucs à corriger. D'abord l'affichage des données qui brise sur deux lignes dans certains graphs est à fix. Ensuite, l'ornement marqué est super cute SAUF la grosse lettre au début du texte, on peut enlever. Pour le reste, excellente base: on révisera les détails dans le ux-designer :) Bon travail!

---
_Police principale imposée : **Fraunces** (titres). Fontes via Google Fonts. Ce brief alimente l'étape 2 : le plan d'implémentation de l'app._