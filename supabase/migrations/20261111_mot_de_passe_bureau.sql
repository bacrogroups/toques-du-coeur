-- Sans service d'envoi d'e-mails, « mot de passe oublié » ne peut rien envoyer aux adhérents.
-- Le bureau peut donc donner lui-même un nouveau mot de passe à un adhérent (par téléphone,
-- à une distribution…). Le compte est aussi marqué comme confirmé, au cas où il ne l'était pas.
-- Les comptes de l'équipe sont exclus : chacun y garde la main sur son propre mot de passe.

create function public.bureau_mot_de_passe(foyer uuid, mot_de_passe text) returns void
language plpgsql security definer set search_path = '' as
$$
declare uid uuid;
begin
  if not public.est_admin() then raise exception 'Réservé au bureau.' using errcode = '42501'; end if;
  if length(coalesce(mot_de_passe, '')) < 8 then raise exception 'Le mot de passe doit faire au moins 8 caractères.'; end if;
  select f.user_id into uid from public.foyers f where f.id = foyer;
  if uid is null then raise exception 'Ce foyer n''a pas de compte en ligne.'; end if;
  if exists (select 1 from public.admins a where a.user_id = uid) then
    raise exception 'Ce compte fait partie de l''équipe : la personne change son mot de passe elle-même.' using errcode = '42501';
  end if;
  update auth.users
    set encrypted_password = extensions.crypt(mot_de_passe, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = uid;
end
$$;
revoke execute on function public.bureau_mot_de_passe(uuid, text) from public, anon;
grant execute on function public.bureau_mot_de_passe(uuid, text) to authenticated;
