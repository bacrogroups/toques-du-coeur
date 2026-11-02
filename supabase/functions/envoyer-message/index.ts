// Envoie un message groupé par e-mail et/ou SMS (Brevo), à la demande d'un membre du bureau.
// Appelé depuis l'espace gestion avec le jeton de la personne connectée.
// Secrets : BREVO_API_KEY, EXPEDITEUR_EMAIL.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const BREVO = 'https://api.brevo.com/v3'
const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors })

function telephoneInternational(tel: string): string | null {
  const chiffres = tel.replace(/[^\d+]/g, '')
  if (/^0[67]\d{8}$/.test(chiffres)) return '33' + chiffres.slice(1)
  if (/^\+33[67]\d{8}$/.test(chiffres)) return chiffres.slice(1)
  return null
}

async function brevo(path: string, body: unknown) {
  const res = await fetch(BREVO + path, {
    method: 'POST',
    headers: { 'api-key': Deno.env.get('BREVO_API_KEY')!, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Brevo ${res.status} : ${await res.text()}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const url = Deno.env.get('SUPABASE_URL')!
  const moi = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: admin } = await moi.rpc('est_admin')
  if (admin !== true) return json({ erreur: 'Réservé au bureau.' }, 403)
  if (!Deno.env.get('BREVO_API_KEY')) {
    return json({ erreur: 'L\'envoi par e-mail ou SMS n\'est pas encore configuré (clé Brevo manquante). Le message reste visible dans l\'espace adhérent.' }, 400)
  }

  const { id } = await req.json()
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: m, error } = await db.from('messages').select('*').eq('id', id).single()
  if (error || !m) return json({ erreur: 'Message introuvable.' }, 404)
  if (m.envoye_at) return json({ erreur: 'Ce message a déjà été envoyé.' }, 409)

  let q = db.from('foyers').select('id, prenom, email, telephone, statut, adhesion_fin')
  if (m.cible === 'actifs') q = q.eq('statut', 'actif').gte('adhesion_fin', new Date().toISOString().slice(0, 10))
  if (m.cible === 'evenement') {
    const { data: rs } = await db.from('reservations').select('foyer_id').eq('evenement_id', m.evenement_id).neq('statut', 'annulee')
    q = q.in('id', (rs ?? []).map((r) => r.foyer_id))
  }
  const { data: foyers } = await q

  let envois = 0
  const erreurs: string[] = []
  for (const f of foyers ?? []) {
    try {
      if (m.par_email && f.email) {
        await brevo('/smtp/email', {
          sender: { name: 'Les Toqués du Cœur', email: Deno.env.get('EXPEDITEUR_EMAIL') ?? 'lestoquesducoeur@gmail.com' },
          to: [{ email: f.email, name: f.prenom }],
          subject: m.titre,
          textContent: `Bonjour ${f.prenom},\n\n${m.texte}\n\nLes Toqués du Cœur`,
        })
        envois++
      }
      const tel = m.par_sms && f.telephone ? telephoneInternational(f.telephone) : null
      if (tel) {
        await brevo('/transactionalSMS/sms', { sender: 'ToquesCoeur', recipient: tel, content: `${m.titre} : ${m.texte}`.slice(0, 320), type: 'transactional' })
        envois++
      }
    } catch (err) {
      erreurs.push(`${f.prenom} : ${(err as Error).message}`)
    }
  }
  await db.from('messages').update({ envoye_at: new Date().toISOString(), envois }).eq('id', id)
  return json({ envois, erreurs })
})
