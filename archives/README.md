# archives/ — artefacts historiques (non porteurs)

Documents et maquettes conservés pour la **mémoire du projet**. Rien dans ce dossier
n'est lu par le build, les Edge Functions, l'app ou les tests — on peut tout supprimer
sans effet sur la production. On les garde dans le dépôt (miroir GitHub) comme trace.

| Fichier | Ce que c'est |
|---|---|
| `handoff-v1.md` | Premier brainstorm de cadrage (note à plusieurs voix). |
| `handoff-v2.md` | Révision du v1, en vue du plan d'implémentation. Renvoie à `handoff-v1.md`. |
| `design-brief-v1.md` | Brief d'identité visuelle issu de `design-studio.html`. |
| `design-studio.html` | Configurateur d'identité visuelle (outil autonome, → design-brief.md). |
| `ux-sim.html` | Maquette interactive de la « full app » (Calculateur/Analyse/Communications). Cahier des charges visuel — **superseded** par `orchestrateur.html`. |
| `ux-sim-planning.md` | Notes de planification de la maquette ux-sim. |

> L'app vivante est `../orchestrateur.html` (compilée en `deploiement/dist/` par `../tools/build-dist.js`).
