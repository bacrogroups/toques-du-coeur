# Les Toqués du Cœur — site vitrine

Site public de l'association **Les Toqués du Cœur** (Harnes & Masny) : marché solidaire, paniers à 5 €, moments de partage, adhésion.

- Vite + React + TypeScript, sans base de données.
- Formulaire d'adhésion / contact géré par **Netlify Forms** (les demandes arrivent dans l'onglet *Forms* du projet Netlify, avec notification par e-mail à configurer dans *Forms → Notifications*).
- Photos d'illustration provisoires (Unsplash) dans `src/App.tsx` → à remplacer par les photos de l'association.

```bash
npm install
npm run dev
```

Déploiement : chaque `git push` sur `main` déclenche un build Netlify (`npm run build` → `dist`).
