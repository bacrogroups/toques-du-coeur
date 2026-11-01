import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { useCountUp, useParallax, useReveal } from './reveal'

const FACEBOOK = 'https://www.facebook.com/profile.php?id=61570108281468'
const EMAIL = 'lestoquesducoeur@gmail.com'
const TEL = '06 45 84 22 15'
const ADHESION = 15
const PANIER = 5

// Photos d'illustration provisoires (Unsplash) — à remplacer par celles de l'association.
const u = (id: string, w = 1800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`
const PHOTOS = {
  hero: u('1488459716781-31db52582fe9', 2200),
  etal: u('1542838132-92c53300491e', 1400),
  benevoles: u('1593113598332-cd288d649433', 1400),
  partage: u('1532629345422-7515f3d16bb6', 1400),
  table: u('1498837167922-ddd27525d352', 1400),
  cuisine: u('1556910103-1c02745aae4d', 2200),
  brunch: u('1504754524776-8f4f37790ca0', 2200),
}

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

function Nav() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.75)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
  }, [open])
  const links = [
    ['#marche', 'Le marché'],
    ['#paniers', 'Les paniers'],
    ['#actions', 'Nos actions'],
    ['#asso', "L'association"],
    ['#contact', 'Contact'],
  ]
  return (
    <header className={'nav' + (solid || open ? ' solid' : '') + (open ? ' open' : '')}>
      <div className="wrap nav-in">
        <a className="brand" href="#top" aria-label="Les Toqués du Cœur – accueil" onClick={() => setOpen(false)}>
          <img src="/assets/logo.png" alt="Les Toqués du Cœur" />
        </a>
        <nav className="links" aria-label="Navigation principale">
          {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        </nav>
        <div className="nav-cta">
          <a className="btn ghost sm" href={FACEBOOK} target="_blank" rel="noopener">Facebook</a>
          <a className="btn butter sm" href="#adhesion" onClick={() => setOpen(false)}>Adhérer · {ADHESION} €/an</a>
        </div>
        <button className={'burger' + (open ? ' is-open' : '')} aria-expanded={open} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
      <div className="mobile">
        {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <a className="btn butter" href="#adhesion" onClick={() => setOpen(false)}>Adhérer · {ADHESION} €/an</a>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <img className="bg" src={PHOTOS.hero} alt="" />
      <div className="scrim" />
      <div className="wrap hero-in">
        <span className="tag light" data-reveal style={d(100)}>Harnes · Masny · 100 % bénévole</span>
        <h1 data-reveal style={d(250)}>
          <span>La cuisine</span>
          <span>au service de</span>
          <span>la <em>solidarité</em></span>
        </h1>
        <p className="lead" data-reveal style={d(450)}>
          Un marché solidaire, des paniers à {PANIER} € et des moments de partage pour les enfants malades,
          handicapés ou en situation de précarité, et leurs familles.
        </p>
        <div className="row" data-reveal style={d(600)}>
          <a className="btn butter lg" href="#adhesion">Je deviens adhérent</a>
          <a className="btn outline-light lg" href="#marche">Découvrir le marché</a>
        </div>
      </div>
      <div className="hero-foot wrap" data-reveal style={d(900)}>
        <span><b className="mono">{PANIER} €</b> le panier solidaire</span>
        <span><b className="mono">{ADHESION} €</b> l'adhésion annuelle</span>
        <span><b className="mono">2</b> villes, Harnes &amp; Masny</span>
        <a className="scroll-cue" href="#marche" aria-label="Défiler"><i /></a>
      </div>
    </section>
  )
}

function Marquee() {
  const items = ['Paniers solidaires', 'Marché solidaire', 'Moments de partage', 'Harnes & Masny', '100 % bénévole']
  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">
        {[0, 1].map((k) => (
          <span className="set" key={k}>
            {items.map((t) => <span key={t}>{t}<i>✶</i></span>)}
          </span>
        ))}
      </div>
    </div>
  )
}

function Ardoise() {
  const rows: [string, string, string][] = [
    ['Adhésion annuelle', 'une carte, une famille, un an jour pour jour', `${ADHESION} €`],
    ['Panier solidaire', 'fruits, légumes et produits frais de saison', `${PANIER} €`],
    ['Marché solidaire', 'produits à prix solidaire, pour les adhérents', 'adhérents'],
    ['Moments de partage', 'goûters, sorties, ateliers pour les enfants', 'offert'],
    ['Don à l’association', 'déductible des impôts à 66 %', 'libre'],
  ]
  return (
    <section className="section ink" id="marche">
      <div className="wrap ardoise-wrap">
        <div className="ardoise-copy" data-reveal>
          <span className="tag light">Le marché solidaire</span>
          <h2>L'ardoise du marché.</h2>
          <p className="lead">
            Les Toqués installent leur étal à Harnes et à Masny : des produits frais et de saison, à prix solidaire,
            pour les adhérents de l'association. Des prix clairs, des règles simples, et beaucoup de cœur dans chaque cagette.
          </p>
          <a className="btn butter" href="#adhesion">Je prends ma carte</a>
        </div>
        <div className="ardoise" data-reveal data-from="right">
          <div className="ardoise-head"><span className="mono">LES TOQUÉS DU CŒUR</span><span className="mono">HARNES · MASNY</span></div>
          <ul>
            {rows.map(([t, s, p], i) => (
              <li key={t} style={d(i * 80)}>
                <div><b>{t}</b><small>{s}</small></div>
                <i />
                <span className="mono price">{p}</span>
              </li>
            ))}
          </ul>
          <div className="ardoise-foot">Le samedi matin · réservé aux adhérents · réservation en ligne ou sur place</div>
          <span className="pin" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}

function Paniers() {
  return (
    <section className="section" id="paniers">
      <div className="wrap split">
        <figure className="photo" data-reveal>
          <img src={PHOTOS.etal} alt="Un étal de fruits et légumes frais" loading="lazy" />
          <figcaption className="sticker"><b>{PANIER} €</b><small>le panier</small></figcaption>
        </figure>
        <div className="copy" data-reveal data-from="right">
          <span className="tag">Les paniers solidaires</span>
          <h2>Le panier à {PANIER} €, le cœur de nos actions.</h2>
          <p className="lead">
            Un panier de produits frais et de saison, préparé le matin même par les bénévoles, à retirer lors
            des distributions du samedi. Une réservation par personne et par distribution.
          </p>
          <ul className="checks">
            <li>Fruits, légumes et produits de saison</li>
            <li>Distribution le samedi matin, à Harnes ou à Masny</li>
            <li>Réservé aux adhérents, sans dossier compliqué</li>
            <li>Pain et épicerie selon les arrivages</li>
          </ul>
          <div className="row">
            <a className="btn butter" href="#adhesion">Je réserve mon panier</a>
            <a className="btn ghost" href="#actions">Comment ça se passe</a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Band({ photo, children, id }: { photo: string; children: ReactNode; id?: string }) {
  return (
    <section className="band" id={id} data-parallax>
      <img className="bg" src={photo} alt="" loading="lazy" />
      <div className="scrim" />
      <div className="wrap band-in">{children}</div>
    </section>
  )
}

function Actions() {
  const items = [
    [PHOTOS.benevoles, 'Distributions de paniers', `Un samedi matin par ville : chaque famille inscrite repart avec sa cagette à ${PANIER} €, remise par les bénévoles.`, 'Harnes · Masny'],
    [PHOTOS.etal, 'Marché solidaire', 'Un étal de produits frais à prix solidaire pour les adhérents, avec un café et le temps de discuter.', 'Régulier'],
    [PHOTOS.partage, 'Moments de partage', 'Goûters, sorties, ateliers cuisine : des moments de bonheur pour les enfants et leurs parents.', "Toute l'année"],
    [PHOTOS.table, 'Repas & collectes', 'On cuisine, on collecte dons et denrées auprès des commerçants et partenaires, on redistribue.', 'Selon les besoins'],
  ]
  return (
    <section className="section" id="actions">
      <div className="wrap">
        <div className="sec-head" data-reveal>
          <span className="tag">Nos actions</span>
          <h2>Ce qu'on fait, concrètement.</h2>
        </div>
        <div className="actions">
          {items.map(([img, title, text, where], i) => (
            <article className="action" key={title} data-reveal style={d(i * 100)}>
              <div className="action-img"><img src={img} alt="" loading="lazy" /><span className="mono where">{where}</span></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div className="day" data-reveal>
          <div className="day-head">
            <span className="tag">Un samedi avec les Toqués</span>
            <h3>Heure par heure.</h3>
          </div>
          <ol className="hours">
            <li><span className="t mono">8h</span><b>On collecte</b><p>Dons, denrées et produits frais arrivent. Les bénévoles trient.</p></li>
            <li><span className="t mono">9h</span><b>On prépare</b><p>Les paniers se remplissent dans la bonne humeur.</p></li>
            <li><span className="t mono">10h</span><b>On distribue</b><p>Chaque famille inscrite repart avec son panier.</p></li>
            <li><span className="t mono">14h</span><b>On partage</b><p>Goûter, atelier ou sortie : un moment pour les enfants.</p></li>
          </ol>
        </div>
      </div>
    </section>
  )
}

function Stat({ to, suffix = '', label }: { to: number; suffix?: string; label: string }) {
  const { ref, value } = useCountUp(to)
  return (
    <div className="stat" data-reveal>
      <b ref={ref}>{value}{suffix}</b>
      <span>{label}</span>
    </div>
  )
}

function Asso() {
  const publics = [
    ['Enfants malades', 'Un moment de répit et de joie pour eux et leurs parents.'],
    ['Enfants en situation de handicap', 'Des activités adaptées, pensées pour que chacun ait sa place.'],
    ['Familles en précarité', `Des paniers à ${PANIER} € et un soutien concret, sans jugement.`],
  ]
  return (
    <section className="section" id="asso">
      <div className="wrap">
        <div className="stats">
          <Stat to={209} label="adhérents & amis" />
          <Stat to={2} label="villes : Harnes & Masny" />
          <Stat to={3} label="partenaires locaux" />
          <Stat to={66} suffix=" %" label="de votre don déductible" />
        </div>
        <div className="split asso">
          <div className="copy" data-reveal>
            <span className="tag">L'association</span>
            <h2>Une asso, deux villes, les enfants au centre.</h2>
            <p className="lead">
              Association loi 1901 d'intérêt général, créée fin 2024 et présidée par Vincent Bacro. Elle est animée
              uniquement par des bénévoles. Siège à Harnes, actions à Harnes et à Masny, avec la Ville de Harnes,
              Habitat Solidaire et Masny Info.
            </p>
            <ul className="publics">
              {publics.map(([t, s], i) => (
                <li key={t} data-reveal style={d(i * 100)}><b>{t}</b><span>{s}</span></li>
              ))}
            </ul>
          </div>
          <figure className="photo tilt" data-reveal data-from="right">
            <img src="/assets/couverture.jpg" alt="La cuisine au service de la solidarité" loading="lazy" />
          </figure>
        </div>
      </div>
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
    <section className="section" id="adhesion">
      <div className="wrap">
        <div className="sec-head center" data-reveal>
          <span className="tag">Adhérer ou aider</span>
          <h2>Prenez votre place au marché.</h2>
          <p className="lead">
            L'adhésion coûte {ADHESION} € par an, à date anniversaire. Elle ouvre l'accès au marché solidaire, aux paniers
            à {PANIER} € et aux moments de partage. Laissez-nous vos coordonnées : on vous rappelle pour finaliser.
          </p>
        </div>
        <div className="adh">
          <form className="card form" onSubmit={onSubmit} data-reveal name="adhesion" method="POST" data-netlify="true">
            <input type="hidden" name="form-name" value="adhesion" />
            <p className="hp"><label>Ne pas remplir <input name="bot-field" /></label></p>
            <div className="grid2">
              <label>Prénom *<input name="prenom" required autoComplete="given-name" /></label>
              <label>Nom *<input name="nom" required autoComplete="family-name" /></label>
            </div>
            <div className="grid2">
              <label>E-mail *<input name="email" type="email" required autoComplete="email" /></label>
              <label>Téléphone<input name="telephone" type="tel" autoComplete="tel" /></label>
            </div>
            <div className="grid2">
              <label>Je participe plutôt à
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
            <label>Un mot pour nous (facultatif)<textarea name="message" rows={3} /></label>
            <button className="btn butter lg" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}
            </button>
            {state === 'ok' && <p className="msg ok">Merci ! Votre demande est bien reçue. Nous vous recontactons très vite.</p>}
            {state === 'err' && <p className="msg err">L'envoi a échoué. Écrivez-nous directement à {EMAIL}.</p>}
            <p className="small">Vos informations servent uniquement à gérer votre adhésion. Elles ne sont jamais transmises à des tiers.</p>
          </form>

          <div className="plans">
            <article className="card plan featured" data-reveal data-from="right">
              <span className="tag dark">Adhésion annuelle</span>
              <div className="big"><span className="mono">{ADHESION} €</span><small>/ an · à date anniversaire</small></div>
              <ul className="checks">
                <li>Carte d'adhérent</li>
                <li>Accès au marché solidaire</li>
                <li>Paniers solidaires à {PANIER} €</li>
                <li>Invitations aux moments de partage</li>
              </ul>
              <p className="small">Règlement en espèces, chèque ou virement, lors de votre premier passage.</p>
            </article>
            <article className="card plan" data-reveal data-from="right" style={d(120)}>
              <span className="tag">Bénévole</span>
              <div className="big"><span className="mono">Gratuit</span><small>un samedi de temps en temps</small></div>
              <ul className="checks">
                <li>Préparer les paniers</li>
                <li>Collecter dons et denrées</li>
                <li>Distribuer et accueillir les familles</li>
                <li>Animer les moments de partage</li>
              </ul>
            </article>
            <article className="card plan don" data-reveal data-from="right" style={d(240)}>
              <span className="tag">Don</span>
              <p>Association d'intérêt général : chaque don ouvre droit à une réduction d'impôt de 66 % (art. 200 et 238 bis du CGI). Reçu fiscal remis.</p>
              <div className="don-ex mono"><span>30 € donnés</span><span>→</span><span>10,20 € réels</span></div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="wrap contact-in">
        <div data-reveal>
          <span className="tag">Contact</span>
          <h2>On se retrouve au marché ?</h2>
          <p className="lead">Une question, un don, une envie d'aider ? Écrivez-nous, appelez-nous, ou suivez nos distributions sur Facebook.</p>
        </div>
        <dl className="infos" data-reveal data-from="right">
          <dt>Siège</dt><dd>64 rue Charles Debarge<br />62440 Harnes</dd>
          <dt>Actions</dt><dd>Harnes et Masny</dd>
          <dt>Téléphone</dt><dd><a href="tel:+33645842215">{TEL}</a></dd>
          <dt>E-mail</dt><dd><a href={`mailto:${EMAIL}`}>{EMAIL}</a></dd>
          <dt>Réseaux</dt><dd><a href={FACEBOOK} target="_blank" rel="noopener">Facebook – Les Toqués du Cœur</a></dd>
        </dl>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap foot-in">
        <div>
          <span className="brand-box"><img src="/assets/logo.png" alt="Les Toqués du Cœur" /></span>
          <p>Association loi 1901 d'intérêt général, présente à Harnes et à Masny.<br />La cuisine au service de la solidarité.</p>
        </div>
        <div>
          <h4>Le site</h4>
          <ul>
            <li><a href="#marche">Le marché solidaire</a></li>
            <li><a href="#paniers">Les paniers</a></li>
            <li><a href="#actions">Nos actions</a></li>
            <li><a href="#asso">L'association</a></li>
            <li><a href="#adhesion">Adhérer</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <p>64 rue Charles Debarge<br />62440 Harnes<br /><a href={`mailto:${EMAIL}`}>{EMAIL}</a><br /><a href="tel:+33645842215">{TEL}</a></p>
          <p><a className="fb" href={FACEBOOK} target="_blank" rel="noopener">Suivre sur Facebook →</a></p>
        </div>
      </div>
      <div className="wrap legal">
        <span>© {new Date().getFullYear()} Les Toqués du Cœur · Harnes &amp; Masny</span>
        <span>Photos d'illustration : Unsplash</span>
      </div>
    </footer>
  )
}

export default function App() {
  useReveal()
  useParallax()
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Ardoise />
        <Paniers />
        <Band photo={PHOTOS.cuisine}>
          <blockquote data-reveal>
            <p>« On cuisine, on distribue, on partage. Et chaque samedi, des enfants repartent avec le sourire. »</p>
            <cite>Les bénévoles des Toqués du Cœur</cite>
          </blockquote>
        </Band>
        <Actions />
        <Asso />
        <Band photo={PHOTOS.brunch}>
          <div className="band-cta" data-reveal>
            <h2>Un don, et la cagette se remplit.</h2>
            <p>30 € donnés ne vous coûtent que 10,20 € après réduction d'impôt.</p>
            <div className="row center"><a className="btn butter lg" href="#adhesion">Faire un don</a><a className="btn outline-light lg" href="#adhesion">Devenir bénévole</a></div>
          </div>
        </Band>
        <Adhesion />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
