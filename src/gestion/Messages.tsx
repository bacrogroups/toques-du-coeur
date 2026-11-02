import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { aujourdhui, dateCourte, dateLongue, message, supabase, type Evenement, type Message } from '../adherent/supabase'
import { plusJours } from './outils'

const CIBLES: Record<Message['cible'], string> = {
  tous: 'Tous les inscrits',
  actifs: 'Les adhérents dont l\'adhésion est active',
  evenement: 'Les foyers inscrits à une distribution',
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [dates, setDates] = useState<Evenement[]>([])
  const [cible, setCible] = useState<Message['cible']>('actifs')
  const [etat, setEtat] = useState<{ ok: boolean; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(async () => {
    const [{ data: ms }, { data: es }] = await Promise.all([
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('evenements').select('*').eq('type', 'distribution').gte('jour', aujourdhui()).order('jour').limit(12),
    ])
    setMessages((ms ?? []) as Message[])
    setDates((es ?? []) as Evenement[])
  }, [])
  useEffect(() => { void charger() }, [charger])

  async function envoyerParBrevo(id: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('envoyer-message', { body: { id } })
    if (error) {
      // Le corps de la réponse porte un message en français quand la fonction refuse.
      const corps = await (error as { context?: Response }).context?.json?.().catch(() => null)
      return corps?.erreur ?? message(error)
    }
    const r = data as { envois: number; erreurs: string[] }
    return `${r.envois} envoi${r.envois > 1 ? 's' : ''} effectué${r.envois > 1 ? 's' : ''}${r.erreurs.length ? `, ${r.erreurs.length} en erreur` : ''}.`
  }

  async function publier(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const form = ev.currentTarget
    const d = new FormData(form)
    const parEmail = d.get('par_email') === 'on', parSms = d.get('par_sms') === 'on', publie = d.get('publie') === 'on'
    if (!parEmail && !parSms && !publie) { setEtat({ ok: false, texte: 'Choisissez au moins une façon de diffuser le message.' }); return }
    setEnvoi(true); setEtat(null)
    const { data, error } = await supabase.from('messages').insert({
      titre: String(d.get('titre')).trim(),
      texte: String(d.get('texte')).trim(),
      cible,
      evenement_id: cible === 'evenement' ? String(d.get('evenement_id')) : null,
      par_email: parEmail,
      par_sms: parSms,
      publie,
      expire_le: String(d.get('expire_le') ?? '') || null,
    }).select('id').single()
    if (error) { setEnvoi(false); setEtat({ ok: false, texte: message(error) }); return }
    let texte = publie ? 'Message publié dans l\'espace adhérent.' : 'Message enregistré.'
    if (parEmail || parSms) texte += ' ' + await envoyerParBrevo(data.id)
    setEnvoi(false)
    setEtat({ ok: true, texte })
    form.reset(); setCible('actifs')
    await charger()
  }

  async function supprimer(m: Message) {
    if (!window.confirm('Supprimer ce message ? Il disparaît de l\'espace adhérent.')) return
    await supabase.from('messages').delete().eq('id', m.id)
    await charger()
  }
  async function renvoyer(m: Message) {
    setEtat({ ok: true, texte: await envoyerParBrevo(m.id) })
    await charger()
  }

  return (
    <>
      <div className="ges-head"><h1>Messages groupés</h1></div>
      <section className="ges-card">
        <h2>Nouveau message</h2>
        <form className="esp-form" onSubmit={publier}>
          <label>Titre<input name="titre" required maxLength={120} placeholder="Distribution samedi" /></label>
          <label>Message<textarea name="texte" required maxLength={1000} rows={4} placeholder="Bonjour à tous, la prochaine distribution a lieu samedi de 10 h à 12 h. Pensez à votre sac !" /></label>
          <label>Pour qui ?
            <select value={cible} onChange={(e) => setCible(e.target.value as Message['cible'])}>
              {Object.entries(CIBLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {cible === 'evenement' && (
            <label>Distribution
              <select name="evenement_id" required>
                {dates.map((e) => <option key={e.id} value={e.id}>{dateLongue(e.jour)}</option>)}
              </select>
            </label>
          )}
          <fieldset className="esp-field">
            <legend>Comment le diffuser ?</legend>
            <label className="ges-check"><input type="checkbox" name="publie" defaultChecked /> Afficher dans l'espace adhérent</label>
            <label className="ges-check"><input type="checkbox" name="par_email" /> Envoyer par e-mail</label>
            <label className="ges-check"><input type="checkbox" name="par_sms" /> Envoyer par SMS (payant)</label>
          </fieldset>
          <label>Ne plus l'afficher après le (facultatif)<input name="expire_le" type="date" min={aujourdhui()} defaultValue={plusJours(aujourdhui(), 14)} /></label>
          <button className="esp-btn" disabled={envoi}>{envoi ? 'Envoi…' : 'Publier le message'}</button>
          {etat && <p className={etat.ok ? 'esp-ok' : 'esp-err'} role={etat.ok ? 'status' : 'alert'}>{etat.texte}</p>}
        </form>
      </section>

      <div className="ges-head"><h2>Messages envoyés</h2></div>
      {messages === null ? <p className="esp-wait">Chargement…</p> : messages.length === 0 ? <p className="ges-empty">Aucun message pour l'instant.</p> : (
        <ul className="ges-list ges-card">
          {messages.map((m) => {
            const expire = !!m.expire_le && m.expire_le < aujourdhui()
            return (
              <li key={m.id} className="col">
                <span><b>{m.titre}</b> <small className="ges-muted">le {dateCourte(m.created_at.slice(0, 10))} · {CIBLES[m.cible].toLowerCase()}</small></span>
                <small>{m.texte}</small>
                <span className="ges-row wrap">
                  {m.publie && <span className={'ges-tag ' + (expire ? 'terminee' : 'active')}>{expire ? 'Plus affiché' : 'Affiché sur le site'}</span>}
                  {m.envoye_at && <span className="ges-tag active">{m.envois} envoi{m.envois > 1 ? 's' : ''}</span>}
                  {(m.par_email || m.par_sms) && !m.envoye_at && <button className="ges-mini ok" onClick={() => renvoyer(m)}>Envoyer {m.par_email ? 'l\'e-mail' : 'le SMS'}</button>}
                  <button className="ges-mini" onClick={() => supprimer(m)}>Supprimer</button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
