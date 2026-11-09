-- Espace collectivités : les structures (mairies, CCAS, écoles, associations…) créent un compte,
-- le bureau le valide, puis elles commandent des paniers en nombre pour une date.
-- Suivi d'une commande : demandée → validée → en préparation → prête → retirée (ou refusée / annulée).
-- Toutes les écritures sur les commandes passent par les fonctions ci-dessous.

create table public.collectivites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nom text not null check (length(nom) between 2 and 120),
  type text not null default 'mairie' check (type in ('mairie', 'ccas', 'ecole', 'association', 'entreprise', 'autre')),
  contact text not null check (length(contact) between 2 and 120),
  email text,
  telephone text check (telephone is null or length(telephone) <= 30),
  adresse text check (adresse is null or length(adresse) <= 200),
  ville text check (ville is null or length(ville) <= 80),
  siret text check (siret is null or siret ~ '^[0-9]{14}$'),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'active', 'suspendue')),
  created_at timestamptz not null default now()
);

-- Réglages de l'association (une seule ligne).
create table public.reglages (
  id boolean primary key default true check (id),
  prix_panier_collectivite numeric(6,2) not null default 5 check (prix_panier_collectivite >= 0),
  lieu_retrait text check (lieu_retrait is null or length(lieu_retrait) <= 200),
  delai_commande_jours int not null default 3 check (delai_commande_jours between 0 and 60)
);
insert into public.reglages default values;

create table public.commandes (
  id uuid primary key default gen_random_uuid(),
  numero int generated always as identity unique,
  collectivite_id uuid not null references public.collectivites(id) on delete cascade,
  paniers_demandes int not null check (paniers_demandes between 1 and 500),
  date_souhaitee date not null,
  message text check (message is null or length(message) <= 1000),
  -- Fixés (ou ajustés) par le bureau à la validation.
  paniers int check (paniers is null or paniers between 1 and 500),
  date_retrait date,
  heure_retrait time,
  lieu_retrait text check (lieu_retrait is null or length(lieu_retrait) <= 200),
  prix_unitaire numeric(6,2) not null check (prix_unitaire >= 0),
  montant numeric(8,2) generated always as (coalesce(paniers, paniers_demandes) * prix_unitaire) stored,
  note_bureau text check (note_bureau is null or length(note_bureau) <= 1000),
  statut text not null default 'demandee'
    check (statut in ('demandee', 'validee', 'en_preparation', 'prete', 'retiree', 'refusee', 'annulee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index commandes_collectivite on public.commandes (collectivite_id);
create index commandes_statut on public.commandes (statut);

-- Historique visible par la collectivité : une ligne par étape.
create table public.commandes_suivi (
  id uuid primary key default gen_random_uuid(),
  commande_id uuid not null references public.commandes(id) on delete cascade,
  statut text not null,
  note text,
  created_at timestamptz not null default now()
);
create index commandes_suivi_commande on public.commandes_suivi (commande_id);

alter table public.collectivites enable row level security;
alter table public.reglages enable row level security;
alter table public.commandes enable row level security;
alter table public.commandes_suivi enable row level security;

create function public.ma_collectivite() returns uuid
language sql stable security definer set search_path = '' as
$$ select id from public.collectivites where user_id = (select auth.uid()) $$;

create function public.collectivite_email() returns trigger
language plpgsql security definer set search_path = '' as
$$ begin new.email := (select email from auth.users where id = new.user_id); return new; end $$;
create trigger collectivite_email before insert on public.collectivites for each row execute function public.collectivite_email();

-- Collectivités : chacune voit et modifie sa fiche, sans toucher au statut.
create policy "collectivité : lecture" on public.collectivites for select to authenticated
  using (user_id = (select auth.uid()) or (select public.est_equipe()));
create policy "collectivité : création" on public.collectivites for insert to authenticated
  with check (user_id = (select auth.uid()) and statut = 'en_attente');
create policy "collectivité : modification" on public.collectivites for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete on public.collectivites from authenticated, anon;
grant insert (user_id, nom, type, contact, telephone, adresse, ville, siret) on public.collectivites to authenticated;
grant update (nom, type, contact, telephone, adresse, ville, siret) on public.collectivites to authenticated;

create policy "réglages : lecture" on public.reglages for select to authenticated using (true);
create policy "réglages : admin modification" on public.reglages for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));
revoke insert, update, delete on public.reglages from authenticated, anon;
grant update (prix_panier_collectivite, lieu_retrait, delai_commande_jours) on public.reglages to authenticated;

create policy "commandes : lecture" on public.commandes for select to authenticated
  using (collectivite_id = (select public.ma_collectivite()) or (select public.est_equipe()));
revoke insert, update, delete on public.commandes from authenticated, anon;

create policy "suivi : lecture" on public.commandes_suivi for select to authenticated
  using (exists (select 1 from public.commandes c where c.id = commande_id));
revoke insert, update, delete on public.commandes_suivi from authenticated, anon;

-- Le bureau valide, suspend ou réactive une collectivité.
create function public.statut_collectivite(coll uuid, statut text) returns void
language plpgsql security definer set search_path = '' as
$$
begin
  if not public.est_admin() then raise exception 'Réservé au bureau.'; end if;
  if statut not in ('en_attente', 'active', 'suspendue') then raise exception 'Statut inconnu.'; end if;
  update public.collectivites c set statut = statut_collectivite.statut where c.id = coll;
  if not found then raise exception 'Collectivité introuvable.'; end if;
end
$$;

-- La collectivité demande des paniers pour une date.
create function public.commander_paniers(nb int, jour date, message text default null) returns public.commandes
language plpgsql security definer set search_path = '' as
$$
declare
  c public.collectivites;
  r public.reglages;
  cmd public.commandes;
begin
  select * into c from public.collectivites where user_id = auth.uid();
  if c.id is null then raise exception 'Complétez d''abord la fiche de votre structure.'; end if;
  if c.statut <> 'active' then raise exception 'Votre compte doit d''abord être validé par l''association.'; end if;
  select * into r from public.reglages;
  if nb is null or nb < 1 or nb > 500 then raise exception 'Indiquez un nombre de paniers entre 1 et 500.'; end if;
  if jour is null or jour < current_date + r.delai_commande_jours then
    raise exception 'Merci de commander au moins % jours à l''avance.', r.delai_commande_jours;
  end if;
  insert into public.commandes (collectivite_id, paniers_demandes, date_souhaitee, message, prix_unitaire)
  values (c.id, nb, jour, nullif(trim(commander_paniers.message), ''), r.prix_panier_collectivite)
  returning * into cmd;
  insert into public.commandes_suivi (commande_id, statut) values (cmd.id, 'demandee');
  return cmd;
end
$$;

-- La collectivité annule tant que la préparation n'a pas commencé.
create function public.annuler_commande(cmd uuid) returns void
language plpgsql security definer set search_path = '' as
$$
begin
  update public.commandes set statut = 'annulee', updated_at = now()
  where id = cmd and collectivite_id = public.ma_collectivite() and statut in ('demandee', 'validee');
  if not found then raise exception 'Cette commande ne peut plus être annulée. Appelez-nous.'; end if;
  insert into public.commandes_suivi (commande_id, statut) values (cmd, 'annulee');
end
$$;

-- Le bureau valide (en ajustant si besoin quantité, date, lieu, prix) ou refuse.
-- Une commande déjà validée ou en préparation peut encore être ajustée.
create function public.traiter_commande(
  cmd uuid, decision text, nb int default null, jour date default null, heure time default null,
  lieu text default null, prix numeric default null, note text default null
) returns public.commandes
language plpgsql security definer set search_path = '' as
$$
declare
  c public.commandes;
  ancien text;
begin
  if not public.est_admin() then raise exception 'Réservé au bureau.'; end if;
  select * into c from public.commandes where id = cmd for update;
  if c.id is null then raise exception 'Commande introuvable.'; end if;
  ancien := c.statut;
  note := nullif(trim(note), '');

  if decision = 'refuser' then
    if c.statut not in ('demandee', 'validee', 'en_preparation') then raise exception 'Cette commande ne peut plus être refusée.'; end if;
    if note is null then raise exception 'Indiquez le motif du refus : la collectivité le verra.'; end if;
    update public.commandes set statut = 'refusee', note_bureau = note, updated_at = now() where id = cmd returning * into c;
    insert into public.commandes_suivi (commande_id, statut, note) values (cmd, 'refusee', note);
    return c;
  end if;

  if decision <> 'valider' then raise exception 'Décision inconnue.'; end if;
  if c.statut not in ('demandee', 'validee', 'en_preparation') then raise exception 'Cette commande ne peut plus être modifiée.'; end if;
  if nb is null or nb < 1 or nb > 500 then raise exception 'Indiquez un nombre de paniers entre 1 et 500.'; end if;
  if jour is null then raise exception 'Indiquez la date de retrait.'; end if;
  if prix is null or prix < 0 then raise exception 'Indiquez le prix par panier.'; end if;
  update public.commandes set
    paniers = nb, date_retrait = jour, heure_retrait = heure, lieu_retrait = nullif(trim(lieu), ''),
    prix_unitaire = prix, note_bureau = note,
    statut = case when statut = 'demandee' then 'validee' else statut end,
    updated_at = now()
  where id = cmd returning * into c;
  insert into public.commandes_suivi (commande_id, statut, note)
  values (cmd, case when ancien = 'demandee' then 'validee' else 'modifiee' end, note);
  return c;
end
$$;

-- L'équipe fait avancer la commande : en préparation, prête (le retrait doit être connu), retirée.
create function public.avancer_commande(cmd uuid, statut text, note text default null) returns public.commandes
language plpgsql security definer set search_path = '' as
$$
declare
  c public.commandes;
  suivant text;
begin
  if not public.est_equipe() then raise exception 'Réservé à l''équipe.'; end if;
  select * into c from public.commandes where id = cmd for update;
  if c.id is null then raise exception 'Commande introuvable.'; end if;
  suivant := case c.statut when 'validee' then 'en_preparation' when 'en_preparation' then 'prete' when 'prete' then 'retiree' end;
  if suivant is null or suivant <> avancer_commande.statut then
    raise exception 'Étape impossible depuis l''état actuel de la commande.';
  end if;
  if suivant = 'prete' and (c.date_retrait is null or c.lieu_retrait is null) then
    raise exception 'Renseignez la date et le lieu de retrait avant d''indiquer que la commande est prête.';
  end if;
  update public.commandes set statut = suivant, updated_at = now() where id = cmd returning * into c;
  insert into public.commandes_suivi (commande_id, statut, note) values (cmd, suivant, nullif(trim(note), ''));
  return c;
end
$$;

revoke execute on function
  public.ma_collectivite(), public.collectivite_email(), public.statut_collectivite(uuid, text),
  public.commander_paniers(int, date, text), public.annuler_commande(uuid),
  public.traiter_commande(uuid, text, int, date, time, text, numeric, text), public.avancer_commande(uuid, text, text)
from public, anon, authenticated;
grant execute on function
  public.ma_collectivite(), public.statut_collectivite(uuid, text),
  public.commander_paniers(int, date, text), public.annuler_commande(uuid),
  public.traiter_commande(uuid, text, int, date, time, text, numeric, text), public.avancer_commande(uuid, text, text)
to authenticated;
