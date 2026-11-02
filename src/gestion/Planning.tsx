import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { aujourdhui, dateCourte, dateLongue, heure, message, supabase, type Evenement } from '../adherent/supabase'
import type { Role } from './outils'

type Inscrit = { id: string; evenement_id: string; user_id: string | null; nom: string; mission: string | null }
type Membre = { user_id: string; email: string; nom: string | null; role: string }
type Candidature = { id: string; disponibilites: string | null; message: string | null; created_at: string; foyers: { prenom: string; nom: string; telephone: string | null; email: string | null } }

const nomMembre = (m: Membre) => m.nom || m.email.split('@')[0]

export default function Planning({ role, userId }: { role: Role; userId: string }) {
  const [dates, setDates] = useState<Evenement[] | null>(null)
  const [inscrits, setInscrits] = useState<Inscrit[]>([])
  const [equipe, setEquipe] = useState<Membre[]>([])
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [ajout, setAjout] = useState<Evenement | null>(null)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const [{ data: es, error }, { data: ps }, { data: eq }, { data: cs }] = await Promise.all([
      supabase.from('evenements').select('*').gte('jour', aujourdhui()).order('jour').order('heure_debut').limit(12),
      supabase.from('planning').select('*'),
      supabase.rpc('equipe'),
      supabase.from('candidatures_benevoles').select('id, disponibilites, message, created_at, foyers(prenom, nom, telephone, email)').order('created_at', { ascending: false }),
    ])
    if (error) setErreur(message(error))
    setDates((es ?? []) as Evenement[])
    setInscrits((ps ?? []) as Inscrit[])
    setEquipe((eq ?? []) as Membre[])
    setCandidatures((cs ?? []) as unknown as Candidature[])
  }, [])
  useEffect(() => { void charger() }, [charger])

  const moi = equipe.find((m) => m.user_id === userId)

  async function venir(e: Evenement) {
    setErreur('')
    const { error } = await supabase.from('planning').insert({ evenement_id: e.id, user_id: userId, nom: moi ? nomMembre(moi) : 'Moi' })
    if (error) setErreur(message(error)); else await charger()
  }
  async function retirer(i: Inscrit) {
    setErreur('')
    const { error } = await supabase.from('planning').delete().eq('id', i.id)
    if (error) setErreur(message(error)); else await charger()
  }

  return (
    <>
      <div className="ges-head"><h1>Planning des bénévoles</h1></div>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      {dates === null ? <p className="esp-wait">Chargement…</p> : dates.length === 0 ? <p className="ges-empty">Aucune date à venir.</p> : (
        <ul className="ges-planning">
          {dates.map((e) => {
            const liste = inscrits.filter((i) => i.evenement_id === e.id)
            const inscrit = liste.find((i) => i.user_id === userId)
            return (
              <li key={e.id} className="ges-card">
                <div className="ges-planning-head">
                  <div>
                    <span className={'eyebrow' + (e.type === 'marche' ? ' green' : '')}>{e.type === 'marche' ? 'Marché' : 'Distribution'}</span>
                    <h2 className="cap">{dateLongue(e.jour)}</h2>
                    <p className="esp-small">{heure(e.heure_debut)} – {heure(e.heure_fin)}</p>
                  </div>
                  <b className="ges-count">{liste.length}<small>bénévole{liste.length > 1 ? 's' : ''}</small></b>
                </div>
                {liste.length > 0 && (
                  <ul className="ges-people">
                    {liste.map((i) => (
                      <li key={i.id}>
                        <span><b>{i.nom}</b>{i.mission && <small> · {i.mission}</small>}</span>
                        {(role === 'admin' || i.user_id === userId) && <button className="ges-mini" onClick={() => retirer(i)} aria-label={`Retirer ${i.nom}`}>Retirer</button>}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="ges-row">
                  {!inscrit && <button className="ges-btn" onClick={() => venir(e)}>Je viens</button>}
                  {inscrit && <span className="ges-tag active">Vous êtes inscrit</span>}
                  {role === 'admin' && <button className="ges-btn soft" onClick={() => setAjout(e)}>Ajouter quelqu'un</button>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="ges-head"><h2>Propositions reçues sur l'espace adhérent</h2></div>
      {candidatures.length === 0 ? <p className="ges-empty">Aucune proposition pour l'instant.</p> : (
        <ul className="ges-list ges-card">
          {candidatures.map((c) => (
            <li key={c.id} className="col">
              <span><b>{c.foyers.prenom} {c.foyers.nom}</b> <small className="ges-muted">le {dateCourte(c.created_at.slice(0, 10))}</small></span>
              {c.disponibilites && <small>Disponible : {c.disponibilites}</small>}
              {c.message && <small>« {c.message} »</small>}
              <small>{c.foyers.telephone && <a href={`tel:${c.foyers.telephone.replace(/\s/g, '')}`}>{c.foyers.telephone}</a>}{c.foyers.telephone && c.foyers.email && ' · '}{c.foyers.email && <a href={`mailto:${c.foyers.email}`}>{c.foyers.email}</a>}</small>
            </li>
          ))}
        </ul>
      )}

      {ajout && <AjoutBenevole evenement={ajout} equipe={equipe} dejaInscrits={inscrits.filter((i) => i.evenement_id === ajout.id)} onClose={() => setAjout(null)} onDone={charger} />}
    </>
  )
}

function AjoutBenevole({ evenement, equipe, dejaInscrits, onClose, onDone }: {
  evenement: Evenement; equipe: Membre[]; dejaInscrits: Inscrit[]; onClose: () => void; onDone: () => Promise<void>
}) {
  const libres = equipe.filter((m) => !dejaInscrits.some((i) => i.user_id === m.user_id))
  const [qui, setQui] = useState(libres[0]?.user_id ?? 'autre')
  const [erreur, setErreur] = useState('')
  async function ajouter(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const d = new FormData(ev.currentTarget)
    const m = libres.find((x) => x.user_id === qui)
    const nom = m ? nomMembre(m) : String(d.get('nom') ?? '').trim()
    if (!nom) { setErreur('Indiquez un nom.'); return }
    const { error } = await supabase.from('planning').insert({ evenement_id: evenement.id, user_id: m?.user_id ?? null, nom, mission: String(d.get('mission') ?? '').trim() || null })
    if (error) setErreur(message(error)); else { await onDone(); onClose() }
  }
  return (
    <div className="ges-overlay" onClick={onClose}>
      <aside className="ges-drawer" role="dialog" aria-modal="true" aria-label="Ajouter un bénévole" onClick={(e) => e.stopPropagation()}>
        <button className="ges-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>Ajouter un bénévole</h2>
        <p className="esp-small cap">{dateLongue(evenement.jour)}</p>
        <form className="esp-form" onSubmit={ajouter}>
          <label>Qui ?
            <select value={qui} onChange={(e) => setQui(e.target.value)}>
              {libres.map((m) => <option key={m.user_id} value={m.user_id}>{nomMembre(m)}</option>)}
              <option value="autre">Une autre personne…</option>
            </select>
          </label>
          {qui === 'autre' && <label>Nom<input name="nom" required maxLength={80} /></label>}
          <label>Mission (facultatif)<input name="mission" maxLength={120} placeholder="Accueil, préparation, camion…" /></label>
          <button className="esp-btn">Ajouter</button>
          {erreur && <p className="esp-err" role="alert">{erreur}</p>}
        </form>
      </aside>
    </div>
  )
}
