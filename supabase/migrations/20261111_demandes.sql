-- Demandes envoyées par le formulaire « Envoyer ma demande » de la vitrine (adhésion, bénévolat,
-- don, location, partenariat…). Le public peut seulement en déposer une ; l'équipe les lit,
-- le bureau les traite. Avant, ces demandes partaient uniquement vers Netlify Forms et
-- n'apparaissaient pas dans l'espace gestion.

create table public.demandes (
  id uuid primary key default gen_random_uuid(),
  prenom text not null check (length(trim(prenom)) between 1 and 80),
  nom text not null check (length(trim(nom)) between 1 and 80),
  email text not null check (length(email) between 3 and 200 and email like '%@%'),
  telephone text check (telephone is null or length(telephone) <= 30),
  ville text check (ville is null or length(ville) <= 80),
  souhait text not null check (length(souhait) between 1 and 80),
  message text check (message is null or length(message) <= 3000),
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'traitee', 'archivee')),
  foyer_id uuid references public.foyers(id) on delete set null,
  note text check (note is null or length(note) <= 1000),
  created_at timestamptz not null default now(),
  traitee_at timestamptz
);
create index demandes_statut on public.demandes (statut, created_at desc);

alter table public.demandes enable row level security;

-- Dépôt public : seulement les champs du formulaire, toujours au statut « nouvelle ».
revoke all on public.demandes from anon, authenticated;
grant insert (prenom, nom, email, telephone, ville, souhait, message) on public.demandes to anon, authenticated;
grant select on public.demandes to authenticated;
grant update (statut, foyer_id, note, traitee_at) on public.demandes to authenticated;

create policy "demandes : dépôt public" on public.demandes for insert to anon, authenticated
  with check (statut = 'nouvelle' and foyer_id is null and note is null and traitee_at is null);
create policy "demandes : équipe lecture" on public.demandes for select to authenticated
  using ((select public.est_equipe()));
create policy "demandes : bureau traitement" on public.demandes for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));

-- Garde-fou contre les envois en rafale : 5 demandes par e-mail et par heure au plus.
create function public.demandes_limite() returns trigger
language plpgsql security definer set search_path = '' as
$$
begin
  if (select count(*) from public.demandes d
      where lower(d.email) = lower(new.email) and d.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Trop de demandes envoyées, réessayez plus tard.' using errcode = '42501';
  end if;
  return new;
end
$$;
revoke execute on function public.demandes_limite() from public, anon, authenticated;
create trigger demandes_limite before insert on public.demandes
  for each row execute function public.demandes_limite();
