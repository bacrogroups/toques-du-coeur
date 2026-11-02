import { aujourdhui, type Foyer } from '../adherent/supabase'

export type Role = 'admin' | 'benevole'

/** Ajoute des jours à une date AAAA-MM-JJ. */
export function plusJours(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Fin d'adhésion un an après une date, la veille de la date anniversaire. */
export function finDansUnAn(depuis: string): string {
  const d = new Date(depuis + 'T12:00:00')
  d.setFullYear(d.getFullYear() + 1)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export type EtatAdhesion = 'attente' | 'active' | 'bientot' | 'terminee' | 'suspendue'

export function etatAdhesion(f: Foyer): EtatAdhesion {
  if (f.statut === 'en_attente') return 'attente'
  if (f.statut === 'suspendu') return 'suspendue'
  if (!f.adhesion_fin || f.adhesion_fin < aujourdhui()) return 'terminee'
  if (f.adhesion_fin <= plusJours(aujourdhui(), 30)) return 'bientot'
  return 'active'
}

export const LIBELLE_ETAT: Record<EtatAdhesion, string> = {
  attente: 'En attente',
  active: 'Active',
  bientot: 'Expire bientôt',
  terminee: 'Terminée',
  suspendue: 'Suspendue',
}

export const numero = (f: Pick<Foyer, 'numero'>) => 'N° ' + String(f.numero).padStart(4, '0')

/** Fichier CSV lisible par Excel (séparateur point-virgule, accents conservés). */
export function telechargerCsv(nom: string, lignes: (string | number | null | undefined)[][]) {
  const cellule = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const contenu = '﻿' + lignes.map((l) => l.map(cellule).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  a.click()
  URL.revokeObjectURL(url)
}

export const recherche = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
