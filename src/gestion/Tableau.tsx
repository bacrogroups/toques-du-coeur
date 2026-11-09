import { useCallback, useEffect, useState } from 'react'
import { aujourdhui, dateCourte, dateLongue, heure, message, supabase, type Evenement, type Foyer } from '../adherent/supabase'
import { etatAdhesion, numero, plusJours, type Role } from './outils'
import type { Page } from './Gestion'

type Location = { id: string; date_debut: string; date_fin: string; tables: number; bancs: number; message: string | null; foyers: { prenom: string; nom: string; telephone: string | null; email: string | null } }

export default function Tableau({ role, aller }: { role: Role; aller: (p: Page) => void }) {
  const [prochaine, setProchaine] = useState<Evenement | null | undefined>(undefined)
  const [compte, setCompte] = useState({ reservees: 0, retirees: 0 })
  const [benevoles, setBenevoles] = useState(0)
  const [foyers, setFoyers] = useState<Foyer[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [coll, setColl] = useState({ demandes: 0, cours: 0, comptes: 0 })
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const [{ data: evts, error }, { data: fs }] = await Promise.all([
      supabase.from('evenements').select('*').eq('type', 'distribution').gte('jour', aujourdhui()).order('jour').order('heure_debut').limit(1),
      supabase.from('foyers').select('*'),
    ])
    if (error) { setErreur(message(error)); return }
    const e = (evts?.[0] as Evenement | undefined) ?? null
    setProchaine(e)
    setFoyers((fs ?? []) as Foyer[])
    if (e) {
      const [{ data: rs }, { count }] = await Promise.all([
        supabase.from('reservations').select('statut').eq('evenement_id', e.id).neq('statut', 'annulee'),
        supabase.from('planning').select('id', { count: 'exact', head: true }).eq('evenement_id', e.id),
      ])
      setCompte({ reservees: rs?.length ?? 0, retirees: rs?.filter((r) => r.statut === 'retiree').length ?? 0 })
      setBenevoles(count ?? 0)
    }
    const [{ data: cmds }, { count: comptes }] = await Promise.all([
      supabase.from('commandes').select('statut').in('statut', ['demandee', 'validee', 'en_preparation', 'prete']),
      supabase.from('collectivites').select('id', { count: 'exact', head: true }).eq('statut', 'en_attente'),
    ])
    setColl({ demandes: cmds?.filter((c) => c.statut === 'demandee').length ?? 0, cours: cmds?.filter((c) => c.statut !== 'demandee').length ?? 0, comptes: comptes ?? 0 })
    if (role === 'admin') {
      const { data: ls } = await supabase.from('locations').select('id, date_debut, date_fin, tables, bancs, message, foyers(prenom, nom, telephone, email)').eq('statut', 'demandee').order('date_debut')
      setLocations((ls ?? []) as unknown as Location[])
    }
  }, [role])
  useEffect(() => { void charger() }, [charger])

  async function repondre(id: string, statut: 'acceptee' | 'refusee') {
    const { error } = await supabase.from('locations').update({ statut }).eq('id', id)
    if (error) setErreur(message(error)); else await charger()
  }

  const attente = foyers.filter((f) => etatAdhesion(f) === 'attente')
  const bientot = foyers.filter((f) => etatAdhesion(f) === 'bientot').sort((a, b) => a.adhesion_fin!.localeCompare(b.adhesion_fin!))
  const actifs = foyers.filter((f) => ['active', 'bientot'].includes(etatAdhesion(f))).length
  const max = prochaine?.paniers_max ?? null

  return (
    <>
      <div className="ges-head"><h1>Tableau de bord</h1></div>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}

      <div className="ges-grid">
        <section className="ges-card big">
          <span className="eyebrow">Prochaine distribution</span>
          {prochaine === undefined ? <p className="esp-small">Chargement…</p> : prochaine ? (
            <>
              <h2 className="cap">{dateLongue(prochaine.jour)}</h2>
              <p className="esp-small">De {heure(prochaine.heure_debut)} à {heure(prochaine.heure_fin)}{prochaine.lieu ? ` · ${prochaine.lieu}` : ''}</p>
              <div className="ges-kpis">
                <div><b>{compte.reservees}</b><span>paniers réservés</span></div>
                <div><b>{max == null ? '—' : Math.max(0, max - compte.reservees)}</b><span>paniers restants{max != null ? ` sur ${max}` : ''}</span></div>
                <div><b>{compte.retirees}</b><span>déjà retirés</span></div>
                <div><b>{benevoles}</b><span>bénévoles inscrits</span></div>
              </div>
              <div className="ges-row">
                <button className="esp-btn" onClick={() => aller('distributions')}>Voir les réservations</button>
              </div>
            </>
          ) : (
            <>
              <p>Aucune distribution prévue.</p>
              {role === 'admin' && <button className="esp-btn" onClick={() => aller('distributions')}>Créer une date</button>}
            </>
          )}
        </section>

        <section className="ges-card">
          <span className="eyebrow green">Adhérents</span>
          <div className="ges-kpis two">
            <div><b>{actifs}</b><span>adhésions actives</span></div>
            <div><b>{attente.length}</b><span>en attente de validation</span></div>
          </div>
          {attente.length > 0 && <button className="esp-btn soft" onClick={() => aller('adherents')}>Valider les demandes</button>}
        </section>

        <section className="ges-card">
          <span className="eyebrow">Commandes des collectivités</span>
          <div className="ges-kpis two">
            <div><b>{coll.demandes}</b><span>demandes à traiter</span></div>
            <div><b>{coll.cours}</b><span>en cours</span></div>
          </div>
          {coll.comptes > 0 && <p className="esp-small">{coll.comptes} compte{coll.comptes > 1 ? 's' : ''} de structure à valider.</p>}
          <button className="esp-btn soft" onClick={() => aller('collectivites')}>Voir les commandes</button>
        </section>

        <section className="ges-card">
          <span className="eyebrow sun">Adhésions qui arrivent à échéance</span>
          {bientot.length === 0 ? <p className="esp-small">Aucune dans les 30 prochains jours.</p> : (
            <ul className="ges-list">
              {bientot.map((f) => (
                <li key={f.id}><span><b>{f.prenom} {f.nom}</b> <small>{numero(f)}</small></span><span className="ges-tag sun">le {dateCourte(f.adhesion_fin!)}</span></li>
              ))}
            </ul>
          )}
          <p className="esp-small">Fenêtre : jusqu'au {dateCourte(plusJours(aujourdhui(), 30))}.</p>
        </section>

        {role === 'admin' && (
          <section className="ges-card">
            <span className="eyebrow">Demandes de location</span>
            {locations.length === 0 ? <p className="esp-small">Aucune demande en attente.</p> : (
              <ul className="ges-list">
                {locations.map((l) => (
                  <li key={l.id} className="col">
                    <span><b>{l.foyers.prenom} {l.foyers.nom}</b> · {l.tables} tables, {l.bancs} bancs</span>
                    <small>{dateCourte(l.date_debut)}{l.date_fin !== l.date_debut ? ` → ${dateCourte(l.date_fin)}` : ''} · {l.foyers.telephone ?? l.foyers.email}</small>
                    {l.message && <small>« {l.message} »</small>}
                    <span className="ges-row">
                      <button className="ges-mini ok" onClick={() => repondre(l.id, 'acceptee')}>Accepter</button>
                      <button className="ges-mini" onClick={() => repondre(l.id, 'refusee')}>Refuser</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </>
  )
}
