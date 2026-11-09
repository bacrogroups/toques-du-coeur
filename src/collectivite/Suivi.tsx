import { dateLongue, heure } from '../adherent/supabase'
import { ETAPES, LIBELLE, type Commande, type Suivi } from './commandes'

/** Frise des étapes : demandée → validée → en préparation → prête → retirée. */
export function Frise({ commande: c }: { commande: Commande }) {
  if (c.statut === 'refusee' || c.statut === 'annulee') return null
  const atteinte = ETAPES.indexOf(c.statut)
  return (
    <ol className="col-frise" aria-label="Avancement de la commande">
      {ETAPES.map((e, i) => (
        <li key={e} className={i < atteinte ? 'fait' : i === atteinte ? 'ici' : ''} aria-current={i === atteinte ? 'step' : undefined}>
          <span aria-hidden="true">{i < atteinte ? '✓' : i + 1}</span>
          <small>{LIBELLE[e]}</small>
        </li>
      ))}
    </ol>
  )
}

/** Encadré « venez la chercher le … à … ». */
export function Retrait({ commande: c }: { commande: Commande }) {
  if (!c.date_retrait) return null
  const prete = c.statut === 'prete'
  return (
    <div className={'col-retrait' + (prete ? ' prete' : '')}>
      <b>{prete ? 'Votre commande est prête : vous pouvez venir la chercher' : 'Retrait prévu'}</b>
      <span className="cap">
        le {dateLongue(c.date_retrait)}{c.heure_retrait ? ` à partir de ${heure(c.heure_retrait)}` : ''}
      </span>
      {c.lieu_retrait && <span>📍 {c.lieu_retrait}</span>}
    </div>
  )
}

const horodatage = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function Historique({ lignes }: { lignes: Suivi[] }) {
  if (!lignes.length) return null
  return (
    <ul className="col-histo">
      {lignes.map((l) => (
        <li key={l.id} className={l.statut}>
          <span><b>{LIBELLE[l.statut]}</b><small>{horodatage(l.created_at)}</small></span>
          {l.note && <p>{l.note}</p>}
        </li>
      ))}
    </ul>
  )
}
