import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { aujourdhui, dateLongue, heure, message, supabase, type Evenement, type Foyer } from '../adherent/supabase'
import { numero, recherche, telechargerCsv, type Role } from './outils'
import Pointage from './Pointage'

export type Ligne = { id: string; statut: 'reservee' | 'retiree' | 'annulee'; retiree_at: string | null; foyers: Foyer }

export default function Distributions({ role }: { role: Role }) {
  const [evenements, setEvenements] = useState<Evenement[] | null>(null)
  const [passes, setPasses] = useState(false)
  const [ouvert, setOuvert] = useState<Evenement | null>(null)
  const [edition, setEdition] = useState<Evenement | 'nouveau' | null>(null)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    let q = supabase.from('evenements').select('*')
    q = passes ? q.lt('jour', aujourdhui()).order('jour', { ascending: false }).limit(40) : q.gte('jour', aujourdhui()).order('jour').order('heure_debut')
    const { data, error } = await q
    if (error) setErreur(message(error))
    const list = (data ?? []) as Evenement[]
    setEvenements(list)
    setOuvert((o) => (o ? list.find((e) => e.id === o.id) ?? o : null))
  }, [passes])
  useEffect(() => { void charger() }, [charger])

  if (ouvert) return <Detail evenement={ouvert} role={role} retour={() => setOuvert(null)} modifier={() => setEdition(ouvert)} edition={edition} fermerEdition={() => setEdition(null)} recharger={charger} />

  return (
    <>
      <div className="ges-head">
        <h1>Distributions et marchés</h1>
        {role === 'admin' && <button className="ges-btn" onClick={() => setEdition('nouveau')}>Créer une date</button>}
      </div>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      <div className="ges-chips" role="group" aria-label="Période">
        <button aria-pressed={!passes} onClick={() => setPasses(false)}>À venir</button>
        <button aria-pressed={passes} onClick={() => setPasses(true)}>Passées</button>
      </div>
      {evenements === null ? <p className="esp-wait">Chargement…</p> : evenements.length === 0 ? <p className="ges-empty">Aucune date {passes ? 'passée' : 'à venir'}.</p> : (
        <ul className="ges-cards">
          {evenements.map((e) => (
            <li key={e.id}>
              <button className={'ges-evt ' + e.type} onClick={() => setOuvert(e)}>
                <span className={'eyebrow' + (e.type === 'marche' ? ' green' : '')}>{e.type === 'marche' ? 'Marché' : 'Distribution'}{e.publie === false ? ' · non publiée' : ''}</span>
                <b className="cap">{dateLongue(e.jour)}</b>
                <span className="esp-small">{heure(e.heure_debut)} – {heure(e.heure_fin)}{e.paniers_max != null ? ` · ${e.paniers_max} paniers` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {edition && <FormEvenement evenement={edition === 'nouveau' ? null : edition} onClose={() => setEdition(null)} onSaved={charger} />}
    </>
  )
}

function Detail({ evenement: e, role, retour, modifier, edition, fermerEdition, recharger }: {
  evenement: Evenement; role: Role; retour: () => void; modifier: () => void
  edition: Evenement | 'nouveau' | null; fermerEdition: () => void; recharger: () => Promise<void>
}) {
  const [lignes, setLignes] = useState<Ligne[] | null>(null)
  const [q, setQ] = useState('')
  const [pointage, setPointage] = useState(false)
  const [ajout, setAjout] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('reservations').select('id, statut, retiree_at, foyers(*)').eq('evenement_id', e.id).neq('statut', 'annulee')
    if (error) setMsg({ ok: false, texte: message(error) })
    const list = (data ?? []) as unknown as Ligne[]
    list.sort((a, b) => a.foyers.nom.localeCompare(b.foyers.nom, 'fr'))
    setLignes(list)
  }, [e.id])
  useEffect(() => { void charger() }, [charger])

  async function basculer(l: Ligne) {
    const statut = l.statut === 'retiree' ? 'reservee' : 'retiree'
    setLignes((ls) => ls?.map((x) => (x.id === l.id ? { ...x, statut } : x)) ?? null)
    const { error } = await supabase.from('reservations').update({ statut }).eq('id', l.id)
    if (error) { setMsg({ ok: false, texte: message(error) }); await charger() }
  }
  async function supprimer() {
    if (!window.confirm('Supprimer cette date et toutes ses réservations ?')) return
    const { error } = await supabase.from('evenements').delete().eq('id', e.id)
    if (error) setMsg({ ok: false, texte: message(error) }); else { await recharger(); retour() }
  }
  function exporter() {
    telechargerCsv(`reservations-${e.jour}.csv`, [
      ['Numéro', 'Prénom', 'Nom', 'Téléphone', 'Personnes', 'Retiré'],
      ...(lignes ?? []).map((l) => [l.foyers.numero, l.foyers.prenom, l.foyers.nom, l.foyers.telephone, l.foyers.nb_personnes, l.statut === 'retiree' ? 'oui' : '']),
    ])
  }

  const visibles = useMemo(() => {
    const s = recherche(q.trim())
    return (lignes ?? []).filter((l) => !s || recherche(`${l.foyers.prenom} ${l.foyers.nom} ${l.foyers.numero}`).includes(s))
  }, [lignes, q])
  const retirees = lignes?.filter((l) => l.statut === 'retiree').length ?? 0

  if (pointage) return <Pointage evenement={e} fermer={() => { setPointage(false); void charger() }} />

  return (
    <>
      <button className="ges-back" onClick={retour}>← Toutes les dates</button>
      <div className="ges-head">
        <div>
          <span className={'eyebrow' + (e.type === 'marche' ? ' green' : '')}>{e.type === 'marche' ? 'Marché solidaire' : 'Distribution'}{e.publie === false ? ' · non publiée' : ''}</span>
          <h1 className="cap">{dateLongue(e.jour)}</h1>
          <p className="esp-small">De {heure(e.heure_debut)} à {heure(e.heure_fin)}{e.lieu ? ` · ${e.lieu}` : ''}{e.note ? ` · ${e.note}` : ''}</p>
        </div>
        {role === 'admin' && (
          <div className="ges-row">
            <button className="ges-btn soft" onClick={modifier}>Modifier</button>
            <button className="ges-btn soft danger" onClick={supprimer}>Supprimer</button>
          </div>
        )}
      </div>
      {msg && <p className={msg.ok ? 'esp-ok' : 'esp-err'} role={msg.ok ? 'status' : 'alert'}>{msg.texte}</p>}

      {e.type === 'distribution' ? (
        <>
          <div className="ges-kpis">
            <div><b>{lignes?.length ?? '…'}</b><span>réservés</span></div>
            <div><b>{e.paniers_max == null ? '—' : Math.max(0, e.paniers_max - (lignes?.length ?? 0))}</b><span>restants{e.paniers_max != null ? ` sur ${e.paniers_max}` : ''}</span></div>
            <div><b>{retirees}</b><span>retirés</span></div>
          </div>
          <div className="ges-row wrap">
            <button className="esp-btn ges-scan" onClick={() => setPointage(true)}>📷 Pointer avec le QR code</button>
            <button className="ges-btn soft" onClick={() => setAjout(true)}>Ajouter un foyer</button>
            <button className="ges-btn soft" onClick={exporter} disabled={!lignes?.length}>Exporter pour Excel</button>
          </div>
          <div className="ges-filters">
            <input type="search" placeholder="Chercher un nom ou un numéro" value={q} onChange={(ev) => setQ(ev.target.value)} aria-label="Chercher une réservation" />
          </div>
          {lignes === null ? <p className="esp-wait">Chargement…</p> : visibles.length === 0 ? <p className="ges-empty">Aucune réservation{q ? ' ne correspond' : ' pour l\'instant'}.</p> : (
            <ul className="ges-pointage">
              {visibles.map((l) => (
                <li key={l.id} className={l.statut === 'retiree' ? 'fait' : ''}>
                  <label>
                    <input type="checkbox" checked={l.statut === 'retiree'} onChange={() => basculer(l)} />
                    <span><b>{l.foyers.prenom} {l.foyers.nom}</b><small>{numero(l.foyers)} · {l.foyers.nb_personnes} pers.{l.foyers.telephone ? ` · ${l.foyers.telephone}` : ''}</small></span>
                  </label>
                  <span className={'ges-tag ' + (l.statut === 'retiree' ? 'active' : 'attente')}>{l.statut === 'retiree' ? `Retiré${l.retiree_at ? ' à ' + new Date(l.retiree_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}` : 'À retirer'}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : <p className="ges-empty">Pas de réservation pour un marché : chacun vient librement.</p>}

      {ajout && <AjoutFoyer evenement={e} onClose={() => setAjout(false)} onDone={charger} />}
      {edition && edition !== 'nouveau' && <FormEvenement evenement={edition} onClose={fermerEdition} onSaved={recharger} />}
    </>
  )
}

/** Réserver pour un foyer, par exemple quelqu'un qui arrive sans avoir réservé. */
export function AjoutFoyer({ evenement, onClose, onDone, pointer = false }: { evenement: Evenement; onClose: () => void; onDone: () => Promise<void> | void; pointer?: boolean }) {
  const [foyers, setFoyers] = useState<Foyer[]>([])
  const [q, setQ] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)
  useEffect(() => {
    void supabase.from('foyers').select('*').eq('statut', 'actif').gte('adhesion_fin', aujourdhui()).order('nom').then(({ data }) => setFoyers((data ?? []) as Foyer[]))
  }, [])
  const s = recherche(q.trim())
  const visibles = foyers.filter((f) => !s || recherche(`${f.prenom} ${f.nom} ${f.numero}`).includes(s)).slice(0, 30)

  async function choisir(f: Foyer) {
    setOccupe(true); setErreur('')
    const { data, error } = await supabase.rpc('reserver_panier', { evt: evenement.id, pour_foyer: f.id })
    if (!error && pointer) await supabase.from('reservations').update({ statut: 'retiree' }).eq('id', (data as { id: string }).id)
    setOccupe(false)
    if (error) setErreur(message(error)); else { await onDone(); onClose() }
  }

  return (
    <div className="ges-overlay" onClick={onClose}>
      <aside className="ges-drawer" role="dialog" aria-modal="true" aria-label="Ajouter un foyer" onClick={(ev) => ev.stopPropagation()}>
        <button className="ges-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>Ajouter un foyer</h2>
        <p className="esp-small">Seuls les foyers dont l'adhésion est active apparaissent.</p>
        <input type="search" autoFocus placeholder="Nom ou numéro" value={q} onChange={(ev) => setQ(ev.target.value)} aria-label="Chercher un foyer" />
        {erreur && <p className="esp-err" role="alert">{erreur}</p>}
        <ul className="ges-list pick">
          {visibles.map((f) => (
            <li key={f.id}><button disabled={occupe} onClick={() => choisir(f)}><b>{f.prenom} {f.nom}</b><small>{numero(f)} · {f.nb_personnes} pers.</small></button></li>
          ))}
          {visibles.length === 0 && <li className="esp-small">Aucun foyer actif ne correspond.</li>}
        </ul>
      </aside>
    </div>
  )
}

function FormEvenement({ evenement: e, onClose, onSaved }: { evenement: Evenement | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [type, setType] = useState<Evenement['type']>(e?.type ?? 'distribution')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  async function enregistrer(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const d = new FormData(ev.currentTarget)
    const max = String(d.get('paniers_max') ?? '')
    const champs = {
      type,
      jour: String(d.get('jour')),
      heure_debut: String(d.get('heure_debut')),
      heure_fin: String(d.get('heure_fin')),
      lieu: type === 'distribution' ? String(d.get('lieu') ?? '').trim() || null : null,
      paniers_max: type === 'distribution' && max ? Number(max) : null,
      note: String(d.get('note') ?? '').trim() || null,
      publie: d.get('publie') === 'on',
    }
    if (champs.heure_fin <= champs.heure_debut) { setErreur('L\'heure de fin doit suivre l\'heure de début.'); return }
    setEnvoi(true)
    const { error } = e ? await supabase.from('evenements').update(champs).eq('id', e.id) : await supabase.from('evenements').insert(champs)
    setEnvoi(false)
    if (error) setErreur(message(error)); else { await onSaved(); onClose() }
  }
  return (
    <div className="ges-overlay" onClick={onClose}>
      <aside className="ges-drawer" role="dialog" aria-modal="true" aria-label={e ? 'Modifier la date' : 'Créer une date'} onClick={(ev) => ev.stopPropagation()}>
        <button className="ges-close" onClick={onClose} aria-label="Fermer">×</button>
        <h2>{e ? 'Modifier la date' : 'Créer une date'}</h2>
        <form className="esp-form" onSubmit={enregistrer}>
          <fieldset className="esp-field">
            <legend>Type</legend>
            <div className="esp-choices two">
              {([['distribution', 'Distribution de paniers'], ['marche', 'Marché solidaire']] as const).map(([v, l]) => (
                <label key={v} className={type === v ? 'on' : ''}><input type="radio" name="type" checked={type === v} onChange={() => setType(v)} />{l}</label>
              ))}
            </div>
          </fieldset>
          <label>Date<input name="jour" type="date" required defaultValue={e?.jour} min={e ? undefined : aujourdhui()} /></label>
          <div className="esp-two">
            <label>Début<input name="heure_debut" type="time" required defaultValue={e?.heure_debut.slice(0, 5) ?? '10:00'} /></label>
            <label>Fin<input name="heure_fin" type="time" required defaultValue={e?.heure_fin.slice(0, 5) ?? '12:00'} /></label>
          </div>
          {type === 'distribution' ? (
            <>
              <label>Lieu<input name="lieu" maxLength={200} defaultValue={e?.lieu ?? '49C rue de la Fabrique, cour des Galibots, Masny'} /></label>
              <label>Nombre de paniers (vide = sans limite)<input name="paniers_max" type="number" min={0} max={1000} defaultValue={e?.paniers_max ?? 40} inputMode="numeric" /></label>
            </>
          ) : <p className="esp-note">Le lieu du marché n'est jamais affiché sur le site.</p>}
          <label>Note pour les adhérents (facultatif)<input name="note" maxLength={200} defaultValue={e?.note ?? ''} placeholder="Ex. : pensez à votre sac" /></label>
          <label className="ges-check"><input type="checkbox" name="publie" defaultChecked={e?.publie ?? true} /> Visible par les adhérents</label>
          <button className="esp-btn" disabled={envoi}>{e ? 'Enregistrer' : 'Créer la date'}</button>
          {erreur && <p className="esp-err" role="alert">{erreur}</p>}
        </form>
      </aside>
    </div>
  )
}
