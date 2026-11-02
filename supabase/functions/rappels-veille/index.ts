// Rappels de la veille : chaque soir, prévient par e-mail ou SMS les foyers qui ont un panier réservé le lendemain.
// Envoi par Brevo (e-mail et SMS avec la même clé). Appelé par pg_cron avec l'en-tête x-cron-secret.
// Secrets à définir dans Supabase : BREVO_API_KEY, CRON_SECRET, EXPEDITEUR_EMAIL.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const BREVO = 'https://api.brevo.com/v3'

function demainParis(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  now.setDate(now.getDate() + 1)
  return now.toISOString().slice(0, 10)
}

const heure = (t: string) => t.slice(0, 5).replace(/^0/, '').replace(':', ' h ').replace(' h 00', ' h')

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
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('Interdit', { status: 403 })
  if (!Deno.env.get('BREVO_API_KEY')) return Response.json({ envoyes: 0, raison: 'BREVO_API_KEY absente' })

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await db
    .from('reservations')
    .select('id, foyers!inner(prenom, email, telephone, rappel), evenements!inner(jour, heure_debut, heure_fin, lieu)')
    .eq('statut', 'reservee')
    .eq('rappel_envoye', false)
    .eq('evenements.jour', demainParis())
  if (error) return Response.json({ erreur: error.message }, { status: 500 })

  let envoyes = 0
  const erreurs: string[] = []
  for (const r of data ?? []) {
    const f = r.foyers as unknown as { prenom: string; email: string | null; telephone: string | null; rappel: string }
    const e = r.evenements as unknown as { heure_debut: string; heure_fin: string; lieu: string | null }
    const quand = `demain de ${heure(e.heure_debut)} à ${heure(e.heure_fin)}`
    const ou = e.lieu ? ` au ${e.lieu}` : ''
    const texte = `Bonjour ${f.prenom}, votre panier solidaire vous attend ${quand}${ou}. Pensez à votre sac et à 5 €. Les Toqués du Cœur`
    try {
      if (f.rappel === 'sms') {
        const tel = f.telephone && telephoneInternational(f.telephone)
        if (!tel) throw new Error('numéro absent ou invalide')
        await brevo('/transactionalSMS/sms', { sender: 'ToquesCoeur', recipient: tel, content: texte, type: 'transactional' })
      } else if (f.rappel === 'email' && f.email) {
        await brevo('/smtp/email', {
          sender: { name: 'Les Toqués du Cœur', email: Deno.env.get('EXPEDITEUR_EMAIL') ?? 'lestoquesducoeur@gmail.com' },
          to: [{ email: f.email, name: f.prenom }],
          subject: 'Votre panier solidaire, c\'est demain',
          textContent: texte,
        })
      } else continue
      await db.from('reservations').update({ rappel_envoye: true }).eq('id', r.id)
      envoyes++
    } catch (err) {
      erreurs.push(`${r.id} : ${(err as Error).message}`)
    }
  }
  return Response.json({ envoyes, erreurs })
})
