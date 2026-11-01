import { useState, type CSSProperties, type FormEvent } from 'react'
import { useCountUp, useMotion, usePointerParallax } from './motion'
import { BasketScene, MarketScene } from './scenes'

const FACEBOOK = 'https://www.facebook.com/profile.php?id=61570108281468'
const EMAIL = 'lestoquesducoeur@gmail.com'
const TEL = '06 45 84 22 15'
const ADHESION = 15
const PANIER = 5

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top" aria-label="Les Toqués du Cœur – accueil">
        <img src="/assets/logo.png" alt="" />
        <span>Les Toqués du Cœur</span>
      </a>
      <nav aria-label="Navigation principale">
        <a href="#panier">Le panier</a>
        <a href="#marche">Le marché</a>
        <a href="#actions">Actions</a>
        <a href="#adhesion">Adhérer</a>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top" data-pin>
      <div className="stage">
        <img className="bg" src="/assets/hero.jpg" alt="" />
        <div className="veil" />
        <div className="hero-copy">
          <p className="tagline"><span>La cuisine au service de la solidarité</span></p>
          <h1>
            <span className="line"><span>Les Toqués</span></span>
            <span className="line"><span style={delay(120)}>du Cœur</span></span>
          </h1>
        </div>
        <aside className="info">
          <b>Association 100 % bénévole, Harnes &amp; Masny.</b>
          <hr />
          <p>Pour les enfants malades, handicapés ou en situation de précarité, et leurs familles.</p>
        </aside>
        <a className="thumb" href="#panier">
          <span>Le panier à {PANIER} €</span>
          <i aria-hidden="true">↓</i>
        </a>
      </div>
    </section>
  )
}

function Panier() {
  const ref = usePointerParallax<HTMLDivElement>()
  const rows: [string, string][] = [
    ['.1,.22', 'Légumes de saison'],
    ['.2,.32', 'Carottes & racines'],
    ['.3,.42', 'Fruits'],
    ['.38,.5', 'Produits frais'],
    ['.48,.6', 'Lait & épicerie'],
    ['.58,.7', 'Pain, selon arrivages'],
  ]
  return (
    <section className="pin panier" id="panier" data-pin>
      <div className="stage trio">
        <div className="left">
          <span className="eyebrow">01 — Le panier solidaire</span>
          <h2>Un panier.<br />Cinq euros.<br />Tout ce qu'il faut.</h2>
        </div>
        <div className="center" ref={ref}><BasketScene /></div>
        <div className="right">
          <ul className="fill-list">
            {rows.map(([r, label]) => <li key={label} data-range={r}><span>{label}</span><i>inclus</i></li>)}
          </ul>
          <p className="body final" data-range=".78,.9">Réservé aux adhérents, préparé par les bénévoles, à retirer de 10 h à midi lors des distributions.</p>
        </div>
      </div>
    </section>
  )
}

function Marche() {
  const ref = usePointerParallax<HTMLDivElement>()
  const steps: [string, string, string, string][] = [
    ['0,.34', '02.1', "On monte l'étal", 'Poteaux, auvent, comptoir : les bénévoles installent le marché à Harnes ou à Masny.'],
    ['.3,.62', '02.2', 'On remplit les cagettes', 'Des produits frais et de saison, rassemblés et triés le matin même.'],
    ['.58,1', '02.3', 'On ouvre aux adhérents', `Des prix solidaires pour celles et ceux qui ont leur carte à ${ADHESION} € par an.`],
  ]
  return (
    <section className="pin marche" id="marche" data-pin>
      <div className="stage duo">
        <div className="left">
          <span className="eyebrow">02 — Le marché solidaire</span>
          <h2>Un vrai marché. Des prix qui font du bien.</h2>
          <div className="steps">
            {steps.map(([r, n, t, s], i) => (
              <div key={n} className={'step' + (i === steps.length - 1 ? ' hold' : '')} data-range={r}>
                <span className="eyebrow">{n}</span>
                <h3>{t}</h3>
                <p className="body">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="center" ref={ref}><MarketScene /></div>
      </div>
    </section>
  )
}

function Manifeste() {
  const text = "Nous cuisinons, nous distribuons, nous partageons. Parce qu'un panier plein, un repas chaud ou un goûter partagé changent une journée, pour un enfant comme pour ses parents."
  const words = text.split(' ')
  return (
    <section className="pin manifeste" data-pin>
      <div className="stage">
        <p className="words">
          {words.map((w, i) => {
            const a = 0.05 + (i / words.length) * 0.8
            return <span key={i} data-range={`${a.toFixed(3)},${(a + 0.08).toFixed(3)}`}>{w} </span>
          })}
        </p>
      </div>
    </section>
  )
}

function Actions() {
  const items: [string, string, string, string][] = [
    ['/assets/distribution.jpg', 'Distributions', `Chaque famille inscrite repart avec son panier à ${PANIER} €, remis par les bénévoles.`, 'Harnes · Masny'],
    ['/assets/marche.jpg', 'Marché solidaire', 'Des cagettes de produits frais, à prix solidaire, pour les adhérents.', 'Adhérents'],
    ['/assets/cuisine.jpg', 'Cuisine', 'La soupe maison mijote avant le départ : on cuisine pour celles et ceux qui viennent.', 'Fait maison'],
    ['/assets/partage.jpg', 'Moments de partage', 'Goûters, sorties, ateliers : du bonheur pour les enfants et leurs parents.', "Toute l'année"],
    ['/assets/equipe.jpg', 'Une équipe', "Des bénévoles et des partenaires : la Ville de Harnes, Habitat Solidaire, Masny Info.", 'Bénévoles'],
    ['/assets/don.jpg', 'Soutien aux familles', 'Du matériel pour les tout-petits remis aux familles qui en ont besoin.', 'Solidarité'],
  ]
  return (
    <section className="hscroll" id="actions" data-pin data-hscroll>
      <div className="stage">
        <div className="track">
          <div className="panel intro">
            <span className="eyebrow">03 — Nos actions</span>
            <h2>Ce qu'on fait, concrètement.</h2>
            <p className="body">Faites défiler. Tout se passe sur le terrain.</p>
          </div>
          {items.map(([src, t, s, tag], i) => (
            <article className="panel card" key={t}>
              <div className="pic"><img src={src} alt="" /></div>
              <div className="meta"><span>{String(i + 1).padStart(2, '0')}</span><span>{tag}</span></div>
              <h3>{t}</h3>
              <p>{s}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Journee() {
  const steps: [string, string, string, string][] = [
    ['.05,.25', 'Rassembler', 'Les produits arrivent et sont triés.', 'Avant'],
    ['.3,.5', 'Cuisiner', 'La soupe maison se prépare.', 'Tôt'],
    ['.55,.75', 'Charger', 'Le camion prend la route.', 'Direction Masny'],
    ['.8,.98', 'Distribuer', 'Les familles viennent chercher leur panier.', '10 h – 12 h'],
  ]
  return (
    <section className="pin journee" data-pin>
      <div className="stage">
        <span className="eyebrow">04 — Un jour de distribution</span>
        <div className="timeline">
          <div className="rail"><i /></div>
          {steps.map(([r, t, s, h]) => (
            <div className="stop" key={t} data-range={r}>
              <span className="dot" />
              <span className="eyebrow">{h}</span>
              <h3>{t}</h3>
              <p>{s}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stat({ to, suffix = '', label }: { to: number; suffix?: string; label: string }) {
  const { ref, value } = useCountUp(to)
  return <div className="stat" data-reveal><b ref={ref}>{value}{suffix}</b><span>{label}</span></div>
}

function Chiffres() {
  return (
    <section className="chiffres">
      <Stat to={PANIER} suffix=" €" label="Le panier solidaire" />
      <Stat to={ADHESION} suffix=" €" label="L'adhésion annuelle" />
      <Stat to={2} label="Villes, Harnes & Masny" />
      <Stat to={100} suffix=" %" label="Bénévole" />
    </section>
  )
}

function Adhesion() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('form-name', 'adhesion')
    setState('sending')
    try {
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data as unknown as Record<string, string>).toString() })
      if (!res.ok) throw new Error(String(res.status))
      setState('ok')
      form.reset()
    } catch {
      setState('err')
    }
  }
  return (
    <section className="adhesion" id="adhesion">
      <div className="adh-copy" data-reveal>
        <span className="eyebrow">05 — Adhérer</span>
        <h2>Prenez votre place au marché.</h2>
        <p className="body">{ADHESION} € par an, à date anniversaire. La carte ouvre l'accès au marché solidaire, aux paniers à {PANIER} € et aux moments de partage.</p>
        <hr />
        <p className="note">Un don ouvre droit à une réduction d'impôt de 66 % : 30 € donnés ne coûtent que 10,20 €. Reçu fiscal remis.</p>
      </div>
      <form onSubmit={onSubmit} data-reveal style={delay(120)}>
        <p className="hp"><label>Ne pas remplir <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
        <div className="row2">
          <label>Prénom<input name="prenom" required autoComplete="given-name" /></label>
          <label>Nom<input name="nom" required autoComplete="family-name" /></label>
        </div>
        <div className="row2">
          <label>E-mail<input name="email" type="email" required autoComplete="email" /></label>
          <label>Téléphone<input name="telephone" type="tel" autoComplete="tel" /></label>
        </div>
        <div className="row2">
          <label>Ville
            <select name="ville" defaultValue="Harnes"><option>Harnes</option><option>Masny</option><option>Autre</option></select>
          </label>
          <label>Je souhaite
            <select name="souhait" defaultValue={`Adhérer (${ADHESION} €/an)`}>
              <option>Adhérer ({ADHESION} €/an)</option>
              <option>Réserver un panier solidaire</option>
              <option>Devenir bénévole</option>
              <option>Faire un don</option>
              <option>Proposer un partenariat</option>
              <option>Autre</option>
            </select>
          </label>
        </div>
        <label>Message<textarea name="message" rows={2} /></label>
        <button className="pill" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}</button>
        {state === 'ok' && <p className="msg" role="status">Merci ! Votre demande est bien reçue, nous vous recontactons très vite.</p>}
        {state === 'err' && <p className="msg" role="alert">L'envoi a échoué. Écrivez-nous à {EMAIL}.</p>}
        <p className="legal">Vos informations servent uniquement à gérer votre adhésion. Elles ne sont jamais transmises à des tiers.</p>
      </form>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="foot-top">
        <div>
          <span className="eyebrow">Contact</span>
          <p>64 rue Charles Debarge<br />62440 Harnes</p>
        </div>
        <div>
          <span className="eyebrow">Écrire</span>
          <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a><br /><a href="tel:+33645842215">{TEL}</a></p>
        </div>
        <div>
          <span className="eyebrow">Suivre</span>
          <p><a href={FACEBOOK} target="_blank" rel="noopener">Facebook</a></p>
        </div>
      </div>
      <p className="mega" data-reveal>Les Toqués du Cœur</p>
      <p className="credit">© {new Date().getFullYear()} Association loi 1901 d'intérêt général · <em>Photos : Les Toqués du Cœur</em></p>
    </footer>
  )
}

export default function App() {
  useMotion()
  return (
    <>
      <Nav />
      <p className="side-label" aria-hidden="true">Les Toqués du Cœur · Harnes · Masny</p>
      <main>
        <Hero />
        <Panier />
        <Marche />
        <Manifeste />
        <Actions />
        <Journee />
        <Chiffres />
        <Adhesion />
      </main>
      <Footer />
    </>
  )
}
