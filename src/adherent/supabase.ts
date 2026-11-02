import { createClient } from '@supabase/supabase-js'

// Clé publiable : elle peut figurer dans le code, les règles RLS protègent les données.
const URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://gevmfeqxdrfcgdwsplyz.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_8mqD6ooogCfXlBrGX_anQg_n_1mTjmZ'

export const supabase = createClient(URL, KEY)

export type Foyer = {
  id: string
  user_id: string | null
  numero: number
  carte: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  ville: string | null
  nb_personnes: number
  rappel: 'email' | 'sms' | 'aucun'
  statut: 'en_attente' | 'actif' | 'suspendu'
  adhesion_fin: string | null
  created_at: string
}

export type Evenement = {
  id: string
  type: 'distribution' | 'marche'
  jour: string
  heure_debut: string
  heure_fin: string
  lieu: string | null
  note: string | null
  paniers_max: number | null
  publie?: boolean
}

export type Reservation = { id: string; evenement_id: string; semaine: string; statut: 'reservee' | 'annulee' | 'retiree'; foyer_id?: string; retiree_at?: string | null }
export type Message = {
  id: string
  titre: string
  texte: string
  cible: 'tous' | 'actifs' | 'evenement'
  evenement_id: string | null
  par_email: boolean
  par_sms: boolean
  publie: boolean
  expire_le: string | null
  envoye_at: string | null
  envois: number
  created_at: string
}
export type Candidature = { id: string; created_at: string }
export type Location = { id: string; date_debut: string; date_fin: string; tables: number; bancs: number; statut: 'demandee' | 'acceptee' | 'refusee' | 'annulee' }

/** Date du jour au format AAAA-MM-JJ, à l'heure locale. */
export function aujourdhui(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const dateLongue = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

export const dateCourte = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const heure = (t: string) => t.slice(0, 5).replace(/^0/, '').replace(':', ' h ').replace(' h 00', ' h')

/** Message d'erreur lisible, y compris pour les exceptions levées par les fonctions SQL. */
export function message(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: string }).message)
  return 'Une erreur est survenue. Réessayez dans un instant.'
}
