-- Gestion : suppression d'un adhérent par le bureau, et garde-fou sur le changement de rôle.

-- Changer un membre de rôle ne doit jamais laisser le bureau vide.
create or replace function public.ajouter_membre(email text, role text, nom text) returns void
language plpgsql security definer set search_path = '' as
$$
declare uid uuid;
begin
  if not public.est_admin() then raise exception 'Réservé au bureau.'; end if;
  if role not in ('admin', 'benevole') then raise exception 'Rôle inconnu.'; end if;
  select id into uid from auth.users u where lower(u.email) = lower(trim(ajouter_membre.email));
  if uid is null then raise exception 'Aucun compte avec cet e-mail. La personne doit d''abord créer son compte sur l''espace adhérent.'; end if;
  if ajouter_membre.role = 'benevole'
     and (select a.role from public.admins a where a.user_id = uid) = 'admin'
     and (select count(*) from public.admins a where a.role = 'admin') <= 1 then
    raise exception 'Il faut garder au moins une personne au bureau.';
  end if;
  insert into public.admins (user_id, role, nom) values (uid, ajouter_membre.role, nullif(trim(ajouter_membre.nom), ''))
  on conflict (user_id) do update set role = excluded.role, nom = coalesce(excluded.nom, public.admins.nom);
end
$$;

-- Supprime un foyer et tout ce qui s'y rattache (réservations, bénévolat, locations).
-- S'il a un compte en ligne, le compte est supprimé aussi : la personne ne peut plus se connecter.
-- Les membres de l'équipe et les comptes de collectivité sont protégés.
create function public.supprimer_foyer(foyer uuid) returns void
language plpgsql security definer set search_path = '' as
$$
declare uid uuid;
begin
  if not public.est_admin() then raise exception 'Réservé au bureau.' using errcode = '42501'; end if;
  select f.user_id into uid from public.foyers f where f.id = foyer;
  if not found then raise exception 'Adhérent introuvable.'; end if;
  if uid is not null and exists (select 1 from public.admins a where a.user_id = uid) then
    raise exception 'Cette personne fait partie de l''équipe : retirez d''abord son accès à la gestion.';
  end if;
  if uid is not null and exists (select 1 from public.collectivites c where c.user_id = uid) then
    raise exception 'Ce compte sert aussi à une collectivité : il ne peut pas être supprimé ici.';
  end if;
  delete from public.foyers f where f.id = foyer;
  if uid is not null then delete from auth.users u where u.id = uid; end if;
end
$$;
revoke execute on function public.supprimer_foyer(uuid) from public, anon;
grant execute on function public.supprimer_foyer(uuid) to authenticated;
