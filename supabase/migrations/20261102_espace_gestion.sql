-- Espace gestion : équipe (bureau et bénévoles), foyers sans compte, réservation pour autrui,
-- pointage, planning des bénévoles et messages groupés.

-- Équipe : la table admins accueille aussi les bénévoles.
alter table public.admins add column role text not null default 'admin' check (role in ('admin', 'benevole'));
alter table public.admins add column nom text check (length(nom) <= 80);

create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.admins where user_id = (select auth.uid()) and role = 'admin') $$;

create function public.est_equipe() returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $$;
revoke execute on function public.est_equipe() from public, anon;
grant execute on function public.est_equipe() to authenticated;

drop policy "admins : lecture" on public.admins;
create policy "équipe : lecture" on public.admins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.est_equipe()));

-- Liste de l'équipe avec les e-mails des comptes.
create function public.equipe() returns table (user_id uuid, email text, nom text, role text)
language plpgsql stable security definer set search_path = '' as
$$
begin
  if not public.est_equipe() then raise exception 'Réservé à l''équipe.'; end if;
  return query select a.user_id, u.email::text, a.nom, a.role from public.admins a join auth.users u on u.id = a.user_id order by a.role, a.nom;
end
$$;

create function public.ajouter_membre(email text, role text, nom text) returns void
language plpgsql security definer set search_path = '' as
$$
declare uid uuid;
begin
  if not public.est_admin() then raise exception 'Réservé au bureau.'; end if;
  if role not in ('admin', 'benevole') then raise exception 'Rôle inconnu.'; end if;
  select id into uid from auth.users u where lower(u.email) = lower(trim(ajouter_membre.email));
  if uid is null then raise exception 'Aucun compte avec cet e-mail. La personne doit d''abord créer son compte sur l''espace adhérent.'; end if;
  insert into public.admins (user_id, role, nom) values (uid, ajouter_membre.role, nullif(trim(ajouter_membre.nom), ''))
  on conflict (user_id) do update set role = excluded.role, nom = coalesce(excluded.nom, public.admins.nom);
end
$$;

create function public.retirer_membre(membre uuid) returns void
language plpgsql security definer set search_path = '' as
$$
begin
  if not public.est_admin() then raise exception 'Réservé au bureau.'; end if;
  if (select role from public.admins where user_id = membre) = 'admin'
     and (select count(*) from public.admins where role = 'admin') <= 1 then
    raise exception 'Il faut garder au moins une personne au bureau.';
  end if;
  delete from public.admins where user_id = membre;
end
$$;

revoke execute on function public.equipe(), public.ajouter_membre(text, text, text), public.retirer_membre(uuid) from public, anon;
grant execute on function public.equipe(), public.ajouter_membre(text, text, text), public.retirer_membre(uuid) to authenticated;

-- Foyers sans compte (personnes sans smartphone), créés par le bureau.
alter table public.foyers alter column user_id drop not null;

create or replace function public.foyer_email() returns trigger
language plpgsql security definer set search_path = '' as
$$
begin
  if new.user_id is not null then new.email := (select email from auth.users where id = new.user_id); end if;
  return new;
end
$$;

create or replace function public.foyer_champs_admin() returns trigger
language plpgsql security definer set search_path = '' as
$$
begin
  if (new.statut is distinct from old.statut or new.adhesion_fin is distinct from old.adhesion_fin or new.email is distinct from old.email)
     and coalesce(auth.role(), '') = 'authenticated' and not public.est_admin() then
    raise exception 'Seul le bureau peut modifier le statut d''une adhésion.' using errcode = '42501';
  end if;
  return new;
end
$$;
revoke execute on function public.foyer_email(), public.foyer_champs_admin() from public, anon, authenticated;

grant insert (statut, adhesion_fin, email) on public.foyers to authenticated;
grant update (email) on public.foyers to authenticated;

drop policy "foyers : admin lecture" on public.foyers;
create policy "foyers : équipe lecture" on public.foyers for select to authenticated using ((select public.est_equipe()));
create policy "foyers : admin création" on public.foyers for insert to authenticated with check ((select public.est_admin()));

-- Dates, réservations et bénévolat visibles par toute l'équipe ; pointage par les bénévoles.
drop policy "événements : admin lecture" on public.evenements;
create policy "événements : équipe lecture" on public.evenements for select to authenticated using ((select public.est_equipe()));

drop policy "réservations : admin lecture" on public.reservations;
drop policy "réservations : admin modification" on public.reservations;
create policy "réservations : équipe lecture" on public.reservations for select to authenticated using ((select public.est_equipe()));
create policy "réservations : équipe pointage" on public.reservations for update to authenticated
  using ((select public.est_equipe())) with check ((select public.est_equipe()));

drop policy "bénévolat : admin lecture" on public.candidatures_benevoles;
create policy "bénévolat : équipe lecture" on public.candidatures_benevoles for select to authenticated using ((select public.est_equipe()));

alter table public.reservations add column retiree_at timestamptz;
create function public.reservation_retiree() returns trigger
language plpgsql set search_path = '' as
$$
begin
  if new.statut = 'retiree' and old.statut is distinct from 'retiree' then new.retiree_at := now();
  elsif new.statut <> 'retiree' then new.retiree_at := null;
  end if;
  return new;
end
$$;
create trigger reservation_retiree before update on public.reservations for each row execute function public.reservation_retiree();
revoke execute on function public.reservation_retiree() from public, anon, authenticated;

-- Réservation par l'adhérent, ou par l'équipe pour un foyer (pour_foyer).
drop function public.reserver_panier(uuid);
create function public.reserver_panier(evt uuid, pour_foyer uuid default null) returns public.reservations
language plpgsql security definer set search_path = '' as
$$
declare
  f public.foyers;
  e public.evenements;
  r public.reservations;
begin
  if pour_foyer is not null then
    if not public.est_equipe() then raise exception 'Réservé à l''équipe.'; end if;
    select * into f from public.foyers where id = pour_foyer;
    if f.id is null then raise exception 'Ce foyer n''existe pas.'; end if;
  else
    select * into f from public.foyers where user_id = auth.uid();
    if f.id is null then raise exception 'Complétez d''abord votre profil.'; end if;
  end if;
  if f.statut <> 'actif' or f.adhesion_fin is null or f.adhesion_fin < current_date then
    raise exception '%', case when pour_foyer is null then 'Votre adhésion n''est pas encore active.' else 'L''adhésion de ce foyer n''est pas active.' end;
  end if;
  select * into e from public.evenements where id = evt and (publie or public.est_equipe()) for update;
  if e.id is null or e.type <> 'distribution' then raise exception 'Cette distribution n''existe pas.'; end if;
  if e.jour < current_date then raise exception 'Cette distribution est passée.'; end if;
  if e.paniers_max is not null and (select count(*) from public.reservations where evenement_id = e.id and statut <> 'annulee') >= e.paniers_max then
    raise exception 'Il n''y a plus de panier pour cette date.';
  end if;
  begin
    insert into public.reservations (foyer_id, evenement_id, semaine)
    values (f.id, e.id, date_trunc('week', e.jour)::date) returning * into r;
  exception when unique_violation then
    raise exception '%', case when pour_foyer is null then 'Vous avez déjà un panier réservé cette semaine.' else 'Ce foyer a déjà un panier cette semaine.' end;
  end;
  return r;
end
$$;

create or replace function public.annuler_reservation(resa uuid) returns void
language plpgsql security definer set search_path = '' as
$$
begin
  update public.reservations r set statut = 'annulee'
  from public.evenements e
  where r.id = resa and e.id = r.evenement_id and r.statut = 'reservee'
    and (r.foyer_id = public.mon_foyer() or public.est_equipe()) and e.jour >= current_date;
  if not found then raise exception 'Cette réservation ne peut plus être annulée.'; end if;
end
$$;

revoke execute on function public.reserver_panier(uuid, uuid) from public, anon;
grant execute on function public.reserver_panier(uuid, uuid) to authenticated;

-- Planning des bénévoles : qui vient à quelle date.
create table public.planning (
  id uuid primary key default gen_random_uuid(),
  evenement_id uuid not null references public.evenements(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nom text not null check (length(nom) between 1 and 80),
  mission text check (length(mission) <= 120),
  created_at timestamptz not null default now(),
  unique (evenement_id, user_id)
);
create index planning_evenement on public.planning (evenement_id);
alter table public.planning enable row level security;
create policy "planning : lecture" on public.planning for select to authenticated using ((select public.est_equipe()));
create policy "planning : inscription" on public.planning for insert to authenticated
  with check ((select public.est_admin()) or ((select public.est_equipe()) and user_id = (select auth.uid())));
create policy "planning : désinscription" on public.planning for delete to authenticated
  using ((select public.est_admin()) or ((select public.est_equipe()) and user_id = (select auth.uid())));

-- Messages groupés : publiés dans l'espace adhérent, et envoyés par e-mail ou SMS si Brevo est configuré.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  titre text not null check (length(titre) between 1 and 120),
  texte text not null check (length(texte) between 1 and 1000),
  cible text not null default 'actifs' check (cible in ('tous', 'actifs', 'evenement')),
  evenement_id uuid references public.evenements(id) on delete set null,
  par_email boolean not null default false,
  par_sms boolean not null default false,
  publie boolean not null default true,
  expire_le date,
  auteur uuid default auth.uid() references auth.users(id) on delete set null,
  envoye_at timestamptz,
  envois int not null default 0,
  created_at timestamptz not null default now(),
  check (cible <> 'evenement' or evenement_id is not null)
);
create index messages_evenement on public.messages (evenement_id);
alter table public.messages enable row level security;
create policy "messages : lecture" on public.messages for select to authenticated using (
  (select public.est_equipe()) or (
    publie and (expire_le is null or expire_le >= current_date) and (
      cible = 'tous'
      or (cible = 'actifs' and exists (select 1 from public.foyers f where f.user_id = (select auth.uid()) and f.statut = 'actif' and f.adhesion_fin >= current_date))
      or (cible = 'evenement' and exists (select 1 from public.reservations r where r.evenement_id = messages.evenement_id and r.foyer_id = (select public.mon_foyer()) and r.statut <> 'annulee'))
    )
  )
);
create policy "messages : admin création" on public.messages for insert to authenticated with check ((select public.est_admin()));
create policy "messages : admin modification" on public.messages for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "messages : admin suppression" on public.messages for delete to authenticated using ((select public.est_admin()));
