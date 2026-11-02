import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { aujourdhui, dateLongue, message, supabase, type Evenement, type Foyer } from '../adherent/supabase'
import { numero } from './outils'

type Resultat =
  | { type: 'ok' | 'deja'; foyer: Foyer; heure?: string }
  | { type: 'sans' | 'inactif'; foyer: Foyer }
  | { type: 'inconnue' | 'erreur'; texte: string }

const PREFIXE = 'TDC:'

/** Pointage du jour J : on scanne la carte d'adhérent, le panier passe en « retiré ». */
export default function Pointage({ evenement: e, fermer }: { evenement: Evenement; fermer: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const dernier = useRef<{ code: string; t: number }>({ code: '', t: 0 })
  const occupe = useRef(false)
  const [camera, setCamera] = useState<'demarrage' | 'ok' | 'refus'>('demarrage')
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const [compte, setCompte] = useState(0)

  const traiter = useCallback(async (code: string) => {
    if (!code.startsWith(PREFIXE)) { setResultat({ type: 'inconnue', texte: 'Ce QR code n\'est pas une carte des Toqués du Cœur.' }); return }
    const { data: f, error } = await supabase.from('foyers').select('*').eq('carte', code.slice(PREFIXE.length)).maybeSingle()
    if (error) { setResultat({ type: 'erreur', texte: message(error) }); return }
    if (!f) { setResultat({ type: 'inconnue', texte: 'Carte inconnue.' }); return }
    const foyer = f as Foyer
    const { data: r } = await supabase.from('reservations').select('id, statut, retiree_at').eq('foyer_id', foyer.id).eq('evenement_id', e.id).neq('statut', 'annulee').maybeSingle()
    if (r?.statut === 'retiree') {
      setResultat({ type: 'deja', foyer, heure: r.retiree_at ? new Date(r.retiree_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined })
    } else if (r) {
      const { error: err } = await supabase.from('reservations').update({ statut: 'retiree' }).eq('id', r.id)
      if (err) { setResultat({ type: 'erreur', texte: message(err) }); return }
      setResultat({ type: 'ok', foyer }); setCompte((c) => c + 1)
      navigator.vibrate?.(120)
    } else {
      const actif = foyer.statut === 'actif' && !!foyer.adhesion_fin && foyer.adhesion_fin >= aujourdhui()
      setResultat({ type: actif ? 'sans' : 'inactif', foyer })
    }
  }, [e.id])

  useEffect(() => {
    let flux: MediaStream | null = null
    let boucle = 0
    let arret = false
    canvas.current = document.createElement('canvas')
    const lire = () => {
      const v = video.current, c = canvas.current
      if (!arret && v && c && v.readyState >= 2 && !occupe.current) {
        c.width = v.videoWidth; c.height = v.videoHeight
        const ctx = c.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(v, 0, 0)
        const img = ctx.getImageData(0, 0, c.width, c.height)
        const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })
        const now = Date.now()
        // On ignore la même carte pendant 4 s pour ne pas la traiter deux fois.
        if (qr?.data && (qr.data !== dernier.current.code || now - dernier.current.t > 4000)) {
          dernier.current = { code: qr.data, t: now }
          occupe.current = true
          void traiter(qr.data).finally(() => { occupe.current = false })
        }
      }
      if (!arret) boucle = window.setTimeout(lire, 200)
    }
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (arret) { s.getTracks().forEach((t) => t.stop()); return }
        flux = s
        if (video.current) { video.current.srcObject = s; void video.current.play() }
        setCamera('ok'); lire()
      })
      .catch(() => setCamera('refus'))
    return () => { arret = true; clearTimeout(boucle); flux?.getTracks().forEach((t) => t.stop()) }
  }, [traiter])

  async function reserverEtPointer(foyer: Foyer) {
    const { data, error } = await supabase.rpc('reserver_panier', { evt: e.id, pour_foyer: foyer.id })
    if (error) { setResultat({ type: 'erreur', texte: message(error) }); return }
    await supabase.from('reservations').update({ statut: 'retiree' }).eq('id', (data as { id: string }).id)
    setResultat({ type: 'ok', foyer }); setCompte((c) => c + 1)
  }

  return (
    <div className="ges-scanner">
      <div className="ges-scanner-top">
        <button className="ges-back light" onClick={fermer}>← Retour à la liste</button>
        <span className="cap">{dateLongue(e.jour)} · {compte} pointé{compte > 1 ? 's' : ''}</span>
      </div>
      <div className="ges-video">
        <video ref={video} playsInline muted />
        <i className="ges-viseur" aria-hidden="true" />
        {camera === 'demarrage' && <p>Ouverture de la caméra…</p>}
        {camera === 'refus' && <p>La caméra n'est pas accessible. Autorisez-la dans le navigateur, ou pointez depuis la liste.</p>}
      </div>
      <div className={'ges-result ' + (resultat?.type ?? 'vide')} role="status" aria-live="assertive">
        {!resultat && <p>Présentez la carte d'adhérent devant la caméra.</p>}
        {resultat && 'foyer' in resultat && (
          <>
            <b>{resultat.foyer.prenom} {resultat.foyer.nom}</b>
            <small>{numero(resultat.foyer)} · {resultat.foyer.nb_personnes} pers.</small>
          </>
        )}
        {resultat?.type === 'ok' && <p className="big">✓ Panier retiré</p>}
        {resultat?.type === 'deja' && <p className="big">Déjà retiré{resultat.heure ? ` à ${resultat.heure}` : ''}</p>}
        {resultat?.type === 'inactif' && <p className="big">Adhésion non active</p>}
        {resultat?.type === 'sans' && (
          <>
            <p className="big">Pas de réservation</p>
            <button className="esp-btn" onClick={() => reserverEtPointer(resultat.foyer)}>Lui donner un panier quand même</button>
          </>
        )}
        {(resultat?.type === 'inconnue' || resultat?.type === 'erreur') && <p className="big">{resultat.texte}</p>}
      </div>
    </div>
  )
}
