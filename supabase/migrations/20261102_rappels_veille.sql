-- Lance la fonction rappels-veille tous les jours à 18 h (heure de Paris en hiver ; 17 h UTC).
-- À appliquer après avoir déployé la fonction et rangé le même secret dans Vault et dans les secrets des fonctions :
--   select vault.create_secret('<secret>', 'cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'rappels-veille',
  '0 17 * * *',
  $$
  select net.http_post(
    url := 'https://gevmfeqxdrfcgdwsplyz.supabase.co/functions/v1/rappels-veille',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
