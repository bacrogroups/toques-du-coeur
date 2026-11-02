-- Administrateurs : ils voient et gèrent tous les foyers, les dates, les réservations,
-- les propositions de bénévolat et les demandes de location (base du futur espace gestion).

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as
$$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $$;
revoke execute on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

create policy "admins : lecture" on public.admins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.est_admin()));
-- Ajouter ou retirer un administrateur se fait depuis le tableau Supabase.
revoke insert, update, delete on public.admins from authenticated, anon;

-- Foyers : l'adhérent garde ses colonnes ; le statut et la fin d'adhésion restent réservés aux admins.
grant update (statut, adhesion_fin) on public.foyers to authenticated;
create function public.foyer_champs_admin() returns trigger
language plpgsql security definer set search_path = '' as
$$
begin
  if (new.statut is distinct from old.statut or new.adhesion_fin is distinct from old.adhesion_fin)
     and coalesce(auth.role(), '') = 'authenticated' and not public.est_admin() then
    raise exception 'Seul le bureau peut modifier le statut d''une adhésion.' using errcode = '42501';
  end if;
  return new;
end
$$;
create trigger foyer_champs_admin before update on public.foyers for each row execute function public.foyer_champs_admin();
revoke execute on function public.foyer_champs_admin() from public, anon, authenticated;

create policy "foyers : admin lecture" on public.foyers for select to authenticated using ((select public.est_admin()));
create policy "foyers : admin modification" on public.foyers for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));

create policy "événements : admin lecture" on public.evenements for select to authenticated using ((select public.est_admin()));
create policy "événements : admin création" on public.evenements for insert to authenticated with check ((select public.est_admin()));
create policy "événements : admin modification" on public.evenements for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "événements : admin suppression" on public.evenements for delete to authenticated using ((select public.est_admin()));

create policy "réservations : admin lecture" on public.reservations for select to authenticated using ((select public.est_admin()));
create policy "réservations : admin modification" on public.reservations for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));

create policy "bénévolat : admin lecture" on public.candidatures_benevoles for select to authenticated using ((select public.est_admin()));

create policy "locations : admin lecture" on public.locations for select to authenticated using ((select public.est_admin()));
create policy "locations : admin modification" on public.locations for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));
