import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { message, supabase } from './supabase'

const TEL = '06 45 84 22 15'

/** Session Supabase, et vrai pendant qu'on revient d'un lien « mot de passe oublié ». */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [reinitialisation, setReinitialisation] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((evt, s) => {
      if (evt === 'PASSWORD_RECOVERY') setReinitialisation(true)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  return { session, reinitialisation, finReinitialisation: () => setReinitialisation(false) }
}

/** Messages de Supabase Auth traduits pour les adhérents. */
function erreurConnexion(e: unknown): string {
  const m = message(e)
  if (/invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect. Pas encore de compte ? Touchez « Créer un compte » plus bas, avec la même adresse e-mail.'
  if (/email not confirmed/i.test(m)) return `Votre compte n'est pas encore activé. Appelez-nous au ${TEL}, le Bureau l'active tout de suite.`
  if (/already registered|already been registered/i.test(m)) return 'Un compte existe déjà avec cet e-mail. Connectez-vous, ou utilisez « Mot de passe oublié ».'
  if (/email address .* is invalid|error sending|sending .*email/i.test(m)) return `Nous ne pouvons pas créer votre compte en ligne pour le moment. Appelez-nous au ${TEL}, le Bureau le crée avec vous.`
  if (/password should be at least/i.test(m)) return 'Le mot de passe doit faire au moins 8 caractères.'
  if (/rate limit|too many/i.test(m)) return 'Trop d\'essais d\'un coup. Patientez quelques minutes.'
  return m
}

// On revient sur la page d'où part la demande (espace adhérent ou gestion).
const RETOUR = () => window.location.origin + window.location.pathname

export function Connexion({ espace = 'Espace adhérent' }: { espace?: string }) {
  const [mode, setMode] = useState<'connexion' | 'inscription' | 'oubli'>('connexion')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [ok, setOk] = useState('')

  function changer(m: typeof mode) { setMode(m); setErreur(''); setOk('') }

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const email = String(d.get('email')).trim()
    const motDePasse = String(d.get('mot_de_passe') ?? '')
    setErreur(''); setOk('')
    if (mode === 'inscription' && motDePasse !== String(d.get('confirmation'))) { setErreur('Les deux mots de passe ne sont pas identiques.'); return }
    setEnvoi(true)
    if (mode === 'connexion') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
      if (error) setErreur(erreurConnexion(error))
    } else if (mode === 'inscription') {
      const { data, error } = await supabase.auth.signUp({ email, password: motDePasse, options: { emailRedirectTo: RETOUR() } })
      if (error) setErreur(erreurConnexion(error))
      // Sans session, Supabase attend la confirmation de l'adresse e-mail.
      else if (!data.session) setOk(`Compte créé ! Le Bureau l'active très vite. En cas de souci, appelez-nous au ${TEL}.`)
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: RETOUR() })
      if (error) setErreur(erreurConnexion(error))
      else setOk(`Si un compte existe avec cet e-mail, un lien part pour choisir un nouveau mot de passe. Rien reçu après quelques minutes ? Appelez-nous au ${TEL} : le Bureau vous donne un nouveau mot de passe.`)
    }
    setEnvoi(false)
  }

  const titre = { connexion: 'Se connecter', inscription: 'Créer mon compte', oubli: 'Mot de passe oublié' }[mode]
  const bouton = { connexion: 'Me connecter', inscription: 'Créer mon compte', oubli: 'Recevoir le lien' }[mode]

  return (
    <main className="esp-main">
      <section className="esp-card">
        <span className="eyebrow">{espace}</span>
        <h1>{titre}</h1>
        {ok ? (
          <p className="esp-ok" role="status">{ok}</p>
        ) : (
          <form onSubmit={envoyer} className="esp-form" key={mode}>
            {mode === 'oubli' && <p>Le plus simple : appelez-nous au <a href="tel:+33645842215">{TEL}</a>, le Bureau vous donne un nouveau mot de passe. Vous pouvez aussi demander un lien par e-mail.</p>}
            <label>E-mail<input name="email" type="email" required autoComplete="email" inputMode="email" /></label>
            {mode !== 'oubli' && (
              <label>Mot de passe
                <input name="mot_de_passe" type="password" required minLength={mode === 'inscription' ? 8 : undefined}
                  autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'} />
              </label>
            )}
            {mode === 'inscription' && (
              <label>Confirmer le mot de passe<input name="confirmation" type="password" required minLength={8} autoComplete="new-password" /></label>
            )}
            {mode === 'connexion' && <button type="button" className="esp-link" onClick={() => changer('oubli')}>Mot de passe oublié ?</button>}
            <button className="esp-btn" disabled={envoi}>{envoi ? 'Un instant…' : bouton}</button>
            {erreur && <p className="esp-err" role="alert">{erreur}</p>}
          </form>
        )}
      </section>
      <section className="esp-card esp-switch">
        {mode === 'connexion' ? (
          <>
            <p>Pas encore de compte ?</p>
            <button className="esp-btn soft" onClick={() => changer('inscription')}>Créer un compte</button>
          </>
        ) : (
          <>
            <p>Vous avez déjà un compte ?</p>
            <button className="esp-btn soft" onClick={() => changer('connexion')}>Se connecter</button>
          </>
        )}
      </section>
      <p className="esp-small esp-center">Un souci ? Appelez-nous au <a href="tel:+33645842215">{TEL}</a>.</p>
    </main>
  )
}

export function NouveauMotDePasse({ onDone, espace = 'Espace adhérent' }: { onDone: () => void; espace?: string }) {
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const motDePasse = String(d.get('mot_de_passe'))
    if (motDePasse !== String(d.get('confirmation'))) { setErreur('Les deux mots de passe ne sont pas identiques.'); return }
    setEnvoi(true)
    const { error } = await supabase.auth.updateUser({ password: motDePasse })
    setEnvoi(false)
    if (error) setErreur(erreurConnexion(error))
    else onDone()
  }
  return (
    <main className="esp-main">
      <section className="esp-card">
        <span className="eyebrow">{espace}</span>
        <h1>Nouveau mot de passe</h1>
        <form onSubmit={enregistrer} className="esp-form">
          <label>Nouveau mot de passe<input name="mot_de_passe" type="password" required minLength={8} autoComplete="new-password" /></label>
          <label>Confirmer<input name="confirmation" type="password" required minLength={8} autoComplete="new-password" /></label>
          <button className="esp-btn" disabled={envoi}>{envoi ? 'Un instant…' : 'Enregistrer'}</button>
          {erreur && <p className="esp-err" role="alert">{erreur}</p>}
        </form>
      </section>
    </main>
  )
}
