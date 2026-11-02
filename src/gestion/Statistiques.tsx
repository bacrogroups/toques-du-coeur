import { useEffect, useMemo, useState } from 'react'
import { aujourdhui, dateCourte, message, supabase, type Foyer } from '../adherent/supabase'
import { etatAdhesion, telechargerCsv } from './outils'

type Retrait = { foyer_id: string; evenements: { jour: string }; foyers: { nb_personnes: number; ville: string | null } }
type Periode = 'annee' | 'precedente' | 'douze' | 'libre'

function bornes(p: Periode, libre: [string, string]): [string, string] {
  const an = new Date().getFullYear()
  if (p === 'annee') return [`${an}-01-01`, `${an}-12-31`]
  if (p === 'precedente') return [`${an - 1}-01-01`, `${an - 1}-12-31`]
  if (p === 'douze') {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1); d.setDate(d.getDate() + 1)
    return [d.toISOString().slice(0, 10), aujourdhui()]
  }
  return libre
}

const MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

export default function Statistiques() {
  const [periode, setPeriode] = useState<Periode>('annee')
  const [libre, setLibre] = useState<[string, string]>([`${new Date().getFullYear()}-01-01`, aujourdhui()])
  const [retraits, setRetraits] = useState<Retrait[] | null>(null)
  const [distributions, setDistributions] = useState<string[]>([])
  const [foyers, setFoyers] = useState<Foyer[]>([])
  const [erreur, setErreur] = useState('')
  const [debut, fin] = bornes(periode, libre)

  useEffect(() => {
    setRetraits(null)
    void (async () => {
      const [{ data: rs, error }, { data: es }, { data: fs }] = await Promise.all([
        supabase.from('reservations').select('foyer_id, evenements!inner(jour), foyers(nb_personnes, ville)').eq('statut', 'retiree').gte('evenements.jour', debut).lte('evenements.jour', fin),
        supabase.from('evenements').select('jour').eq('type', 'distribution').gte('jour', debut).lte('jour', fin).lte('jour', aujourdhui()),
        supabase.from('foyers').select('*'),
      ])
      if (error) setErreur(message(error))
      setRetraits((rs ?? []) as unknown as Retrait[])
      setDistributions((es ?? []).map((e) => e.jour as string))
      setFoyers((fs ?? []) as Foyer[])
    })()
  }, [debut, fin])

  const s = useMemo(() => {
    const r = retraits ?? []
    const aides = new Map<string, Retrait['foyers']>()
    r.forEach((x) => aides.set(x.foyer_id, x.foyers))
    const personnes = [...aides.values()].reduce((n, f) => n + (f?.nb_personnes ?? 0), 0)
    const villes = new Map<string, number>()
    aides.forEach((f) => villes.set(f?.ville || 'Non précisée', (villes.get(f?.ville || 'Non précisée') ?? 0) + 1))
    const mois = new Map<string, { distributions: number; paniers: number; foyers: Set<string> }>()
    const m = (jour: string) => {
      const k = jour.slice(0, 7)
      if (!mois.has(k)) mois.set(k, { distributions: 0, paniers: 0, foyers: new Set() })
      return mois.get(k)!
    }
    distributions.forEach((j) => m(j).distributions++)
    r.forEach((x) => { const v = m(x.evenements.jour); v.paniers++; v.foyers.add(x.foyer_id) })
    return {
      paniers: r.length,
      foyers: aides.size,
      personnes,
      distributions: distributions.length,
      moyenne: distributions.length ? Math.round(r.length / distributions.length) : 0,
      nouveaux: foyers.filter((f) => f.created_at.slice(0, 10) >= debut && f.created_at.slice(0, 10) <= fin).length,
      actifs: foyers.filter((f) => ['active', 'bientot'].includes(etatAdhesion(f))).length,
      villes: [...villes.entries()].sort((a, b) => b[1] - a[1]),
      mois: [...mois.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    }
  }, [retraits, distributions, foyers, debut, fin])

  function exporter() {
    telechargerCsv(`statistiques-${debut}-${fin}.csv`, [
      ['Période', `du ${dateCourte(debut)} au ${dateCourte(fin)}`],
      ['Paniers distribués', s.paniers],
      ['Foyers aidés', s.foyers],
      ['Personnes concernées', s.personnes],
      ['Distributions organisées', s.distributions],
      ['Paniers par distribution (moyenne)', s.moyenne],
      ['Nouveaux adhérents', s.nouveaux],
      ['Adhésions actives aujourd\'hui', s.actifs],
      [],
      ['Mois', 'Distributions', 'Paniers', 'Foyers aidés'],
      ...s.mois.map(([k, v]) => [MOIS.format(new Date(k + '-15')), v.distributions, v.paniers, v.foyers.size]),
      [],
      ['Ville', 'Foyers aidés'],
      ...s.villes,
    ])
  }

  const periodes: [Periode, string][] = [['annee', 'Cette année'], ['precedente', 'L\'an dernier'], ['douze', '12 derniers mois'], ['libre', 'Autre période']]

  return (
    <>
      <div className="ges-head">
        <h1>Statistiques</h1>
        <button className="ges-btn soft" onClick={exporter} disabled={!retraits}>Exporter pour Excel</button>
      </div>
      {erreur && <p className="esp-err" role="alert">{erreur}</p>}
      <div className="ges-chips" role="group" aria-label="Période">
        {periodes.map(([id, l]) => <button key={id} aria-pressed={periode === id} onClick={() => setPeriode(id)}>{l}</button>)}
      </div>
      {periode === 'libre' && (
        <div className="ges-row">
          <label className="ges-inline">Du<input type="date" value={libre[0]} onChange={(e) => setLibre([e.target.value, libre[1]])} /></label>
          <label className="ges-inline">au<input type="date" value={libre[1]} onChange={(e) => setLibre([libre[0], e.target.value])} /></label>
        </div>
      )}
      <p className="esp-small">Du {dateCourte(debut)} au {dateCourte(fin)}. Seuls les paniers pointés comme retirés sont comptés.</p>

      {retraits === null ? <p className="esp-wait">Calcul…</p> : (
        <>
          <div className="ges-kpis stats">
            <div><b>{s.paniers}</b><span>paniers distribués</span></div>
            <div><b>{s.foyers}</b><span>foyers aidés</span></div>
            <div><b>{s.personnes}</b><span>personnes concernées</span></div>
            <div><b>{s.distributions}</b><span>distributions organisées</span></div>
            <div><b>{s.moyenne}</b><span>paniers par distribution</span></div>
            <div><b>{s.nouveaux}</b><span>nouveaux adhérents</span></div>
          </div>

          <div className="ges-grid">
            <section className="ges-card">
              <h2>Mois par mois</h2>
              {s.mois.length === 0 ? <p className="esp-small">Pas encore de données sur cette période.</p> : (
                <table className="ges-table compact">
                  <thead><tr><th>Mois</th><th className="r">Distrib.</th><th className="r">Paniers</th><th className="r">Foyers</th></tr></thead>
                  <tbody>
                    {s.mois.map(([k, v]) => (
                      <tr key={k}><td className="cap">{MOIS.format(new Date(k + '-15'))}</td><td className="r">{v.distributions}</td><td className="r">{v.paniers}</td><td className="r">{v.foyers.size}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="ges-card">
              <h2>Foyers aidés par ville</h2>
              {s.villes.length === 0 ? <p className="esp-small">Pas encore de données sur cette période.</p> : (
                <table className="ges-table compact">
                  <tbody>{s.villes.map(([v, n]) => <tr key={v}><td>{v}</td><td className="r">{n}</td></tr>)}</tbody>
                </table>
              )}
              <p className="esp-small">{s.actifs} adhésions actives aujourd'hui.</p>
            </section>
          </div>
        </>
      )}
    </>
  )
}
