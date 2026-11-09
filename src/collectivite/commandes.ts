// Types et libellés partagés entre l'espace collectivités et l'espace gestion.

export type Collectivite = {
  id: string
  user_id: string
  nom: string
  type: 'mairie' | 'ccas' | 'ecole' | 'association' | 'entreprise' | 'autre'
  contact: string
  email: string | null
  telephone: string | null
  adresse: string | null
  ville: string | null
  siret: string | null
  statut: 'en_attente' | 'active' | 'suspendue'
  created_at: string
}

export type StatutCommande = 'demandee' | 'validee' | 'en_preparation' | 'prete' | 'retiree' | 'refusee' | 'annulee'

export type Commande = {
  id: string
  numero: number
  collectivite_id: string
  paniers_demandes: number
  date_souhaitee: string
  message: string | null
  paniers: number | null
  date_retrait: string | null
  heure_retrait: string | null
  lieu_retrait: string | null
  prix_unitaire: number
  montant: number
  note_bureau: string | null
  statut: StatutCommande
  created_at: string
  updated_at: string
}

export type Suivi = { id: string; commande_id: string; statut: StatutCommande | 'modifiee'; note: string | null; created_at: string }

export type Reglages = { prix_panier_collectivite: number; lieu_retrait: string | null; delai_commande_jours: number }

export const TYPES: Record<Collectivite['type'], string> = {
  mairie: 'Mairie',
  ccas: 'CCAS',
  ecole: 'École / collège',
  association: 'Association',
  entreprise: 'Entreprise',
  autre: 'Autre',
}

/** Les étapes affichées dans la frise de suivi. */
export const ETAPES: StatutCommande[] = ['demandee', 'validee', 'en_preparation', 'prete', 'retiree']

export const LIBELLE: Record<Suivi['statut'], string> = {
  demandee: 'Demande envoyée',
  validee: 'Commande validée',
  modifiee: 'Commande ajustée',
  en_preparation: 'En préparation',
  prete: 'Prête à retirer',
  retiree: 'Retirée',
  refusee: 'Refusée',
  annulee: 'Annulée',
}

export const COURT: Record<StatutCommande, string> = {
  demandee: 'Demandée',
  validee: 'Validée',
  en_preparation: 'Préparation',
  prete: 'Prête',
  retiree: 'Retirée',
  refusee: 'Refusée',
  annulee: 'Annulée',
}

/** Classe de couleur de l'étiquette d'état. */
export const TON: Record<StatutCommande, 'wait' | 'on' | 'off' | 'neutre'> = {
  demandee: 'wait',
  validee: 'on',
  en_preparation: 'on',
  prete: 'on',
  retiree: 'neutre',
  refusee: 'off',
  annulee: 'off',
}

export const numeroCommande = (c: Pick<Commande, 'numero'>) => 'Commande n° ' + String(c.numero).padStart(4, '0')

export const euros = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

/** Nombre de paniers retenu : celui validé par le bureau, sinon celui demandé. */
export const nbPaniers = (c: Commande) => c.paniers ?? c.paniers_demandes

export const enCours = (c: Commande) => ['demandee', 'validee', 'en_preparation', 'prete'].includes(c.statut)
