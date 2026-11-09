import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { aujourdhui, dateCourte, dateLongue, message, supabase } from '../adherent/supabase'
import { Connexion, NouveauMotDePasse, useSession } from '../adherent/Connexion'
import { plusJours } from '../gestion/outils'
import {
  COURT, TON, TYPES, enCours, euros, nbPaniers, numeroCommande,
  type Collectivite as Fiche, type Commande, type Reglages, type Suivi,
} from './commandes'
import { Frise, Historique, Retrait } from './Suivi'
import '../adherent/espace.css'
import './collectivite.css'

const TEL = '06 45 84 22 15'
type Onglet = 'commandes' | 'commander' | 'fiche'

export default function Collectivite() {
  const { session, reinitialisation, finReinitialisation } = useSession()
  useEffect(() => { document.title = 'Espace collectivités · Les Toqués du Cœur' }, [])

  let contenu: ReactNode
  if (session === undefined) contenu = <Chargement />
  else if (session && reinitialisation) contenu = <NouveauMotDePasse espace="Espace collectivités" onDone={finReinitialisation} />
  else if (session) contenu = <Connecte session={session} />
  else contenu = (
    <>
      <main className="esp-main" style={{ paddingBottom: 0 }}>
        <section className="esp-head">
          <span className="eyebrow">Mairies, CCAS, écoles, associations</span>
          <h1>Commandez des paniers pour vos habitants</h1>
          <p>Créez le compte de votre structure : une fois validé par l'association, vous demandez le nombre de paniers et la date, et vous suivez la commande jusqu'au retrait.</p>
        </section>
      </main>
      <Connexion espace="Espace collectivités" />
    </>
  )

  return (
    <div className="esp">
      <header className="esp-top">
        <a href="/" aria-label="Retour au site"><img src="/assets/logo.png" alt="Les Toqués du Cœur" /></a>
        <span>Espace collectivités</span>
      </header>
      {contenu}
    </div>
  )
}

function Chargement() {
  return <main className="esp-main"><p className="esp-wait" role="status">Chargement…</p></main>
}

function Connecte({ session }: { session: Session }) {
  const [fiche, setFiche] = useState<Fiche | null | undefined>(undefined)
  const [reglages, setReglages] = useState<Reglages | null>(null)
  const [onglet, setOnglet] = useState<Onglet>('commandes')
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const [{ data, error }, { data: r }] = await Promise.all([
      supabase.from('collectivites').select('*').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('reglages').select('prix_panier_collectivite, lieu_retrait, delai_commande_jours').maybeSingle(),
    ])
    if (error) setErreur(message(error))
    else { setFiche(data as Fiche | null); setReglages(r as Reglages | null) }
  }, [session.user.id])
  useEffect(() => { void charger() }, [charger])

  if (erreur) return <main className="esp-main"><p className="esp-err" role="alert">{erreur}</p></main>
  if (fiche === undefined) return <Chargement />
  if (fiche === null) {
    return (
      <main className="esp-main">
        <section className="esp-card">
          <span className="eyebrow">Première visite</span>
          <h1>Votre structure</h1>
          <p>Ces informations permettent à l'association de valider votre compte et de vous joindre au sujet des commandes.</p>
          <FicheForm userId={session.user.id} onSaved={charger} />
        </section>
        <button className="esp-btn soft" onClick={() => supabase.auth.signOut()}>Me déconnecter</button>
      </main>
    )
  }

  const onglets: [Onglet, string, string][] = [
    ['commandes', 'Commandes', '📦'],
    ['commander', 'Commander', '🧺'],
    ['fiche', 'Structure', '🏛️'],
  ]
  return (
    <>
      <main className="esp-main">
        {fiche.statut !== 'active' && <EtatCompte fiche={fiche} />}
        {onglet === 'commandes' && <Commandes fiche={fiche} commander={() => setOnglet('commander')} />}
        {onglet === 'commander' && <Commander fiche={fiche} reglages={reglages} fait={() => setOnglet('commandes')} />}
        {onglet === 'fiche' && (
          <>
            <section className="esp-card">
              <span className="eyebrow">{TYPES[fiche.type]}</span>
              <h1>{fiche.nom}</h1>
              <p className="esp-small">Compte : {session.user.email}</p>
              <FicheForm userId={session.user.id} fiche={fiche} onSaved={charger} />
            </section>
            <button className="esp-btn soft" onClick={() => supabase.auth.signOut()}>Me déconnecter</button>
          </>
        )}
        <p className="esp-small esp-center">Une question sur une commande ? Appelez-nous au <a href="tel:+33645842215">{TEL}</a>.</p>
      </main>
      <nav className="esp-tabs col-tabs" aria-label="Espace collectivités">
        {onglets.map(([id, label, icone]) => (
          <button key={id} aria-current={onglet === id ? 'page' : undefined} onClick={() => { setOnglet(id); window.scrollTo(0, 0) }}>
            <span aria-hidden="true">{icone}</span>{label}
          </button>
        ))}
      </nav>
    </>
  )
}

function EtatCompte({ fiche }: { fiche: Fiche }) {
  return fiche.statut === 'en_attente' ? (
    <section className="esp-card esp-annonce">
      <span className="esp-status wait">Compte en cours de validation</span>
      <p>L'association vérifie les informations de <b>{fiche.nom}</b>. Vous pourrez commander dès que le compte sera validé ; en général sous quelques jours.</p>
    </section>
  ) : (
    <section className="esp-card esp-annonce">
      <span className="esp-status off">Compte suspendu</span>
      <p>Les commandes sont suspendues pour ce compte. Contactez l'association au <a href="tel:+33645842215">{TEL}</a>.</p>
    </section>
  )
}

function FicheForm({ userId, fiche, onSaved }: { userId: string; fiche?: Fiche; onSaved: () => Promise<void> }) {
  const [envoi, setEnvoi] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const champ = (k: string) => String(d.get(k) ?? '').trim() || null
    const siret = champ('siret')?.replace(/\s/g, '') || null
    if (siret && !/^\d{14}$/.test(siret)) { setMsg({ ok: false, texte: 'Le SIRET compte 14 chiffres.' }); return }
    const valeurs = {
      nom: champ('nom'), type: String(d.get('type')), contact: champ('contact'), telephone: champ('telephone'),
      adresse: champ('adresse'), ville: champ('ville'), siret,
    }
    setEnvoi(true); setMsg(null)
    const { error } = fiche
      ? await supabase.from('collectivites').update(valeurs).eq('id', fiche.id)
      : await supabase.from('collectivites').insert({ ...valeurs, user_id: userId })
    setEnvoi(false)
    if (error) setMsg({ ok: false, texte: message(error) })
    else { setMsg({ ok: true, texte: fiche ? 'Informations enregistrées.' : 'Merci ! Votre demande de compte est envoyée.' }); await onSaved() }
  }

  return (
    <form className="esp-form" onSubmit={enregistrer}>
      <label>Nom de la structure<input name="nom" required minLength={2} maxLength={120} defaultValue={fiche?.nom} placeholder="Mairie de …" /></label>
      <label>Type
        <select name="type" defaultValue={fiche?.type ?? 'mairie'}>
          {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label>Personne à contacter<input name="contact" required minLength={2} maxLength={120} defaultValue={fiche?.contact} autoComplete="name" /></label>
      <label>Téléphone<input name="telephone" type="tel" maxLength={30} defaultValue={fiche?.telephone ?? ''} autoComplete="tel" inputMode="tel" /></label>
      <label>Adresse<input name="adresse" maxLength={200} defaultValue={fiche?.adresse ?? ''} autoComplete="street-address" /></label>
      <label>Ville<input name="ville" maxLength={80} defaultValue={fiche?.ville ?? ''} autoComplete="address-level2" /></label>
      <label>SIRET <span className="esp-small">(facultatif)</span><input name="siret" maxLength={17} defaultValue={fiche?.siret ?? ''} inputMode="numeric" /></label>
      <button className="esp-btn" disabled={envoi}>{envoi ? 'Un instant…' : fiche ? 'Enregistrer' : 'Demander l\'ouverture du compte'}</button>
      {msg && <p className={msg.ok ? 'esp-ok' : 'esp-err'} role={msg.ok ? 'status' : 'alert'}>{msg.texte}</p>}
    </form>
  )
}

function Commandes({ fiche, commander }: { fiche: Fiche; commander: () => void }) {
  const [commandes, setCommandes] = useState<Commande[] | null>(null)
  const [suivi, setSuivi] = useState<Suivi[]>([])
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('commandes').select('*').eq('collectivite_id', fiche.id).order('created_at', { ascending: false })
    if (error) { setErreur(message(error)); return }
    const list = (data ?? []) as Commande[]
    setCommandes(list)
    if (list.length) {
      const { data: s } = await supabase.from('commandes_suivi').select('*').in('commande_id', list.map((c) => c.id)).order('created_at')
      setSuivi((s ?? []) as Suivi[])
    }
  }, [fiche.id])
  useEffect(() => { void charger() }, [charger])
  // Les statuts changent côté association : on recharge quand la page redevient visible.
  useEffect(() => {
    const ecoute = () => { if (document.visibilityState === 'visible') void charger() }
    document.addEventListener('visibilitychange', ecoute)
    return () => document.removeEventListener('visibilitychange', ecoute)
  }, [charger])

  async function annuler(c: Commande) {
    if (!window.confirm(`Annuler la ${numeroCommande(c).toLowerCase()} ?`)) return
    const { error } = await supabase.rpc('annuler_commande', { cmd: c.id })
    if (error) setErreur(message(error)); else await charger()
  }

  const courantes = commandes?.filter(enCours) ?? []
  const passees = commandes?.filter((c) => !enCours(c)) ?? []

  return (
    <>
      <section className="esp-head">
        <span className="eyebrow">{fiche.nom}</span>
        <h1>Vos commandes</h1>
      </section>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      {commandes === null ? <Chargement /> : commandes.length === 0 ? (
        <section className="esp-card">
          <p>Aucune commande pour l'instant.</p>
          {fiche.statut === 'active' && <button className="esp-btn" onClick={commander}>Commander des paniers</button>}
        </section>
      ) : (
        <>
          {courantes.length === 0 && <p className="esp-small">Aucune commande en cours.</p>}
          <ul className="esp-list">
            {courantes.map((c) => <li key={c.id}><CarteCommande commande={c} suivi={suivi.filter((s) => s.commande_id === c.id)} annuler={annuler} /></li>)}
          </ul>
          {passees.length > 0 && (
            <>
              <h2>Historique</h2>
              <ul className="esp-list">
                {passees.map((c) => <li key={c.id}><CarteCommande commande={c} suivi={suivi.filter((s) => s.commande_id === c.id)} annuler={annuler} /></li>)}
              </ul>
            </>
          )}
        </>
      )}
    </>
  )
}

export function CarteCommande({ commande: c, suivi, annuler }: { commande: Commande; suivi: Suivi[]; annuler: (c: Commande) => void }) {
  const ajustee = c.paniers != null && c.paniers !== c.paniers_demandes
  const dateDiff = c.date_retrait && c.date_retrait !== c.date_souhaitee
  return (
    <article className={'esp-evt col-cmd ' + c.statut}>
      <div className="col-cmd-head">
        <span className="esp-small">{numeroCommande(c)}</span>
        <span className={'esp-status ' + TON[c.statut]}>{COURT[c.statut]}</span>
      </div>
      <h2>{nbPaniers(c)} paniers</h2>
      <p className="cap">Pour le {dateLongue(c.date_retrait ?? c.date_souhaitee)}</p>
      {(ajustee || dateDiff) && (
        <p className="esp-note">
          Vous aviez demandé {c.paniers_demandes} paniers pour le {dateCourte(c.date_souhaitee)}.
          {ajustee ? ` L'association peut en préparer ${c.paniers}.` : ''}{dateDiff ? ` Retrait le ${dateCourte(c.date_retrait!)}.` : ''}
        </p>
      )}
      <Frise commande={c} />
      <Retrait commande={c} />
      {c.note_bureau && <p className="col-mot"><b>Message de l'association</b>{c.note_bureau}</p>}
      <dl className="col-dl">
        <dt>Prix</dt><dd>{euros(c.prix_unitaire)} × {nbPaniers(c)} = <b>{euros(c.montant)}</b></dd>
        {c.message && <><dt>Votre message</dt><dd>{c.message}</dd></>}
      </dl>
      <details className="col-details">
        <summary>Suivi détaillé</summary>
        <Historique lignes={suivi} />
      </details>
      {(c.statut === 'demandee' || c.statut === 'validee') && (
        <button className="esp-link" style={{ justifySelf: 'start' }} onClick={() => annuler(c)}>Annuler la commande</button>
      )}
    </article>
  )
}

function Commander({ fiche, reglages, fait }: { fiche: Fiche; reglages: Reglages | null; fait: () => void }) {
  const [nb, setNb] = useState(10)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const delai = reglages?.delai_commande_jours ?? 3
  const prix = reglages?.prix_panier_collectivite ?? 0
  const min = plusJours(aujourdhui(), delai)

  if (fiche.statut !== 'active') {
    return (
      <section className="esp-card">
        <h1>Commander</h1>
        <p>Vous pourrez commander dès que votre compte sera validé par l'association.</p>
      </section>
    )
  }

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setEnvoi(true); setErreur('')
    const { error } = await supabase.rpc('commander_paniers', { nb, jour: String(d.get('jour')), message: String(d.get('message') ?? '') })
    setEnvoi(false)
    if (error) setErreur(message(error)); else fait()
  }

  const borne = (n: number) => Math.max(1, Math.min(500, Math.round(n) || 1))

  return (
    <section className="esp-card">
      <span className="eyebrow">Nouvelle commande</span>
      <h1>Commander des paniers</h1>
      <p>L'association étudie votre demande et vous confirme la quantité, la date et le lieu de retrait.</p>
      <form className="esp-form" onSubmit={envoyer}>
        <fieldset className="esp-field">
          <legend>Nombre de paniers</legend>
          <div className="esp-stepper">
            <button type="button" onClick={() => setNb((n) => borne(n - 1))} aria-label="Un panier de moins">−</button>
            <input className="col-nb" type="number" min={1} max={500} value={nb} onChange={(e) => setNb(borne(Number(e.target.value)))} aria-label="Nombre de paniers" />
            <button type="button" onClick={() => setNb((n) => borne(n + 1))} aria-label="Un panier de plus">+</button>
          </div>
        </fieldset>
        <label>Date souhaitée
          <input name="jour" type="date" required min={min} defaultValue={min} />
          <span className="esp-small">Au moins {delai} jour{delai > 1 ? 's' : ''} à l'avance.</span>
        </label>
        <label>Message <span className="esp-small">(facultatif)</span>
          <textarea name="message" rows={3} maxLength={1000} placeholder="Précisions : public concerné, contraintes horaires, personne qui viendra chercher les paniers…" />
        </label>
        <p className="esp-note">Montant estimé : <b>{euros(nb * prix)}</b> ({euros(prix)} par panier). Le montant définitif est confirmé à la validation.</p>
        <button className="esp-btn" disabled={envoi}>{envoi ? 'Envoi…' : `Envoyer la demande de ${nb} paniers`}</button>
        {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      </form>
    </section>
  )
}
