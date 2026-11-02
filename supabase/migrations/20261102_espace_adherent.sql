-- Espace adhérent des Toqués du Cœur.
-- Les adhérents lisent et modifient seulement leurs propres données ; le statut et la fin
-- d'adhésion sont réservés au bureau (futur espace gestion, ou tableau Supabase en attendant).

create table public.foyers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  numero int generated always as identity unique,
  carte text not null unique default encode(gen_random_bytes(12), 'hex'),
  prenom text not null check (length(prenom) between 1 and 80),
  nom text not null check (length(nom) between 1 and 80),
  email text,
  telephone text check (telephone is null or length(telephone) <= 30),
  ville text check (ville is null or length(ville) <= 80),
  nb_personnes int not null default 1 check (nb_personnes between 1 and 20),
  rappel text not null default 'email' check (rappel in ('email', 'sms', 'aucun')),
  statut text not null default 'en_attente' check (statut in ('en_attente', 'actif', 'suspendu')),
  adhesion_fin date,
  created_at timestamptz not null default now()
);

create table public.evenements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('distribution', 'marche')),
  jour date not null,
  heure_debut time not null default '10:00',
  heure_fin time not null default '12:00',
  -- Le lieu du marché n'est jamais publié.
  lieu text check (type = 'distribution' or lieu is null),
  paniers_max int check (paniers_max is null or paniers_max >= 0),
  note text,
  publie boolean not null default true,
  created_at timestamptz not null default now(),
  check (type = 'distribution' or paniers_max is null)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references public.foyers(id) on delete cascade,
  evenement_id uuid not null references public.evenements(id) on delete cascade,
  semaine date not null,
  statut text not null default 'reservee' check (statut in ('reservee', 'annulee', 'retiree')),
  rappel_envoye boolean not null default false,
  created_at timestamptz not null default now()
);
-- Un panier par foyer et par semaine.
create unique index reservations_un_par_semaine on public.reservations (foyer_id, semaine) where statut <> 'annulee';
create index reservations_evenement on public.reservations (evenement_id);

create table public.candidatures_benevoles (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references public.foyers(id) on delete cascade,
  disponibilites text check (length(disponibilites) <= 500),
  message text check (length(message) <= 1000),
  created_at timestamptz not null default now()
);
create index candidatures_benevoles_foyer on public.candidatures_benevoles (foyer_id);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  foyer_id uuid not null references public.foyers(id) on delete cascade,
  date_debut date not null,
  date_fin date not null check (date_fin >= date_debut),
  tables int not null default 0 check (tables between 0 and 100),
  bancs int not null default 0 check (bancs between 0 and 200),
  message text check (length(message) <= 1000),
  statut text not null default 'demandee' check (statut in ('demandee', 'acceptee', 'refusee', 'annulee')),
  created_at timestamptz not null default now(),
  check (tables + bancs > 0)
);
create index locations_foyer on public.locations (foyer_id);

alter table public.foyers enable row level security;
alter table public.evenements enable row level security;
alter table public.reservations enable row level security;
alter table public.candidatures_benevoles enable row level security;
alter table public.locations enable row level security;

create function public.mon_foyer() returns uuid
language sql stable security definer set search_path = '' as
$$ select id from public.foyers where user_id = (select auth.uid()) $$;

-- L'e-mail du foyer est celui du compte, recopié pour les rappels.
create function public.foyer_email() returns trigger
language plpgsql security definer set search_path = '' as
$$ begin new.email := (select email from auth.users where id = new.user_id); return new; end $$;
create trigger foyer_email before insert on public.foyers for each row execute function public.foyer_email();

create policy "foyer : lecture" on public.foyers for select to authenticated using (user_id = (select auth.uid()));
create policy "foyer : création" on public.foyers for insert to authenticated
  with check (user_id = (select auth.uid()) and statut = 'en_attente' and adhesion_fin is null);
create policy "foyer : modification" on public.foyers for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Colonnes que l'adhérent peut écrire lui-même.
revoke insert, update on public.foyers from authenticated, anon;
grant insert (user_id, prenom, nom, telephone, ville, nb_personnes, rappel) on public.foyers to authenticated;
grant update (prenom, nom, telephone, ville, nb_personnes, rappel) on public.foyers to authenticated;

create policy "événements : lecture" on public.evenements for select to authenticated using (publie);

-- Les réservations passent uniquement par les fonctions ci-dessous.
create policy "réservations : lecture" on public.reservations for select to authenticated using (foyer_id = (select public.mon_foyer()));
create policy "bénévolat : lecture" on public.candidatures_benevoles for select to authenticated using (foyer_id = (select public.mon_foyer()));
create policy "bénévolat : création" on public.candidatures_benevoles for insert to authenticated with check (foyer_id = (select public.mon_foyer()));
create policy "locations : lecture" on public.locations for select to authenticated using (foyer_id = (select public.mon_foyer()));
create policy "locations : création" on public.locations for insert to authenticated
  with check (foyer_id = (select public.mon_foyer()) and statut = 'demandee' and date_debut >= current_date);

-- Places restantes par distribution, sans exposer les réservations des autres foyers.
create function public.places_restantes(evt uuid) returns int
language sql stable security definer set search_path = '' as
$$ select case when e.paniers_max is null then null
          else greatest(0, e.paniers_max - (select count(*) from public.reservations r where r.evenement_id = e.id and r.statut <> 'annulee'))::int end
   from public.evenements e where e.id = evt and e.publie $$;

create function public.reserver_panier(evt uuid) returns public.reservations
language plpgsql security definer set search_path = '' as
$$
declare
  f public.foyers;
  e public.evenements;
  r public.reservations;
begin
  select * into f from public.foyers where user_id = auth.uid();
  if f.id is null then raise exception 'Complétez d''abord votre profil.'; end if;
  if f.statut <> 'actif' or f.adhesion_fin is null or f.adhesion_fin < current_date then
    raise exception 'Votre adhésion n''est pas encore active.';
  end if;
  select * into e from public.evenements where id = evt and publie for update;
  if e.id is null or e.type <> 'distribution' then raise exception 'Cette distribution n''existe pas.'; end if;
  if e.jour < current_date then raise exception 'Cette distribution est passée.'; end if;
  if e.paniers_max is not null and (select count(*) from public.reservations where evenement_id = e.id and statut <> 'annulee') >= e.paniers_max then
    raise exception 'Il n''y a plus de panier pour cette date.';
  end if;
  begin
    insert into public.reservations (foyer_id, evenement_id, semaine)
    values (f.id, e.id, date_trunc('week', e.jour)::date) returning * into r;
  exception when unique_violation then
    raise exception 'Vous avez déjà un panier réservé cette semaine.';
  end;
  return r;
end
$$;

create function public.annuler_reservation(resa uuid) returns void
language plpgsql security definer set search_path = '' as
$$
begin
  update public.reservations r set statut = 'annulee'
  from public.evenements e
  where r.id = resa and e.id = r.evenement_id and r.statut = 'reservee'
    and r.foyer_id = public.mon_foyer() and e.jour >= current_date;
  if not found then raise exception 'Cette réservation ne peut plus être annulée.'; end if;
end
$$;

revoke execute on function public.mon_foyer(), public.foyer_email(), public.places_restantes(uuid), public.reserver_panier(uuid), public.annuler_reservation(uuid) from public, anon, authenticated;
grant execute on function public.mon_foyer(), public.places_restantes(uuid), public.reserver_panier(uuid), public.annuler_reservation(uuid) to authenticated;
