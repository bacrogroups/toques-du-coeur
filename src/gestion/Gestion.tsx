import { useEffect, useState, type ReactNode } from 'react'
import { Connexion, NouveauMotDePasse, useSession } from '../adherent/Connexion'
import { supabase } from '../adherent/supabase'
import type { Role } from './outils'
import Tableau from './Tableau'
import Adherents from './Adherents'
import Demandes from './Demandes'
import Distributions from './Distributions'
import Collectivites from './Collectivites'
import Planning from './Planning'
import Messages from './Messages'
import Statistiques from './Statistiques'
import Equipe from './Equipe'
import '../adherent/espace.css'
import './gestion.css'

export type Page = 'tableau' | 'demandes' | 'adherents' | 'distributions' | 'collectivites' | 'planning' | 'messages' | 'statistiques' | 'equipe'

const PAGES: { id: Page; label: string; icone: string; admin?: boolean }[] = [
  { id: 'tableau', label: 'Tableau de bord', icone: '🏠' },
  { id: 'demandes', label: 'Demandes', icone: '📥' },
  { id: 'adherents', label: 'Adhérents', icone: '👥' },
  { id: 'distributions', label: 'Distributions', icone: '🧺' },
  { id: 'collectivites', label: 'Collectivités', icone: '🏛️' },
  { id: 'planning', label: 'Planning', icone: '📅' },
  { id: 'messages', label: 'Messages', icone: '✉️', admin: true },
  { id: 'statistiques', label: 'Statistiques', icone: '📊' },
  { id: 'equipe', label: 'Équipe', icone: '🔑', admin: true },
]

export default function Gestion() {
  const { session, reinitialisation, finReinitialisation } = useSession()
  const [role, setRole] = useState<Role | null | undefined>(undefined)
  useEffect(() => { document.title = 'Gestion · Les Toqués du Cœur' }, [])
  useEffect(() => {
    if (!session) { setRole(undefined); return }
    void (async () => {
      const [{ data: equipe }, { data: admin }] = await Promise.all([supabase.rpc('est_equipe'), supabase.rpc('est_admin')])
      setRole(admin ? 'admin' : equipe ? 'benevole' : null)
    })()
  }, [session])

  let contenu: ReactNode
  if (session === undefined || (session && role === undefined && !reinitialisation)) contenu = <main className="esp-main"><p className="esp-wait" role="status">Chargement…</p></main>
  else if (session && reinitialisation) contenu = <NouveauMotDePasse espace="Espace gestion" onDone={finReinitialisation} />
  else if (!session) contenu = <Connexion espace="Espace gestion" />
  else if (!role) contenu = (
    <main className="esp-main">
      <section className="esp-card">
        <span className="eyebrow">Espace gestion</span>
        <h1>Accès réservé à l'équipe</h1>
        <p>Votre compte n'a pas encore accès à la gestion. Demandez à un membre du bureau de vous ajouter dans l'équipe.</p>
        <a className="esp-btn" href="/adherent">Aller à mon espace adhérent</a>
        <button className="esp-btn soft" onClick={() => supabase.auth.signOut()}>Me déconnecter</button>
      </section>
    </main>
  )
  else return <Interface role={role} email={session.user.email ?? ''} userId={session.user.id} />

  return (
    <div className="esp">
      <header className="esp-top">
        <a href="/" aria-label="Retour au site"><img src="/assets/logo.png" alt="Les Toqués du Cœur" /></a>
        <span>Gestion</span>
      </header>
      {contenu}
    </div>
  )
}

function pageDepuisUrl(): Page {
  const h = window.location.hash.slice(1) as Page
  return PAGES.some((p) => p.id === h) ? h : 'tableau'
}

function Interface({ role, email, userId }: { role: Role; email: string; userId: string }) {
  const [page, setPage] = useState<Page>(pageDepuisUrl)
  useEffect(() => {
    const ecoute = () => setPage(pageDepuisUrl())
    window.addEventListener('hashchange', ecoute)
    return () => window.removeEventListener('hashchange', ecoute)
  }, [])
  const aller = (p: Page) => { window.location.hash = p; window.scrollTo(0, 0) }
  const visibles = PAGES.filter((p) => !p.admin || role === 'admin')
  const p = visibles.some((x) => x.id === page) ? page : 'tableau'
  const [nouvelles, setNouvelles] = useState(0)
  useEffect(() => {
    void supabase.from('demandes').select('id', { count: 'exact', head: true }).eq('statut', 'nouvelle').then(({ count }) => setNouvelles(count ?? 0))
  }, [page])

  return (
    <div className="ges">
      <aside className="ges-side">
        <a href="/" className="ges-logo" aria-label="Retour au site"><img src="/assets/logo.png" alt="Les Toqués du Cœur" /></a>
        <nav aria-label="Gestion">
          {visibles.map((x) => (
            <a key={x.id} href={'#' + x.id} aria-current={p === x.id ? 'page' : undefined}><span aria-hidden="true">{x.icone}</span>{x.label}{x.id === 'demandes' && nouvelles > 0 && <b className="ges-count" aria-label={`${nouvelles} nouvelles`}>{nouvelles}</b>}</a>
          ))}
        </nav>
        <div className="ges-me">
          <span>{email}</span>
          <b>{role === 'admin' ? 'Bureau' : 'Bénévole'}</b>
          <a href="/adherent">Mon espace adhérent</a>
          <button onClick={() => supabase.auth.signOut()}>Me déconnecter</button>
        </div>
      </aside>
      <main className="ges-main">
        {p === 'tableau' && <Tableau role={role} aller={aller} />}
        {p === 'demandes' && <Demandes role={role} />}
        {p === 'adherents' && <Adherents role={role} />}
        {p === 'distributions' && <Distributions role={role} />}
        {p === 'collectivites' && <Collectivites role={role} />}
        {p === 'planning' && <Planning role={role} userId={userId} />}
        {p === 'messages' && <Messages />}
        {p === 'statistiques' && <Statistiques />}
        {p === 'equipe' && <Equipe userId={userId} />}
      </main>
    </div>
  )
}
