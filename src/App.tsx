import { useState, type CSSProperties, type FormEvent } from 'react'
import { useCountUp, useMotion, usePointerParallax } from './motion'
import { BasketScene, MarketScene, SharedDefs } from './scenes'

const FACEBOOK = 'https://www.facebook.com/profile.php?id=61570108281468'
const FICHE = 'https://drive.google.com/file/d/1PcrtDJr3N4-zxwTk8ZckMq1g6i3U-E1y/view'
const EMAIL = 'lestoquesducoeur@gmail.com'
const TEL = '06 45 84 22 15'
const ADHESION = 15
const PANIER = 5

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top" aria-label="Les Toqués du Cœur – accueil">
        <img src="/assets/logo.png" alt="Les Toqués du Cœur" />
      </a>
      <nav aria-label="Navigation principale">
        <a href="#panier">Le panier</a>
        <a href="#marche">Le marché</a>
        <a className="opt" href="#actions">Nos actions</a>
        <a className="pill sm" href="#adhesion">Adhérer</a>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top" data-pin>
      <div className="stage">
        <div className="hero-copy">
          <span className="eyebrow">Harnes &amp; Masny · Cuisiner, partager, soutenir</span>
          <h1>La cuisine au service de la <em>solidarité</em></h1>
          <p className="body">
            Notre association a pour vocation d'améliorer la qualité de vie des enfants malades, handicapés et
            en situation de précarité. Des moments de partage et de bonheur pour ces enfants et leurs familles,
            ainsi qu'une aide concrète pour les adultes qui en ont besoin.
          </p>
          <div className="row">
            <a className="pill" href="#adhesion">Je deviens adhérent</a>
            <a className="pill soft" href="#panier">Découvrir le panier</a>
          </div>
          <p className="partners">Avec Habitat Solidaire, Masny Info, le CCAS de Harnes, la Ville de Masny et le Secours populaire.</p>
        </div>
        <div className="hero-art">
          <div className="hero-photo"><img src="/assets/paniers.jpg" alt="Des barquettes de tomates et des cagettes prêtes pour la distribution" /></div>
          <span className="badge one"><span><b>{PANIER} €</b>le panier</span></span>
          <span className="badge two"><span><b>2</b>villes</span></span>
        </div>
      </div>
    </section>
  )
}

function Panier() {
  const ref = usePointerParallax<HTMLDivElement>()
  const rows: [string, string][] = [
    ['.1,.2', 'Des pommes de terre'],
    ['.18,.28', 'Des carottes'],
    ['.26,.36', 'Du lait'],
    ['.34,.44', 'Des conserves'],
    ['.42,.52', 'Des légumes'],
    ['.5,.6', 'Un chou-fleur'],
    ['.58,.68', 'Des fruits'],
  ]
  return (
    <section className="pin panier" id="panier" data-pin>
      <div className="stage trio">
        <div className="left">
          <span className="eyebrow">Le panier solidaire</span>
          <h2>Un panier à {PANIER} €, une aide concrète.</h2>
        </div>
        <div className="center" ref={ref}><BasketScene /></div>
        <div className="right">
          <p className="list-title">Exemple de panier</p>
          <ul className="fill-list">
            {rows.map(([r, label]) => <li key={label} data-range={r}><i className="tick"><span>✓</span></i>{label}</li>)}
          </ul>
          <p className="body final" data-range=".78,.9"><strong>Le contenu varie selon les dons et les arrivages.</strong> Un panier par foyer et par semaine, sur réservation, adhérents en priorité. Dates annoncées sur <a href={FACEBOOK} target="_blank" rel="noopener">notre page Facebook</a>.</p>
        </div>
      </div>
    </section>
  )
}

function Marche() {
  const ref = usePointerParallax<HTMLDivElement>()
  const steps: [string, string, string, string][] = [
    ['0,.38', 'Étape 1', 'Le marché s\'installe', 'Le temps d\'une matinée, on déballe un petit marché solidaire, à côté des paniers.'],
    ['.34,.68', 'Étape 2', 'Plus de produits', 'Bien plus de choix que dans le panier, selon les dons et les arrivages.'],
    ['.64,1', 'Étape 3', 'À tout petits prix', 'Chacun choisit ce qu\'il lui faut, à très bas prix, pour compléter son panier.'],
  ]
  return (
    <section className="pin marche" id="marche" data-pin>
      <div className="stage duo">
        <div className="left">
          <span className="eyebrow green">Le marché solidaire</span>
          <h2>Plus de produits, à tout petits prix.</h2>
          <div className="steps">
            {steps.map(([r, n, t, s], i) => (
              <div key={n} className={'step' + (i === steps.length - 1 ? ' hold' : '')} data-range={r}>
                <b>{n}</b>
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
  const text = "Derrière chaque panier, il y a de la préparation, de l'entraide et l'envie d'apporter un coup de pouce concret. C'est ça, Les Toqués du Cœur : partager et garder l'humain au centre de nos actions."
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
    ['/assets/distribution.jpg', 'Paniers solidaires', `Des paniers à ${PANIER} € pour les personnes dans le besoin : familles, personnes seules, étudiants, retraités.`, 'Masny'],
    ['/assets/marche.jpg', 'Collecte et dons alimentaires', 'Lutter contre le gaspillage et redistribuer : colis pour les tout-petits avec le CCAS de Harnes, Restos du Cœur de Masny.', 'Anti-gaspi'],
    ['/assets/cuisine.jpg', 'Ateliers cuisine', "Mettre les tabliers et cuisiner ensemble, puis passer à table : Semaine Bleue aux Galibots, Secours populaire de Lille.", 'Partage'],
    ['/assets/repas.jpg', 'Repas et événements solidaires', 'Dîner de la Saint-Valentin avec le Secours populaire, barbecue des quartiers d\'été, gourmandises pour le Solid\'Events.', 'Convivialité'],
  ]
  return (
    <section className="hscroll" id="actions" data-pin data-hscroll>
      <div className="stage">
        <div className="track">
          <div className="panel intro">
            <span className="eyebrow sun">Nos actions</span>
            <h2>Quatre actions, une même volonté.</h2>
            <p className="body">Soutenir les enfants malades, en situation de handicap ou de précarité et leurs familles, ainsi que les adultes qui en ont besoin.</p>
          </div>
          {items.map(([src, t, s, tag]) => (
            <article className="panel card" key={t}>
              <div className="pic"><img src={src} alt="" /><span className="eyebrow">{tag}</span></div>
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
    ['.05,.25', 'Rassembler', 'Les produits sont rassemblés et les paniers prennent forme.', "D'abord"],
    ['.3,.5', 'Cuisiner', 'La soupe maison mijote, à déguster ensemble sur place.', 'Ensuite'],
    ['.55,.75', 'Charger', 'Le camion est chargé, toute l\'équipe est mobilisée.', 'Direction Masny'],
    ['.8,.98', 'Distribuer', 'Pensez à votre sac : les cagettes restent sur place.', 'Le plus souvent, 10 h – 12 h'],
  ]
  return (
    <section className="pin journee" data-pin>
      <div className="stage">
        <div>
          <span className="eyebrow green">Un jour de distribution</span>
        </div>
        <div className="timeline">
          <div className="rail"><i /></div>
          {steps.map(([r, t, s, h]) => (
            <div className="stop" key={t} data-range={r}>
              <span className="dot" />
              <small>{h}</small>
              <h3>{t}</h3>
              <p>{s}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stat({ to, suffix = '', label, d }: { to: number; suffix?: string; label: string; d: number }) {
  const { ref, value } = useCountUp(to)
  return <div className="stat" data-reveal style={delay(d)}><b ref={ref}>{value}{suffix}</b><span>{label}</span></div>
}

function Chiffres() {
  return (
    <section className="chiffres">
      <Stat d={0} to={PANIER} suffix=" €" label="le panier solidaire" />
      <Stat d={80} to={ADHESION} suffix=" €" label="l'adhésion, par an et par foyer" />
      <Stat d={160} to={140} label="personnes environ au dîner solidaire de la Saint-Valentin" />
      <Stat d={240} to={250} label="sapins à 1 € distribués pour Noël, avec Habitat Solidaire" />
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
        <span className="eyebrow">Adhérer</span>
        <h2>Rejoignez l'aventure.</h2>
        <p className="body">Pour les paniers solidaires, remplissez la <a href={FICHE} target="_blank" rel="noopener">fiche de renseignements</a> et remettez-la-nous lors d'une distribution ou en message privé. Chaque demande est étudiée avec discrétion et bienveillance.</p>
        <p className="body">Une fois votre demande validée, l'adhésion est de {ADHESION} € par an et par foyer, avec une carte d'adhérent. Chaque panier retiré coûte ensuite {PANIER} €.</p>
        <p className="note">Un don ouvre droit à une réduction d'impôt de 66 % : 30 € donnés ne coûtent que 10,20 €. Reçu fiscal remis.</p>
        <p className="note">Une fête, une kermesse ? Louez nos tables et bancs en bois : 100 % des bénéfices financent nos actions.</p>
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
              <option>Louer des tables et bancs</option>
              <option>Proposer un partenariat</option>
              <option>Autre</option>
            </select>
          </label>
        </div>
        <label>Un mot pour nous<textarea name="message" rows={3} /></label>
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
        <div><b>Nous trouver</b><p>64 rue Charles Debarge<br />62440 Harnes</p><p>Paniers à Masny : 49C rue de la Fabrique, cour des Galibots, chez Habitat Solidaire</p></div>
        <div><b>Nous écrire</b><p><a href={`mailto:${EMAIL}`}>{EMAIL}</a><br /><a href="tel:+33645842215">{TEL}</a></p></div>
        <div><b>Nous suivre</b><p><a href={FACEBOOK} target="_blank" rel="noopener">Facebook</a></p></div>
      </div>
      <p className="mega" data-reveal>Les Toqués du Cœur</p>
      <p className="credit">© {new Date().getFullYear()} Association loi 1901 d'intérêt général · Photos : Les Toqués du Cœur · Site créé par Studio Instinct</p>
    </footer>
  )
}

export default function App() {
  useMotion()
  return (
    <>
      <SharedDefs />
      <Nav />
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
