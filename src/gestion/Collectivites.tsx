import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { dateCourte, dateLongue, message, supabase } from '../adherent/supabase'
import {
  COURT, LIBELLE, TYPES, euros, nbPaniers, numeroCommande,
  type Collectivite, type Commande, type Reglages, type StatutCommande, type Suivi,
} from '../collectivite/commandes'
import { Frise, Historique, Retrait } from '../collectivite/Suivi'
import { recherche, telechargerCsv, type Role } from './outils'
import '../collectivite/collectivite.css'

type Ligne = Commande & { collectivites: Collectivite }
type Vue = 'traiter' | 'cours' | 'terminees' | 'structures'

const VUES: Record<Exclude<Vue, 'structures'>, StatutCommande[]> = {
  traiter: ['demandee'],
  cours: ['validee', 'en_preparation', 'prete'],
  terminees: ['retiree', 'refusee', 'annulee'],
}
const TAG: Record<StatutCommande, string> = {
  demandee: 'attente', validee: 'active', en_preparation: 'sun', prete: 'active', retiree: '', refusee: 'terminee', annulee: 'terminee',
}
const SUIVANT: Partial<Record<StatutCommande, [StatutCommande, string]>> = {
  validee: ['en_preparation', 'Passer en préparation'],
  en_preparation: ['prete', 'Marquer prête à retirer'],
  prete: ['retiree', 'Marquer comme retirée'],
}

export default function Collectivites({ role }: { role: Role }) {
  const [vue, setVue] = useState<Vue>('traiter')
  const [commandes, setCommandes] = useState<Ligne[] | null>(null)
  const [structures, setStructures] = useState<Collectivite[]>([])
  const [reglages, setReglages] = useState<Reglages | null>(null)
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const [c, s, r] = await Promise.all([
      supabase.from('commandes').select('*, collectivites(*)').order('created_at', { ascending: false }).limit(500),
      supabase.from('collectivites').select('*').order('created_at', { ascending: false }),
      supabase.from('reglages').select('prix_panier_collectivite, lieu_retrait, delai_commande_jours').maybeSingle(),
    ])
    const e = c.error ?? s.error
    if (e) setErreur(message(e))
    setCommandes((c.data ?? []) as unknown as Ligne[])
    setStructures((s.data ?? []) as Collectivite[])
    setReglages(r.data as Reglages | null)
  }, [])
  useEffect(() => { void charger() }, [charger])

  const compte = (v: Exclude<Vue, 'structures'>) => commandes?.filter((c) => VUES[v].includes(c.statut)).length ?? 0
  const aPreparer = commandes?.filter((c) => ['validee', 'en_preparation'].includes(c.statut)).reduce((n, c) => n + nbPaniers(c), 0) ?? 0
  const comptesAttente = structures.filter((s) => s.statut === 'en_attente').length

  const visibles = useMemo(() => {
    if (vue === 'structures' || !commandes) return []
    const s = recherche(q.trim())
    const list = commandes.filter((c) => VUES[vue].includes(c.statut))
      .filter((c) => !s || recherche(`${c.collectivites.nom} ${c.collectivites.ville ?? ''} ${c.numero}`).includes(s))
    // À traiter et en cours : la date la plus proche d'abord.
    if (vue !== 'terminees') list.sort((a, b) => (a.date_retrait ?? a.date_souhaitee).localeCompare(b.date_retrait ?? b.date_souhaitee))
    return list
  }, [commandes, vue, q])

  function exporter() {
    telechargerCsv('commandes-collectivites.csv', [
      ['Numéro', 'Structure', 'Ville', 'Contact', 'Téléphone', 'Paniers demandés', 'Paniers validés', 'Date souhaitée', 'Date de retrait', 'Lieu', 'Prix unitaire', 'Montant', 'Statut'],
      ...(commandes ?? []).map((c) => [
        c.numero, c.collectivites.nom, c.collectivites.ville, c.collectivites.contact, c.collectivites.telephone,
        c.paniers_demandes, c.paniers, c.date_souhaitee, c.date_retrait, c.lieu_retrait,
        String(c.prix_unitaire).replace('.', ','), String(c.montant).replace('.', ','), COURT[c.statut],
      ]),
    ])
  }

  const detail = commandes?.find((c) => c.id === ouverte) ?? null

  return (
    <>
      <div className="ges-head">
        <h1>Collectivités</h1>
        <button className="ges-btn soft" onClick={exporter} disabled={!commandes?.length}>Exporter pour Excel</button>
      </div>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      <div className="ges-kpis">
        <div><b>{compte('traiter')}</b><span>demandes à traiter</span></div>
        <div><b>{compte('cours')}</b><span>commandes en cours</span></div>
        <div><b>{aPreparer}</b><span>paniers à préparer</span></div>
        <div><b>{comptesAttente}</b><span>comptes à valider</span></div>
      </div>
      <div className="ges-chips" role="group" aria-label="Affichage">
        <button aria-pressed={vue === 'traiter'} onClick={() => setVue('traiter')}>À traiter ({compte('traiter')})</button>
        <button aria-pressed={vue === 'cours'} onClick={() => setVue('cours')}>En cours ({compte('cours')})</button>
        <button aria-pressed={vue === 'terminees'} onClick={() => setVue('terminees')}>Terminées</button>
        <button aria-pressed={vue === 'structures'} onClick={() => setVue('structures')}>Structures ({structures.length})</button>
      </div>

      {vue === 'structures' ? (
        <Structures role={role} structures={structures} commandes={commandes ?? []} reglages={reglages} recharger={charger} />
      ) : commandes === null ? <p className="esp-wait">Chargement…</p> : (
        <>
          <div className="ges-filters">
            <input type="search" placeholder="Chercher une structure, une ville ou un numéro" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher une commande" />
          </div>
          {visibles.length === 0 ? <p className="ges-empty">Aucune commande {vue === 'traiter' ? 'à traiter' : vue === 'cours' ? 'en cours' : 'terminée'}{q ? ' ne correspond' : ''}.</p> : (
            <div className="ges-table-wrap">
              <table className="ges-table">
                <thead><tr><th>N°</th><th>Structure</th><th className="r">Paniers</th><th>Date</th><th className="hide-s r">Montant</th><th>État</th></tr></thead>
                <tbody>
                  {visibles.map((c) => (
                    <tr key={c.id} tabIndex={0} onClick={() => setOuverte(c.id)} onKeyDown={(e) => { if (e.key === 'Enter') setOuverte(c.id) }}>
                      <td className="num">{String(c.numero).padStart(4, '0')}</td>
                      <td><b>{c.collectivites.nom}</b>{c.collectivites.ville ? <><br /><small className="ges-muted">{c.collectivites.ville}</small></> : null}</td>
                      <td className="r">{nbPaniers(c)}{c.paniers != null && c.paniers !== c.paniers_demandes ? <small className="ges-muted"> / {c.paniers_demandes}</small> : null}</td>
                      <td className="cap">{dateLongue(c.date_retrait ?? c.date_souhaitee)}</td>
                      <td className="hide-s r">{euros(c.montant)}</td>
                      <td><span className={'ges-tag ' + TAG[c.statut]}>{COURT[c.statut]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {detail && <Detail role={role} commande={detail} reglages={reglages} fermer={() => setOuverte(null)} recharger={charger} />}
    </>
  )
}

function Detail({ role, commande: c, reglages, fermer, recharger }: {
  role: Role; commande: Ligne; reglages: Reglages | null; fermer: () => void; recharger: () => Promise<void>
}) {
  const [suivi, setSuivi] = useState<Suivi[]>([])
  const [envoi, setEnvoi] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)
  const [note, setNote] = useState('')
  const s = c.collectivites

  const chargerSuivi = useCallback(async () => {
    const { data } = await supabase.from('commandes_suivi').select('*').eq('commande_id', c.id).order('created_at')
    setSuivi((data ?? []) as Suivi[])
  }, [c.id])
  useEffect(() => { void chargerSuivi() }, [chargerSuivi, c.statut, c.updated_at])
  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') fermer() }
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [fermer])

  async function appel(fn: string, args: Record<string, unknown>, ok: string) {
    setEnvoi(true); setMsg(null)
    const { error } = await supabase.rpc(fn, args)
    setEnvoi(false)
    if (error) { setMsg({ ok: false, texte: message(error) }); return false }
    setMsg({ ok: true, texte: ok }); setNote('')
    await recharger()
    return true
  }

  async function traiter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const decision = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') ?? 'valider'
    const texte = String(d.get('note') ?? '')
    if (decision === 'refuser') {
      if (!texte.trim()) { setMsg({ ok: false, texte: 'Écrivez le motif du refus dans le message : la collectivité le verra.' }); return }
      if (!window.confirm('Refuser cette commande ?')) return
    }
    await appel('traiter_commande', {
      cmd: c.id, decision,
      nb: Number(d.get('nb')), jour: String(d.get('jour')), heure: String(d.get('heure') || '') || null,
      lieu: String(d.get('lieu') ?? ''), prix: Number(String(d.get('prix')).replace(',', '.')), note: texte,
    }, decision === 'refuser' ? 'Commande refusée.' : c.statut === 'demandee' ? 'Commande validée.' : 'Changements enregistrés.')
  }

  const suivant = SUIVANT[c.statut]
  const modifiable = role === 'admin' && ['demandee', 'validee', 'en_preparation'].includes(c.statut)

  return (
    <div className="ges-overlay" onClick={fermer}>
      <aside className="ges-drawer" onClick={(e) => e.stopPropagation()} aria-label={numeroCommande(c)}>
        <button className="ges-close" onClick={fermer} aria-label="Fermer">×</button>
        <span className="eyebrow">{numeroCommande(c)} · {LIBELLE[c.statut]}</span>
        <h2>{s.nom}</h2>
        <p className="esp-small">
          {nbPaniers(c)} paniers · <span className="cap">{dateLongue(c.date_retrait ?? c.date_souhaitee)}</span> · {euros(c.montant)}
        </p>
        <Frise commande={c} />
        <Retrait commande={c} />
        {msg && <p className={msg.ok ? 'esp-ok' : 'esp-err'} role={msg.ok ? 'status' : 'alert'}>{msg.texte}</p>}

        {suivant && (
          <section className="ges-card">
            <h3>Étape suivante</h3>
            {suivant[0] === 'prete' && (!c.date_retrait || !c.lieu_retrait) && <p className="esp-small">Renseignez d'abord la date et le lieu de retrait ci-dessous.</p>}
            <label style={{ width: '100%' }}>Message pour la collectivité <span className="esp-small">(facultatif)</span>
              <textarea rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button className="ges-btn" disabled={envoi} onClick={() => appel('avancer_commande', { cmd: c.id, statut: suivant[0], note }, LIBELLE[suivant[0]] + '.')}>
              {suivant[1]}
            </button>
          </section>
        )}

        {modifiable && (
          <form className="ges-card esp-form" onSubmit={traiter} key={c.updated_at}>
            <h3>{c.statut === 'demandee' ? 'Valider la demande' : 'Ajuster la commande'}</h3>
            <p className="esp-small">Demande : {c.paniers_demandes} paniers pour le {dateCourte(c.date_souhaitee)}.</p>
            <div className="esp-two">
              <label>Paniers<input name="nb" type="number" min={1} max={500} required defaultValue={c.paniers ?? c.paniers_demandes} /></label>
              <label>Prix / panier (€)<input name="prix" type="number" min={0} step="0.01" required defaultValue={c.prix_unitaire} /></label>
            </div>
            <div className="esp-two">
              <label>Date de retrait<input name="jour" type="date" required defaultValue={c.date_retrait ?? c.date_souhaitee} /></label>
              <label>Heure<input name="heure" type="time" defaultValue={c.heure_retrait?.slice(0, 5) ?? ''} /></label>
            </div>
            <label>Lieu de retrait (ville, adresse)<input name="lieu" maxLength={200} defaultValue={c.lieu_retrait ?? reglages?.lieu_retrait ?? ''} placeholder="64 rue Charles Debarge, 62440 Harnes" /></label>
            <label>Message pour la collectivité<textarea name="note" rows={3} maxLength={1000} defaultValue={c.note_bureau ?? ''} placeholder="Ex. : nous pouvons préparer 15 paniers ; le motif en cas de refus" /></label>
            <div className="ges-row wrap">
              <button className="ges-btn" name="decision" value="valider" disabled={envoi}>{c.statut === 'demandee' ? 'Valider' : 'Enregistrer'}</button>
              <button className="ges-btn soft danger" name="decision" value="refuser" disabled={envoi}>Refuser</button>
            </div>
          </form>
        )}

        <section className="ges-card">
          <h3>Structure</h3>
          <dl className="ges-dl">
            <dt>Type</dt><dd>{TYPES[s.type]}</dd>
            <dt>Contact</dt><dd>{s.contact}</dd>
            {s.telephone && <><dt>Téléphone</dt><dd><a href={'tel:' + s.telephone.replace(/\s/g, '')}>{s.telephone}</a></dd></>}
            {s.email && <><dt>E-mail</dt><dd><a href={'mailto:' + s.email}>{s.email}</a></dd></>}
            {(s.adresse || s.ville) && <><dt>Adresse</dt><dd>{[s.adresse, s.ville].filter(Boolean).join(', ')}</dd></>}
            {c.message && <><dt>Message</dt><dd style={{ whiteSpace: 'pre-line' }}>{c.message}</dd></>}
          </dl>
        </section>

        <section className="ges-card">
          <h3>Suivi</h3>
          <Historique lignes={suivi} />
        </section>
      </aside>
    </div>
  )
}

function Structures({ role, structures, commandes, reglages, recharger }: {
  role: Role; structures: Collectivite[]; commandes: Ligne[]; reglages: Reglages | null; recharger: () => Promise<void>
}) {
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)

  async function statut(s: Collectivite, nouveau: Collectivite['statut']) {
    const { error } = await supabase.rpc('statut_collectivite', { coll: s.id, statut: nouveau })
    if (error) setMsg({ ok: false, texte: message(error) })
    else { setMsg({ ok: true, texte: `${s.nom} : ${nouveau === 'active' ? 'compte validé' : nouveau === 'suspendue' ? 'compte suspendu' : 'en attente'}.` }); await recharger() }
  }

  async function enregistrerReglages(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const { error } = await supabase.from('reglages').update({
      prix_panier_collectivite: Number(String(d.get('prix')).replace(',', '.')),
      lieu_retrait: String(d.get('lieu') ?? '').trim() || null,
      delai_commande_jours: Number(d.get('delai')),
    }).eq('id', true)
    if (error) setMsg({ ok: false, texte: message(error) }); else { setMsg({ ok: true, texte: 'Réglages enregistrés.' }); await recharger() }
  }

  const ordre = { en_attente: 0, active: 1, suspendue: 2 }
  const triees = [...structures].sort((a, b) => ordre[a.statut] - ordre[b.statut] || a.nom.localeCompare(b.nom, 'fr'))

  return (
    <>
      {msg && <p className={msg.ok ? 'esp-ok' : 'esp-err'} role={msg.ok ? 'status' : 'alert'}>{msg.texte}</p>}
      {triees.length === 0 ? <p className="ges-empty">Aucune structure inscrite. Partagez le lien {window.location.origin}/collectivite.</p> : (
        <div className="ges-table-wrap">
          <table className="ges-table">
            <thead><tr><th>Structure</th><th className="hide-s">Contact</th><th className="r">Commandes</th><th>Compte</th>{role === 'admin' && <th />}</tr></thead>
            <tbody>
              {triees.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.nom}</b><br /><small className="ges-muted">{TYPES[s.type]}{s.ville ? ' · ' + s.ville : ''}{s.siret ? ' · SIRET ' + s.siret : ''}</small></td>
                  <td className="hide-s">{s.contact}<br /><small className="ges-muted">{[s.telephone, s.email].filter(Boolean).join(' · ')}</small></td>
                  <td className="r">{commandes.filter((c) => c.collectivite_id === s.id).length}</td>
                  <td><span className={'ges-tag ' + (s.statut === 'active' ? 'active' : s.statut === 'en_attente' ? 'attente' : 'suspendue')}>{s.statut === 'active' ? 'Validé' : s.statut === 'en_attente' ? 'À valider' : 'Suspendu'}</span></td>
                  {role === 'admin' && (
                    <td className="r">
                      {s.statut === 'active'
                        ? <button className="ges-mini" onClick={() => statut(s, 'suspendue')}>Suspendre</button>
                        : <button className="ges-mini ok" onClick={() => statut(s, 'active')}>{s.statut === 'en_attente' ? 'Valider' : 'Réactiver'}</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {role === 'admin' && reglages && (
        <form className="ges-card esp-form" onSubmit={enregistrerReglages} style={{ maxWidth: 560 }}>
          <h2>Réglages des commandes</h2>
          <div className="esp-two">
            <label>Prix par panier (€)<input name="prix" type="number" min={0} step="0.01" required defaultValue={reglages.prix_panier_collectivite} /></label>
            <label>Délai minimum (jours)<input name="delai" type="number" min={0} max={60} required defaultValue={reglages.delai_commande_jours} /></label>
          </div>
          <label>Lieu de retrait par défaut<input name="lieu" maxLength={200} defaultValue={reglages.lieu_retrait ?? ''} placeholder="64 rue Charles Debarge, 62440 Harnes" /></label>
          <p className="esp-small">Le prix s'applique aux nouvelles demandes ; vous pouvez l'ajuster sur chaque commande.</p>
          <button className="ges-btn">Enregistrer</button>
        </form>
      )}
    </>
  )
}
