import { useCallback, useEffect, useMemo, useState } from 'react'
import { dateCourte, message, supabase } from '../adherent/supabase'
import { recherche, telechargerCsv, type Role } from './outils'

export type Demande = {
  id: string
  prenom: string
  nom: string
  email: string
  telephone: string | null
  ville: string | null
  souhait: string
  message: string | null
  statut: 'nouvelle' | 'traitee' | 'archivee'
  foyer_id: string | null
  note: string | null
  created_at: string
  traitee_at: string | null
}

type Filtre = 'nouvelle' | 'traitee' | 'archivee' | 'toutes'
const LIBELLE: Record<Demande['statut'], string> = { nouvelle: 'Nouvelle', traitee: 'Traitée', archivee: 'Archivée' }
const TAG: Record<Demande['statut'], string> = { nouvelle: 'attente', traitee: 'active', archivee: '' }
const estAdhesion = (d: Demande) => d.souhait.toLowerCase().startsWith('adhérer')

export default function Demandes({ role }: { role: Role }) {
  const [demandes, setDemandes] = useState<Demande[] | null>(null)
  const [filtre, setFiltre] = useState<Filtre>('nouvelle')
  const [q, setQ] = useState('')
  const [ouverte, setOuverte] = useState<Demande | null>(null)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('demandes').select('*').order('created_at', { ascending: false })
    if (error) setErreur(message(error))
    const list = (data ?? []) as Demande[]
    setDemandes(list)
    setOuverte((o) => (o ? list.find((d) => d.id === o.id) ?? null : null))
  }, [])
  useEffect(() => { void charger() }, [charger])

  const visibles = useMemo(() => {
    const s = recherche(q.trim())
    return (demandes ?? []).filter((d) =>
      (filtre === 'toutes' || d.statut === filtre) &&
      (!s || recherche(`${d.prenom} ${d.nom} ${d.email} ${d.telephone ?? ''} ${d.ville ?? ''} ${d.souhait}`).includes(s)))
  }, [demandes, filtre, q])

  const compte = (s: Demande['statut']) => (demandes ?? []).filter((d) => d.statut === s).length
  const filtres: [Filtre, string][] = [
    ['nouvelle', `Nouvelles (${compte('nouvelle')})`],
    ['traitee', `Traitées (${compte('traitee')})`],
    ['archivee', `Archivées (${compte('archivee')})`],
    ['toutes', `Toutes (${demandes?.length ?? 0})`],
  ]

  function exporter() {
    telechargerCsv('demandes.csv', [
      ['Reçue le', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Ville', 'Souhait', 'Message', 'Statut'],
      ...visibles.map((d) => [d.created_at.slice(0, 10), d.prenom, d.nom, d.email, d.telephone, d.ville, d.souhait, d.message, LIBELLE[d.statut]]),
    ])
  }

  return (
    <>
      <div className="ges-head">
        <h1>Demandes</h1>
        <div className="ges-row"><button className="ges-btn soft" onClick={exporter} disabled={!visibles.length}>Exporter pour Excel</button></div>
      </div>
      <p className="esp-small">Les demandes envoyées depuis le formulaire « Envoyer ma demande » du site : adhésion, bénévolat, don, location, partenariat…</p>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      <div className="ges-filters">
        <input type="search" placeholder="Nom, e-mail, souhait…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher une demande" />
        <div className="ges-chips" role="group" aria-label="Filtrer les demandes">
          {filtres.map(([id, l]) => <button key={id} aria-pressed={filtre === id} onClick={() => setFiltre(id)}>{l}</button>)}
        </div>
      </div>

      {demandes === null ? <p className="esp-wait">Chargement…</p> : visibles.length === 0 ? <p className="ges-empty">Aucune demande ici.</p> : (
        <div className="ges-table-wrap">
          <table className="ges-table">
            <thead><tr><th>Reçue</th><th>Nom</th><th>Souhait</th><th className="hide-s">Contact</th><th>Statut</th></tr></thead>
            <tbody>
              {visibles.map((d) => (
                <tr key={d.id} onClick={() => setOuverte(d)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOuverte(d)}>
                  <td>{dateCourte(d.created_at.slice(0, 10))}</td>
                  <td><b>{d.prenom} {d.nom}</b>{d.ville && <small className="ges-muted"> · {d.ville}</small>}</td>
                  <td>{d.souhait}</td>
                  <td className="hide-s">{d.telephone ?? d.email}</td>
                  <td><span className={'ges-tag ' + TAG[d.statut]}>{LIBELLE[d.statut]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ouverte && <Fiche demande={ouverte} role={role} onClose={() => setOuverte(null)} onChange={charger} />}
    </>
  )
}

function Fiche({ demande: d, role, onClose, onChange }: { demande: Demande; role: Role; onClose: () => void; onChange: () => Promise<void> }) {
  const [occupe, setOccupe] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)
  const [note, setNote] = useState(d.note ?? '')
  const bureau = role === 'admin'

  async function changer(champs: Partial<Demande>, ok: string) {
    setOccupe(true)
    const { error } = await supabase.from('demandes').update(champs).eq('id', d.id)
    setOccupe(false)
    if (error) setMsg({ ok: false, texte: message(error) })
    else { setMsg({ ok: true, texte: ok }); await onChange() }
  }

  async function creerFoyer() {
    setOccupe(true)
    const { data, error } = await supabase.from('foyers').insert({
      prenom: d.prenom.trim(),
      nom: d.nom.trim(),
      email: d.email.trim(),
      telephone: d.telephone,
      ville: d.ville,
      rappel: 'email',
      statut: 'en_attente',
    }).select('id').single()
    if (error) { setOccupe(false); setMsg({ ok: false, texte: message(error) }); return }
    await changer({ foyer_id: data.id, statut: 'traitee', traitee_at: new Date().toISOString() },
      'Foyer créé dans Adhérents, en attente : activez-le quand les 15 € sont réglés.')
  }

  return (
    <div className="ges-overlay" onClick={onClose}>
      <aside className="ges-drawer" role="dialog" aria-modal="true" aria-label={`Demande de ${d.prenom} ${d.nom}`} onClick={(e) => e.stopPropagation()}>
        <button className="ges-close" onClick={onClose} aria-label="Fermer">×</button>
        <span className={'ges-tag ' + TAG[d.statut]}>{LIBELLE[d.statut]}</span>
        <h2>{d.prenom} {d.nom}</h2>
        <p className="esp-small">Reçue le {dateCourte(d.created_at.slice(0, 10))} · {d.souhait}</p>

        <ul className="ges-list">
          <li><span className="cap">E-mail</span><a href={`mailto:${d.email}`}>{d.email}</a></li>
          {d.telephone && <li><span className="cap">Téléphone</span><a href={`tel:${d.telephone.replace(/\s/g, '')}`}>{d.telephone}</a></li>}
          {d.ville && <li><span className="cap">Ville</span><span>{d.ville}</span></li>}
        </ul>
        {d.message && <><h3>Message</h3><p style={{ whiteSpace: 'pre-wrap' }}>{d.message}</p></>}

        {bureau ? (
          <>
            <h3>Suivi</h3>
            <div className="ges-row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {estAdhesion(d) && !d.foyer_id && <button className="ges-btn" disabled={occupe} onClick={creerFoyer}>Créer le foyer adhérent</button>}
              {d.statut !== 'traitee' && <button className="ges-btn soft" disabled={occupe} onClick={() => changer({ statut: 'traitee', traitee_at: new Date().toISOString() }, 'Demande marquée comme traitée.')}>Marquer traitée</button>}
              {d.statut !== 'archivee' && <button className="ges-btn soft" disabled={occupe} onClick={() => changer({ statut: 'archivee' }, 'Demande archivée.')}>Archiver</button>}
              {d.statut !== 'nouvelle' && <button className="ges-btn soft" disabled={occupe} onClick={() => changer({ statut: 'nouvelle', traitee_at: null }, 'Demande remise en « nouvelle ».')}>Remettre en nouvelle</button>}
            </div>
            {d.foyer_id && <p className="esp-small">Un foyer a été créé pour cette demande (page Adhérents).</p>}
            <form className="esp-form" onSubmit={(e) => { e.preventDefault(); void changer({ note: note.trim() || null }, 'Note enregistrée.') }}>
              <label>Note interne<textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
              <button className="esp-btn soft" disabled={occupe}>Enregistrer la note</button>
            </form>
          </>
        ) : d.note && <><h3>Note du bureau</h3><p>{d.note}</p></>}
        {msg && <p className={msg.ok ? 'esp-ok' : 'esp-err'} role={msg.ok ? 'status' : 'alert'}>{msg.texte}</p>}
      </aside>
    </div>
  )
}
