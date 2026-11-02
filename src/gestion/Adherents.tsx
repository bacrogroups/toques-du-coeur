import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { aujourdhui, dateCourte, dateLongue, message, supabase, type Evenement, type Foyer } from '../adherent/supabase'
import { etatAdhesion, finDansUnAn, LIBELLE_ETAT, numero, recherche, telechargerCsv, type EtatAdhesion, type Role } from './outils'

type Filtre = 'tous' | EtatAdhesion
type Resa = { id: string; statut: string; evenements: { jour: string } }

export default function Adherents({ role }: { role: Role }) {
  const [foyers, setFoyers] = useState<Foyer[] | null>(null)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [q, setQ] = useState('')
  const [ouvert, setOuvert] = useState<Foyer | null>(null)
  const [creation, setCreation] = useState(false)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('foyers').select('*').order('nom').order('prenom')
    if (error) setErreur(message(error))
    const list = (data ?? []) as Foyer[]
    setFoyers(list)
    setOuvert((o) => (o ? list.find((f) => f.id === o.id) ?? null : null))
  }, [])
  useEffect(() => { void charger() }, [charger])

  const visibles = useMemo(() => {
    const s = recherche(q.trim())
    return (foyers ?? []).filter((f) =>
      (filtre === 'tous' || etatAdhesion(f) === filtre) &&
      (!s || recherche(`${f.prenom} ${f.nom} ${f.numero} ${f.email ?? ''} ${f.telephone ?? ''} ${f.ville ?? ''}`).includes(s)))
  }, [foyers, filtre, q])

  const compte = (e: EtatAdhesion) => (foyers ?? []).filter((f) => etatAdhesion(f) === e).length

  function exporter() {
    telechargerCsv(`adherents-${aujourdhui()}.csv`, [
      ['Numéro', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Ville', 'Personnes', 'Adhésion', 'Fin d\'adhésion', 'Inscrit le'],
      ...visibles.map((f) => [f.numero, f.prenom, f.nom, f.email, f.telephone, f.ville, f.nb_personnes, LIBELLE_ETAT[etatAdhesion(f)], f.adhesion_fin, f.created_at.slice(0, 10)]),
    ])
  }

  const filtres: [Filtre, string][] = [
    ['tous', `Tous (${foyers?.length ?? 0})`],
    ['attente', `En attente (${compte('attente')})`],
    ['active', `Actives (${compte('active')})`],
    ['bientot', `Expirent bientôt (${compte('bientot')})`],
    ['terminee', `Terminées (${compte('terminee')})`],
    ['suspendue', `Suspendues (${compte('suspendue')})`],
  ]

  return (
    <>
      <div className="ges-head">
        <h1>Adhérents</h1>
        <div className="ges-row">
          {role === 'admin' && <button className="ges-btn" onClick={() => setCreation(true)}>Ajouter un foyer sans compte</button>}
          <button className="ges-btn soft" onClick={exporter} disabled={!visibles.length}>Exporter pour Excel</button>
        </div>
      </div>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      <div className="ges-filters">
        <input type="search" placeholder="Nom, numéro, téléphone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un adhérent" />
        <div className="ges-chips" role="group" aria-label="Filtrer par adhésion">
          {filtres.map(([id, l]) => <button key={id} aria-pressed={filtre === id} onClick={() => setFiltre(id)}>{l}</button>)}
        </div>
      </div>

      {foyers === null ? <p className="esp-wait">Chargement…</p> : visibles.length === 0 ? <p className="ges-empty">Aucun adhérent ne correspond.</p> : (
        <div className="ges-table-wrap">
          <table className="ges-table">
            <thead><tr><th>N°</th><th>Nom</th><th className="hide-s">Contact</th><th className="hide-s">Foyer</th><th>Adhésion</th></tr></thead>
            <tbody>
              {visibles.map((f) => {
                const etat = etatAdhesion(f)
                return (
                  <tr key={f.id} onClick={() => setOuvert(f)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOuvert(f)}>
                    <td className="num">{String(f.numero).padStart(4, '0')}</td>
                    <td><b>{f.prenom} {f.nom}</b>{!f.user_id && <small className="ges-muted"> · sans compte</small>}</td>
                    <td className="hide-s">{f.telephone ?? f.email ?? '—'}</td>
                    <td className="hide-s">{f.nb_personnes} pers. · {f.ville ?? '—'}</td>
                    <td><span className={'ges-tag ' + etat}>{LIBELLE_ETAT[etat]}</span>{f.adhesion_fin && etat !== 'attente' && <small className="ges-muted"> {dateCourte(f.adhesion_fin)}</small>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {ouvert && <Fiche foyer={ouvert} role={role} onClose={() => setOuvert(null)} onChange={charger} />}
      {creation && <NouveauFoyer onClose={() => setCreation(false)} onCreated={charger} />}
    </>
  )
}

function Fiche({ foyer: f, role, onClose, onChange }: { foyer: Foyer; role: Role; onClose: () => void; onChange: () => Promise<void> }) {
  const [resas, setResas] = useState<Resa[]>([])
  const [dates, setDates] = useState<Evenement[]>([])
  const [evt, setEvt] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)
  const [occupe, setOccupe] = useState(false)
  const etat = etatAdhesion(f)

  const charger = useCallback(async () => {
    const [{ data: rs }, { data: es }] = await Promise.all([
      supabase.from('reservations').select('id, statut, evenements!inner(jour)').eq('foyer_id', f.id).neq('statut', 'annulee'),
      supabase.from('evenements').select('*').eq('type', 'distribution').gte('jour', aujourdhui()).order('jour').limit(12),
    ])
    const list = (rs ?? []) as unknown as Resa[]
    list.sort((a, b) => b.evenements.jour.localeCompare(a.evenements.jour))
    setResas(list)
    setDates((es ?? []) as Evenement[])
    setEvt((v) => v || (es?.[0] as Evenement | undefined)?.id || '')
  }, [f.id])
  useEffect(() => { void charger() }, [charger])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  async function adhesion(champs: Partial<Foyer>, texte: string) {
    setOccupe(true); setMsg(null)
    const { error } = await supabase.from('foyers').update(champs).eq('id', f.id)
    setMsg(error ? { ok: false, texte: message(error) } : { ok: true, texte })
    await onChange(); setOccupe(false)
  }
  const valider = () => adhesion({ statut: 'actif', adhesion_fin: finDansUnAn(aujourdhui()) }, 'Adhésion validée pour un an.')
  // Une adhésion encore en cours est prolongée d'un an ; une adhésion terminée repart d'aujourd'hui.
  const renouveler = () => {
    const enCours = !!f.adhesion_fin && f.adhesion_fin >= aujourdhui()
    void adhesion({ statut: 'actif', adhesion_fin: enCours ? plusUnAn(f.adhesion_fin!) : finDansUnAn(aujourdhui()) }, 'Adhésion renouvelée pour un an.')
  }

  async function reserver() {
    if (!evt) return
    setOccupe(true); setMsg(null)
    const { error } = await supabase.rpc('reserver_panier', { evt, pour_foyer: f.id })
    setMsg(error ? { ok: false, texte: message(error) } : { ok: true, texte: 'Panier réservé.' })
    await charger(); setOccupe(false)
  }
  async function annuler(id: string) {
    setOccupe(true); setMsg(null)
    const { error } = await supabase.rpc('annuler_reservation', { resa: id })
    setMsg(error ? { ok: false, texte: message(error) } : { ok: true, texte: 'Réservation annulée.' })
    await charger(); setOccupe(false)
  }

  return (
    <div className="ges-overlay" onClick={onClose}>
      <aside className="ges-drawer" role="dialog" aria-modal="true" aria-label={`Fiche de ${f.prenom} ${f.nom}`} onClick={(e) => e.stopPropagation()}>
        <button className="ges-close" onClick={onClose} aria-label="Fermer">×</button>
        <span className={'ges-tag ' + etat}>{LIBELLE_ETAT[etat]}</span>
        <h2>{f.prenom} {f.nom}</h2>
        <dl className="ges-dl">
          <dt>Carte</dt><dd>{numero(f)}</dd>
          <dt>Foyer</dt><dd>{f.nb_personnes} personne{f.nb_personnes > 1 ? 's' : ''}{f.ville ? ` · ${f.ville}` : ''}</dd>
          <dt>E-mail</dt><dd>{f.email ? <a href={`mailto:${f.email}`}>{f.email}</a> : '—'}</dd>
          <dt>Téléphone</dt><dd>{f.telephone ? <a href={`tel:${f.telephone.replace(/\s/g, '')}`}>{f.telephone}</a> : '—'}</dd>
          <dt>Rappels</dt><dd>{{ email: 'Par e-mail', sms: 'Par SMS', aucun: 'Aucun' }[f.rappel]}</dd>
          <dt>Fin d'adhésion</dt><dd>{f.adhesion_fin ? dateCourte(f.adhesion_fin) : '—'}</dd>
          <dt>Inscrit le</dt><dd>{dateCourte(f.created_at.slice(0, 10))}{!f.user_id && ' · sans compte'}</dd>
        </dl>

        {role === 'admin' && (
          <div className="ges-actions">
            {etat === 'attente' && <button className="esp-btn" disabled={occupe} onClick={valider}>Valider l'adhésion (15 € réglés)</button>}
            {(etat === 'active' || etat === 'bientot' || etat === 'terminee') && <button className="esp-btn" disabled={occupe} onClick={renouveler}>Renouveler pour un an</button>}
            {etat === 'suspendue' && <button className="esp-btn" disabled={occupe} onClick={() => adhesion({ statut: 'actif' }, 'Adhésion réactivée.')}>Réactiver</button>}
            {etat !== 'suspendue' && etat !== 'attente' && <button className="esp-btn soft" disabled={occupe} onClick={() => window.confirm('Suspendre cette adhésion ?') && adhesion({ statut: 'suspendu' }, 'Adhésion suspendue.')}>Suspendre</button>}
          </div>
        )}

        <h3>Réserver un panier pour ce foyer</h3>
        {dates.length === 0 ? <p className="esp-small">Aucune distribution à venir.</p> : (
          <div className="ges-row">
            <select value={evt} onChange={(e) => setEvt(e.target.value)} aria-label="Distribution">
              {dates.map((d) => <option key={d.id} value={d.id}>{dateLongue(d.jour)}</option>)}
            </select>
            <button className="ges-btn" disabled={occupe || !evt} onClick={reserver}>Réserver</button>
          </div>
        )}
        {msg && <p className={msg.ok ? 'esp-ok' : 'esp-err'} role={msg.ok ? 'status' : 'alert'}>{msg.texte}</p>}

        <h3>Paniers</h3>
        {resas.length === 0 ? <p className="esp-small">Aucun panier pour l'instant.</p> : (
          <ul className="ges-list">
            {resas.map((r) => (
              <li key={r.id}>
                <span className="cap">{dateLongue(r.evenements.jour)}</span>
                <span className="ges-row">
                  <span className={'ges-tag ' + (r.statut === 'retiree' ? 'active' : 'attente')}>{r.statut === 'retiree' ? 'Retiré' : 'Réservé'}</span>
                  {r.statut === 'reservee' && r.evenements.jour >= aujourdhui() && <button className="ges-mini" disabled={occupe} onClick={() => annuler(r.id)}>Annuler</button>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

function plusUnAn(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

function NouveauFoyer({ onClose, onCreated }: { onClose: () => void; onCreated: () => Promise<void> }) {
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  async function creer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const payee = d.get('payee') === 'on'
    setEnvoi(true)
    const { error } = await supabase.from('foyers').insert({
      prenom: String(d.get('prenom')).trim(),
      nom: String(d.get('nom')).trim(),
      telephone: String(d.get('telephone') ?? '').trim() || null,
      ville: String(d.get('ville')),
      nb_personnes: Number(d.get('nb_personnes')),
      rappel: String(d.get('telephone') ?? '').trim() ? 'sms' : 'aucun',
      statut: payee ? 'actif' : 'en_attente',
      adhesion_fin: payee ? finDansUnAn(aujourdhui()) : null,
    })
    setEnvoi(false)
    if (error) setErreur(message(error))
    else { await onCreated(); onClose() }
  }
  return (
    <div className="ges-overlay" onClick={onClose}>
      <aside className="ges-drawer" role="dialog" aria-modal="true" aria-label="Ajouter un foyer" onClick={(e) => e.stopPropagation()}>
        <button className="ges-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>Ajouter un foyer sans compte</h2>
        <p className="esp-small">Pour une personne sans smartphone : l'équipe réserve et pointe ses paniers à sa place. Sa carte se retrouve par son nom ou son numéro.</p>
        <form className="esp-form" onSubmit={creer}>
          <div className="esp-two">
            <label>Prénom<input name="prenom" required maxLength={80} /></label>
            <label>Nom<input name="nom" required maxLength={80} /></label>
          </div>
          <label>Téléphone (facultatif)<input name="telephone" type="tel" maxLength={30} /></label>
          <div className="esp-two">
            <label>Ville<select name="ville" defaultValue="Masny"><option>Masny</option><option>Harnes</option><option>Autre</option></select></label>
            <label>Personnes<input name="nb_personnes" type="number" min={1} max={20} defaultValue={1} required /></label>
          </div>
          <label className="ges-check"><input type="checkbox" name="payee" defaultChecked /> Adhésion de 15 € réglée : activer pour un an</label>
          <button className="esp-btn" disabled={envoi}>Ajouter</button>
          {erreur && <p className="esp-err" role="alert">{erreur}</p>}
        </form>
      </aside>
    </div>
  )
}
