# Les Toqués du Cœur — site vitrine

Site public de l'association **Les Toqués du Cœur** (Harnes & Masny) : marché solidaire, paniers à 5 €, moments de partage, adhésion.

- Vite + React + TypeScript, sans base de données.
- Formulaire d'adhésion / contact géré par **Netlify Forms** (les demandes arrivent dans l'onglet *Forms* du projet Netlify, avec notification par e-mail à configurer dans *Forms → Notifications*).
- Photos de l'association dans `public/assets` (issues de la page Facebook), référencées dans `src/App.tsx` (const PHOTOS).

```bash
npm install
npm run dev
```

## Espace adhérent (`/adherent`)

Code dans `src/adherent`, chargé à part de la vitrine. Données dans Supabase (projet `les-toques-du-coeur`).

- Connexion par lien e-mail, sans mot de passe. Dans Supabase → *Authentication → URL Configuration*, ajouter `https://toques-du-coeur.netlify.app/adherent` aux *Redirect URLs*.
- Schéma et règles d'accès : `supabase/migrations/20261102_espace_adherent.sql`. Un nouveau foyer est « en attente » : le bureau passe `statut` à `actif` et renseigne `adhesion_fin` (tableau Supabase en attendant l'espace gestion).
- Les dates de distribution et de marché se créent dans la table `evenements` (pas de `lieu` pour un marché).
- Rappels de la veille : fonction `supabase/functions/rappels-veille` (déployée sans vérification JWT), envoi par Brevo, lancée chaque soir par `supabase/migrations/20261102_rappels_veille.sql`. Secrets : `BREVO_API_KEY`, `CRON_SECRET`, `EXPEDITEUR_EMAIL`.

## Espace gestion (`/gestion`)

Code dans `src/gestion`, pour le bureau (`role = 'admin'` dans la table `admins`) et les bénévoles (`role = 'benevole'`). Même connexion que l'espace adhérent.

- Tableau de bord, adhérents (validation, renouvellement, foyers sans compte, export pour Excel), distributions (dates, réservations, pointage par QR code ou par liste), planning, messages groupés, statistiques et équipe.
- Schéma : `supabase/migrations/20261102_espace_gestion.sql`.
- Messages par e-mail ou SMS : fonction `supabase/functions/envoyer-message` (avec vérification JWT), envoi par Brevo. Sans clé Brevo, les messages restent affichés dans l'espace adhérent.

Déploiement : chaque `git push` sur `main` déclenche un build Netlify (`npm run build` → `dist`).
