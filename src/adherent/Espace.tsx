import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import {
  aujourdhui, dateCourte, dateLongue, heure, message, supabase,
  type Candidature, type Evenement, type Foyer, type Location, type Message, type Reservation,
} from './supabase'
import { Connexion, NouveauMotDePasse, useSession } from './Connexion'
import './espace.css'

const TEL = '06 45 84 22 15'
const FICHE = 'https://drive.google.com/file/d/1PcrtDJr3N4-zxwTk8ZckMq1g6i3U-E1y/view'

type Onglet = 'carte' | 'paniers' | 'aider' | 'profil'

export default function Espace() {
  const { session, reinitialisation, finReinitialisation } = useSession()
  useEffect(() => { document.title = 'Mon espace · Les Toqués du Cœur' }, [])

  let contenu: ReactNode
  if (session === undefined) contenu = <Chargement />
  else if (session && reinitialisation) contenu = <NouveauMotDePasse onDone={finReinitialisation} />
  else if (session) contenu = <Connecte session={session} />
  else contenu = <Connexion />

  return (
    <div className="esp">
      <header className="esp-top">
        <a href="/" aria-label="Retour au site"><img src="/assets/logo.png" alt="Les Toqués du Cœur" /></a>
        <span>Mon espace</span>
      </header>
      {contenu}
    </div>
  )
}

function Chargement() {
  return <main className="esp-main"><p className="esp-wait" role="status">Chargement…</p></main>
}

function Connecte({ session }: { session: Session }) {
  const [foyer, setFoyer] = useState<Foyer | null | undefined>(undefined)
  const [onglet, setOnglet] = useState<Onglet>('carte')
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    const { data, error } = await supabase.from('foyers').select('*').eq('user_id', session.user.id).maybeSingle()
    if (error) setErreur(message(error))
    else setFoyer(data as Foyer | null)
  }, [session.user.id])
  useEffect(() => { void charger() }, [charger])

  if (erreur) return <main className="esp-main"><p className="esp-err" role="alert">{erreur}</p></main>
  if (foyer === undefined) return <Chargement />
  if (foyer === null) {
    return (
      <main className="esp-main">
        <section className="esp-card">
          <span className="eyebrow">Première visite</span>
          <h1>Votre foyer</h1>
          <p>Quelques informations suffisent. Elles servent seulement à préparer les paniers.</p>
          <ProfilForm userId={session.user.id} onSaved={charger} />
        </section>
      </main>
    )
  }

  const onglets: [Onglet, string, string][] = [
    ['carte', 'Ma carte', '🪪'],
    ['paniers', 'Paniers', '🧺'],
    ['aider', 'Aider', '🤝'],
    ['profil', 'Profil', '👤'],
  ]
  return (
    <>
      <main className="esp-main">
        {onglet === 'carte' && <Carte foyer={foyer} allerPaniers={() => setOnglet('paniers')} />}
        {onglet === 'paniers' && <Paniers foyer={foyer} />}
        {onglet === 'aider' && <Aider foyer={foyer} />}
        {onglet === 'profil' && <Profil foyer={foyer} onSaved={charger} />}
      </main>
      <nav className="esp-tabs" aria-label="Mon espace">
        {onglets.map(([id, label, icone]) => (
          <button key={id} aria-current={onglet === id ? 'page' : undefined} onClick={() => { setOnglet(id); window.scrollTo(0, 0) }}>
            <span aria-hidden="true">{icone}</span>{label}
          </button>
        ))}
      </nav>
    </>
  )
}

function adhesionActive(f: Foyer) {
  return f.statut === 'actif' && !!f.adhesion_fin && f.adhesion_fin >= aujourdhui()
}

/* ---------- Ma carte ---------- */

function Carte({ foyer, allerPaniers }: { foyer: Foyer; allerPaniers: () => void }) {
  const [qr, setQr] = useState('')
  const [prochain, setProchain] = useState<{ r: Reservation; e: Evenement } | null>(null)
  useEffect(() => {
    QRCode.toString(`TDC:${foyer.carte}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#2b2320', light: '#ffffff' } }).then(setQr)
  }, [foyer.carte])
  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('reservations')
        .select('id, evenement_id, semaine, statut, evenements!inner(*)')
        .eq('foyer_id', foyer.id).eq('statut', 'reservee').gte('evenements.jour', aujourdhui())
      const list = (data ?? []) as unknown as (Reservation & { evenements: Evenement })[]
      list.sort((a, b) => a.evenements.jour.localeCompare(b.evenements.jour))
      setProchain(list[0] ? { r: list[0], e: list[0].evenements } : null)
    })()
  }, [foyer.id])
  const [annonces, setAnnonces] = useState<Message[]>([])
  useEffect(() => {
    // Les règles d'accès ne renvoient que les messages publiés qui concernent ce foyer.
    void supabase.from('messages').select('*').eq('publie', true).order('created_at', { ascending: false }).limit(5)
      .then(({ data }) => setAnnonces((data ?? []) as Message[]))
  }, [])

  const actif = adhesionActive(foyer)
  let statut: ReactNode
  if (foyer.statut === 'en_attente') statut = <p className="esp-status wait">Demande en cours d'examen</p>
  else if (foyer.statut === 'suspendu') statut = <p className="esp-status off">Adhésion suspendue</p>
  else if (actif) statut = <p className="esp-status on">Adhésion valable jusqu'au {dateCourte(foyer.adhesion_fin!)}</p>
  else statut = <p className="esp-status off">Adhésion terminée{foyer.adhesion_fin ? ` le ${dateCourte(foyer.adhesion_fin)}` : ''}</p>

  return (
    <>
      <section className={'esp-member' + (actif ? '' : ' muted')} aria-label="Carte d'adhérent">
        <div className="esp-member-head">
          <img src="/assets/logo.png" alt="" />
          <span>Carte d'adhérent<b>N° {String(foyer.numero).padStart(4, '0')}</b></span>
        </div>
        <p className="esp-member-name">{foyer.prenom} {foyer.nom}</p>
        <p className="esp-member-sub">Foyer de {foyer.nb_personnes} personne{foyer.nb_personnes > 1 ? 's' : ''}</p>
        {actif && qr && <div className="esp-qr" role="img" aria-label="QR code de la carte" dangerouslySetInnerHTML={{ __html: qr }} />}
        {statut}
      </section>

      {annonces.map((m) => (
        <section key={m.id} className="esp-card esp-annonce">
          <span className="eyebrow sun">Message de l'association</span>
          <h2>{m.titre}</h2>
          <p>{m.texte}</p>
          <p className="esp-small">Le {dateCourte(m.created_at.slice(0, 10))}</p>
        </section>
      ))}

      {foyer.statut === 'en_attente' && (
        <section className="esp-card">
          <h2>Et maintenant ?</h2>
          <p>Si ce n'est pas déjà fait, remplissez la <a href={FICHE} target="_blank" rel="noopener">fiche de renseignements</a> et donnez-la-nous à une distribution. Dès que votre adhésion de 15 € est réglée, votre carte s'active ici.</p>
        </section>
      )}
      {foyer.statut === 'actif' && !actif && (
        <section className="esp-card">
          <h2>Renouveler</h2>
          <p>L'adhésion coûte 15 € par an et par foyer. Réglez-la auprès d'un bénévole à la prochaine distribution, et votre carte se réactive.</p>
        </section>
      )}

      {actif && (
        <section className="esp-card">
          <h2>Mon prochain panier</h2>
          {prochain ? (
            <p className="esp-next"><b>{dateLongue(prochain.e.jour)}</b>de {heure(prochain.e.heure_debut)} à {heure(prochain.e.heure_fin)}{prochain.e.lieu ? <>, {prochain.e.lieu}</> : null}. Pensez à votre sac et à 5 €.</p>
          ) : (
            <>
              <p>Aucun panier réservé pour l'instant.</p>
              <button className="esp-btn" onClick={allerPaniers}>Réserver un panier</button>
            </>
          )}
        </section>
      )}
    </>
  )
}

/* ---------- Paniers et dates ---------- */

function Paniers({ foyer }: { foyer: Foyer }) {
  const [evenements, setEvenements] = useState<Evenement[] | null>(null)
  const [places, setPlaces] = useState<Record<string, number | null>>({})
  const [resas, setResas] = useState<Reservation[]>([])
  const [occupe, setOccupe] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; texte: string } | null>(null)
  const actif = adhesionActive(foyer)

  const charger = useCallback(async () => {
    const [{ data: evts, error }, { data: rs }] = await Promise.all([
      supabase.from('evenements').select('*').eq('publie', true).gte('jour', aujourdhui()).order('jour').order('heure_debut').limit(30),
      supabase.from('reservations').select('id, evenement_id, semaine, statut').eq('foyer_id', foyer.id).neq('statut', 'annulee'),
    ])
    if (error) { setMsg({ ok: false, texte: message(error) }); setEvenements([]); return }
    const list = (evts ?? []) as Evenement[]
    setEvenements(list)
    setResas((rs ?? []) as Reservation[])
    const distribs = list.filter((e) => e.type === 'distribution' && e.paniers_max !== null)
    const res = await Promise.all(distribs.map((e) => supabase.rpc('places_restantes', { evt: e.id })))
    setPlaces(Object.fromEntries(distribs.map((e, i) => [e.id, (res[i].data as number | null) ?? null])))
  }, [foyer.id])
  useEffect(() => { void charger() }, [charger])

  async function reserver(e: Evenement) {
    setOccupe(e.id); setMsg(null)
    const { error } = await supabase.rpc('reserver_panier', { evt: e.id })
    setMsg(error ? { ok: false, texte: message(error) } : { ok: true, texte: `Panier réservé pour ${dateLongue(e.jour)}.` })
    await charger(); setOccupe(null)
  }
  async function annuler(r: Reservation, e: Evenement) {
    if (!window.confirm(`Annuler votre panier du ${dateLongue(e.jour)} ?`)) return
    setOccupe(e.id); setMsg(null)
    const { error } = await supabase.rpc('annuler_reservation', { resa: r.id })
    setMsg(error ? { ok: false, texte: message(error) } : { ok: true, texte: 'Réservation annulée.' })
    await charger(); setOccupe(null)
  }

  const semaineDe = (jour: string) => {
    const d = new Date(jour + 'T12:00:00')
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <>
      <div className="esp-head">
        <h1>Paniers et marchés</h1>
        <p>Un panier à 5 € par foyer et par semaine. Le contenu change selon les dons et les arrivages.</p>
      </div>
      {!actif && <p className="esp-note">Votre adhésion doit être active pour réserver en ligne. En attendant, vous pouvez voir les dates.</p>}
      {msg && <p className={msg.ok ? 'esp-ok' : 'esp-err'} role={msg.ok ? 'status' : 'alert'}>{msg.texte}</p>}
      {evenements === null ? <p className="esp-wait">Chargement…</p> : evenements.length === 0 ? (
        <section className="esp-card"><p>Pas encore de date annoncée. Elles sont aussi publiées sur notre page Facebook.</p></section>
      ) : (
        <ul className="esp-list">
          {evenements.map((e) => {
            const resa = resas.find((r) => r.evenement_id === e.id)
            const autreSemaine = !resa && resas.some((r) => r.semaine === semaineDe(e.jour))
            const reste = places[e.id]
            const complet = reste === 0
            return (
              <li key={e.id} className={'esp-evt ' + e.type}>
                <span className={'eyebrow' + (e.type === 'marche' ? ' green' : '')}>{e.type === 'marche' ? 'Marché solidaire' : 'Distribution de paniers'}</span>
                <h2>{dateLongue(e.jour)}</h2>
                <p>De {heure(e.heure_debut)} à {heure(e.heure_fin)}{e.type === 'distribution' && e.lieu ? <><br />{e.lieu}</> : null}</p>
                {e.note && <p className="esp-small">{e.note}</p>}
                {e.type === 'distribution' && (
                  resa ? (
                    <div className="esp-evt-actions">
                      <p className="esp-status on">{resa.statut === 'retiree' ? 'Panier retiré' : 'Panier réservé'}</p>
                      {resa.statut === 'reservee' && <button className="esp-btn soft" disabled={occupe === e.id} onClick={() => annuler(resa, e)}>Annuler</button>}
                    </div>
                  ) : actif ? (
                    <div className="esp-evt-actions">
                      {reste != null && !complet && <p className="esp-small">{reste} panier{reste > 1 ? 's' : ''} disponible{reste > 1 ? 's' : ''}</p>}
                      <button className="esp-btn" disabled={occupe === e.id || complet || autreSemaine} onClick={() => reserver(e)}>
                        {complet ? 'Complet' : autreSemaine ? 'Déjà un panier cette semaine' : occupe === e.id ? 'Réservation…' : 'Réserver mon panier'}
                      </button>
                    </div>
                  ) : null
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

/* ---------- Aider : bénévolat et location ---------- */

function Aider({ foyer }: { foyer: Foyer }) {
  const [candidature, setCandidature] = useState<Candidature | null | undefined>(undefined)
  const [locations, setLocations] = useState<Location[]>([])
  const [msgB, setMsgB] = useState<{ ok: boolean; texte: string } | null>(null)
  const [msgL, setMsgL] = useState<{ ok: boolean; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(async () => {
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('candidatures_benevoles').select('id, created_at').eq('foyer_id', foyer.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('locations').select('id, date_debut, date_fin, tables, bancs, statut').eq('foyer_id', foyer.id).order('date_debut', { ascending: false }),
    ])
    setCandidature((c as Candidature | null) ?? null)
    setLocations((l ?? []) as Location[])
  }, [foyer.id])
  useEffect(() => { void charger() }, [charger])

  async function benevole(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setEnvoi(true)
    const { error } = await supabase.from('candidatures_benevoles').insert({
      foyer_id: foyer.id, disponibilites: String(d.get('disponibilites') ?? ''), message: String(d.get('message') ?? '') || null,
    })
    setEnvoi(false)
    setMsgB(error ? { ok: false, texte: message(error) } : { ok: true, texte: 'Merci ! Nous vous recontactons très vite.' })
    if (!error) await charger()
  }

  async function louer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const d = new FormData(form)
    const debut = String(d.get('date_debut')), fin = String(d.get('date_fin') || debut)
    const tables = Number(d.get('tables') || 0), bancs = Number(d.get('bancs') || 0)
    if (tables + bancs === 0) { setMsgL({ ok: false, texte: 'Indiquez au moins une table ou un banc.' }); return }
    if (fin < debut) { setMsgL({ ok: false, texte: 'La date de retour doit suivre la date de début.' }); return }
    setEnvoi(true)
    const { error } = await supabase.from('locations').insert({
      foyer_id: foyer.id, date_debut: debut, date_fin: fin, tables, bancs, message: String(d.get('message') ?? '') || null,
    })
    setEnvoi(false)
    setMsgL(error ? { ok: false, texte: message(error) } : { ok: true, texte: 'Demande envoyée. Nous vous confirmons la disponibilité et le prix.' })
    if (!error) { form.reset(); await charger() }
  }

  const libelle = { demandee: 'En attente', acceptee: 'Acceptée', refusee: 'Refusée', annulee: 'Annulée' } as const

  return (
    <>
      <div className="esp-head">
        <h1>Donner un coup de main</h1>
        <p>Chaque panier se prépare à plusieurs. Une heure de temps en temps, ça compte.</p>
      </div>

      <section className="esp-card">
        <span className="eyebrow sun">Bénévolat</span>
        <h2>Devenir bénévole</h2>
        {candidature ? (
          <p className="esp-ok">Votre proposition du {dateCourte(candidature.created_at.slice(0, 10))} est bien reçue. Merci !</p>
        ) : (
          <form className="esp-form" onSubmit={benevole}>
            <label>Quand êtes-vous disponible ?<input name="disponibilites" placeholder="Ex. : le samedi matin" required maxLength={500} /></label>
            <label>Un mot (facultatif)<textarea name="message" rows={3} maxLength={1000} placeholder="Cuisine, transport, accueil…" /></label>
            <button className="esp-btn" disabled={envoi}>Je propose mon aide</button>
          </form>
        )}
        {msgB && !msgB.ok && <p className="esp-err" role="alert">{msgB.texte}</p>}
      </section>

      <section className="esp-card">
        <span className="eyebrow green">Location</span>
        <h2>Tables et bancs</h2>
        <p>Pour une fête ou une kermesse. 100 % des bénéfices financent nos actions.</p>
        <form className="esp-form" onSubmit={louer}>
          <div className="esp-two">
            <label>Du<input name="date_debut" type="date" required min={aujourdhui()} /></label>
            <label>Au<input name="date_fin" type="date" min={aujourdhui()} /></label>
          </div>
          <div className="esp-two">
            <label>Tables<input name="tables" type="number" min={0} max={100} defaultValue={0} inputMode="numeric" /></label>
            <label>Bancs<input name="bancs" type="number" min={0} max={200} defaultValue={0} inputMode="numeric" /></label>
          </div>
          <label>Précisions (facultatif)<textarea name="message" rows={2} maxLength={1000} /></label>
          <button className="esp-btn" disabled={envoi}>Envoyer ma demande</button>
          {msgL && <p className={msgL.ok ? 'esp-ok' : 'esp-err'} role={msgL.ok ? 'status' : 'alert'}>{msgL.texte}</p>}
        </form>
        {locations.length > 0 && (
          <ul className="esp-mini">
            {locations.map((l) => (
              <li key={l.id}>
                <span>{dateCourte(l.date_debut)}{l.date_fin !== l.date_debut ? ` → ${dateCourte(l.date_fin)}` : ''} · {l.tables} table{l.tables > 1 ? 's' : ''}, {l.bancs} banc{l.bancs > 1 ? 's' : ''}</span>
                <b className={l.statut}>{libelle[l.statut]}</b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

/* ---------- Profil ---------- */

function ProfilForm({ foyer, userId, onSaved }: { foyer?: Foyer; userId?: string; onSaved: () => void }) {
  const [nb, setNb] = useState(foyer?.nb_personnes ?? 1)
  const [rappel, setRappel] = useState<Foyer['rappel']>(foyer?.rappel ?? 'email')
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'ok'>('idle')
  const [erreur, setErreur] = useState('')

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const telephone = String(d.get('telephone') ?? '').trim() || null
    if (rappel === 'sms' && !telephone) { setErreur('Indiquez un numéro de portable pour recevoir les SMS.'); return }
    const champs = {
      prenom: String(d.get('prenom')).trim(),
      nom: String(d.get('nom')).trim(),
      telephone,
      ville: String(d.get('ville') ?? '') || null,
      nb_personnes: nb,
      rappel,
    }
    setEtat('envoi'); setErreur('')
    const { error } = foyer
      ? await supabase.from('foyers').update(champs).eq('id', foyer.id)
      : await supabase.from('foyers').insert({ ...champs, user_id: userId })
    if (error) { setErreur(message(error)); setEtat('idle'); return }
    setEtat('ok')
    onSaved()
  }

  return (
    <form className="esp-form" onSubmit={enregistrer}>
      <div className="esp-two">
        <label>Prénom<input name="prenom" required maxLength={80} defaultValue={foyer?.prenom} autoComplete="given-name" /></label>
        <label>Nom<input name="nom" required maxLength={80} defaultValue={foyer?.nom} autoComplete="family-name" /></label>
      </div>
      <label>Portable (facultatif)<input name="telephone" type="tel" maxLength={30} defaultValue={foyer?.telephone ?? ''} autoComplete="tel" /></label>
      <label>Ville
        <select name="ville" defaultValue={foyer?.ville ?? 'Masny'}><option>Masny</option><option>Harnes</option><option>Autre</option></select>
      </label>
      <fieldset className="esp-field">
        <legend>Combien de personnes dans le foyer ?</legend>
        <div className="esp-stepper">
          <button type="button" aria-label="Une personne de moins" onClick={() => setNb((n) => Math.max(1, n - 1))}>−</button>
          <output aria-live="polite">{nb}</output>
          <button type="button" aria-label="Une personne de plus" onClick={() => setNb((n) => Math.min(20, n + 1))}>+</button>
        </div>
      </fieldset>
      <fieldset className="esp-field">
        <legend>Un rappel la veille du panier ?</legend>
        <div className="esp-choices">
          {([['email', 'Par e-mail'], ['sms', 'Par SMS'], ['aucun', 'Non merci']] as const).map(([v, l]) => (
            <label key={v} className={rappel === v ? 'on' : ''}>
              <input type="radio" name="rappel" value={v} checked={rappel === v} onChange={() => setRappel(v)} />{l}
            </label>
          ))}
        </div>
      </fieldset>
      <button className="esp-btn" disabled={etat === 'envoi'}>{etat === 'envoi' ? 'Enregistrement…' : foyer ? 'Enregistrer' : 'Envoyer'}</button>
      {etat === 'ok' && foyer && <p className="esp-ok" role="status">C'est enregistré.</p>}
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
    </form>
  )
}

function Profil({ foyer, onSaved }: { foyer: Foyer; onSaved: () => void }) {
  const [equipe, setEquipe] = useState(false)
  useEffect(() => { void supabase.rpc('est_equipe').then(({ data }) => setEquipe(data === true)) }, [])
  return (
    <>
      <div className="esp-head">
        <h1>Mon profil</h1>
        <p>Connecté avec {foyer.email}</p>
      </div>
      {equipe && (
        <section className="esp-card">
          <span className="eyebrow green">Équipe</span>
          <p>Vous faites partie de l'équipe des Toqués du Cœur.</p>
          <a className="esp-btn" href="/gestion">Ouvrir l'espace gestion</a>
        </section>
      )}
      <section className="esp-card"><ProfilForm foyer={foyer} onSaved={onSaved} /></section>
      <section className="esp-card">
        <p className="esp-small">Nous gardons le strict nécessaire pour préparer les paniers. Rien n'est transmis à des tiers. Pour supprimer votre compte, appelez-nous au {TEL}.</p>
        <button className="esp-btn soft" onClick={() => supabase.auth.signOut()}>Me déconnecter</button>
      </section>
    </>
  )
}
