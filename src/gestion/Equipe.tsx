import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { message, supabase } from '../adherent/supabase'

type Membre = { user_id: string; email: string; nom: string | null; role: 'admin' | 'benevole' }

export default function Equipe({ userId }: { userId: string }) {
  const [membres, setMembres] = useState<Membre[] | null>(null)
  const [etat, setEtat] = useState<{ ok: boolean; texte: string } | null>(null)

  const charger = useCallback(async () => {
    const { data, error } = await supabase.rpc('equipe')
    if (error) setEtat({ ok: false, texte: message(error) })
    setMembres((data ?? []) as Membre[])
  }, [])
  useEffect(() => { void charger() }, [charger])

  async function ajouter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const d = new FormData(form)
    const { error } = await supabase.rpc('ajouter_membre', { email: String(d.get('email')), role: String(d.get('role')), nom: String(d.get('nom') ?? '') })
    setEtat(error ? { ok: false, texte: message(error) } : { ok: true, texte: 'Accès donné.' })
    if (!error) { form.reset(); await charger() }
  }
  async function changerRole(m: Membre) {
    const { error } = await supabase.rpc('ajouter_membre', { email: m.email, role: m.role === 'admin' ? 'benevole' : 'admin', nom: m.nom ?? '' })
    setEtat(error ? { ok: false, texte: message(error) } : null)
    await charger()
  }
  async function retirer(m: Membre) {
    if (!window.confirm(`Retirer l'accès à la gestion pour ${m.nom || m.email} ?`)) return
    const { error } = await supabase.rpc('retirer_membre', { membre: m.user_id })
    setEtat(error ? { ok: false, texte: message(error) } : { ok: true, texte: 'Accès retiré.' })
    await charger()
  }

  return (
    <>
      <div className="ges-head"><h1>Équipe</h1></div>
      <p className="esp-small">Le <b>bureau</b> a tous les droits. Les <b>bénévoles</b> voient les adhérents, réservent pour un foyer, pointent les paniers et s'inscrivent au planning, mais ne valident pas les adhésions et n'envoient pas de messages.</p>
      {etat && <p className={etat.ok ? 'esp-ok' : 'esp-err'} role={etat.ok ? 'status' : 'alert'}>{etat.texte}</p>}

      <div className="ges-grid">
        <section className="ges-card">
          <h2>Membres</h2>
          {membres === null ? <p className="esp-small">Chargement…</p> : (
            <ul className="ges-list">
              {membres.map((m) => (
                <li key={m.user_id} className="col">
                  <span><b>{m.nom || m.email}</b>{m.user_id === userId && <small className="ges-muted"> · vous</small>}</span>
                  <small>{m.email}</small>
                  <span className="ges-row wrap">
                    <span className={'ges-tag ' + (m.role === 'admin' ? 'active' : 'attente')}>{m.role === 'admin' ? 'Bureau' : 'Bénévole'}</span>
                    <button className="ges-mini" onClick={() => changerRole(m)}>Passer {m.role === 'admin' ? 'bénévole' : 'au bureau'}</button>
                    <button className="ges-mini" onClick={() => retirer(m)}>Retirer</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="ges-card">
          <h2>Donner l'accès</h2>
          <p className="esp-small">La personne crée d'abord son compte sur <a href="/adherent">l'espace adhérent</a>, puis vous l'ajoutez ici avec le même e-mail.</p>
          <form className="esp-form" onSubmit={ajouter}>
            <label>E-mail du compte<input name="email" type="email" required /></label>
            <label>Nom affiché<input name="nom" maxLength={80} placeholder="Ex. : Vincent" /></label>
            <label>Rôle
              <select name="role" defaultValue="benevole"><option value="benevole">Bénévole</option><option value="admin">Bureau</option></select>
            </label>
            <button className="esp-btn">Donner l'accès</button>
          </form>
        </section>
      </div>
    </>
  )
}
