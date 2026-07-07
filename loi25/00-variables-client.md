# Variables client — bibliothèque de conformité Corda

> Les six gabarits de ce dossier sont **réutilisables** pour tout mandat Corda : les
> valeurs propres au client sont des variables `{{…}}`. Ce fichier est la **table
> maîtresse** — remplir ici, reporter partout. Les valeurs ⏳ sont **en attente d'une
> décision** (référence : `docs/dossier-validation-fanny.md`, section D).

| Variable | Valeur — mandat MRC Thérèse-De Blainville | Statut |
|---|---|---|
| `{{PROJET}}` | Analyse multicritère des mesures écofiscales — MRC Thérèse-De Blainville | ✔ |
| `{{OUTIL}}` | Orchestrateur (ecofisc.corda.consulting), un produit Corda | ✔ |
| `{{CHERCHEURE}}` | Pre Fanny Tremblay-Racicot, ENAP / CERGO — chercheure responsable du mandat | ✔ |
| `{{MANDANT}}` | MRC Thérèse-De Blainville | ✔ à confirmer (signataire exact) |
| `{{FOURNISSEUR}}` | Corda (Vincent Duguay) — conception, exploitation et propriété de l'outil | ✔ |
| `{{RESPONSABLE_RP}}` | Vincent Duguay (Corda) — **proposition** (décision D2) | ⏳ D2 |
| `{{COURRIEL_RP}}` | vincent.duguay@enap.ca | ✔ |
| `{{DUREE_CONSERVATION}}` | Durée du mandat + 3 ans — **proposition** (décision D1) | ⏳ D1 |
| `{{HEBERGEUR_DONNEES}}` | Supabase (région Canada Central — Ontario, infrastructure AWS ca-central-1) | ✔ |
| `{{HEBERGEUR_PAGE}}` | Namecheap / cPanel (sert la page publique — aucune donnée personnelle) | ✔ |
| `{{DATE_MISE_EN_SERVICE}}` | ⏳ au go-live réel (cercle fermé) | ⏳ |

**Rappels d'architecture (vrais pour tout client, à ne pas re-décider) :**
- Les renseignements personnels vivent **exclusivement** chez `{{HEBERGEUR_DONNEES}}` ;
  la page publique n'en contient aucun.
- La suppression d'un code d'accès **détruit réellement** ses réponses (cascade) ;
  l'archivage d'un projet est temporaire, la destruction survient à l'échéance de
  conservation (`purge_expired`, schema.sql).
- L'analyse des commentaires par un outil d'IA est **interdite par défaut** (décision D5).
