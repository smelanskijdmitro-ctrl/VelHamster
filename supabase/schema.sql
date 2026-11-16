-- VelHamster Forum schema. Run in Supabase SQL Editor.
create type public.member_role as enum ('player','admin');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  role public.member_role not null default 'player',
  avatar_url text,
  created_at timestamptz not null default now()
);
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('news','chat','complaints','ideas','help')),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 20000),
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 120),
  details text not null check (char_length(details) between 5 and 10000),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.complaints enable row level security;

-- Helper checks role from the protected profiles table.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

-- Create a player profile automatically at sign-up. The role is never taken from user metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare desired_name text;
begin
  desired_name := coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1));
  desired_name := left(regexp_replace(desired_name, '[^a-zA-Z0-9_А-Яа-я-]', '', 'g'), 24);
  if char_length(desired_name) < 3 then desired_name := 'Player' || left(replace(new.id::text,'-',''),8); end if;
  insert into public.profiles(id, username, role)
  values(new.id, desired_name, 'player')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Profiles: public read, user can edit only their username/avatar; role cannot be changed by player.
create policy "profiles are readable" on public.profiles for select using (true);
-- Player profile editing is disabled in this starter version; role changes are admin-only.
create policy "admins update profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- Topics: everyone can read; only admins can create, edit or delete.
create policy "topics are public" on public.topics for select using (true);
create policy "admins create topics" on public.topics for insert with check (public.is_admin() and author_id = auth.uid());
create policy "admins update topics" on public.topics for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete topics" on public.topics for delete using (public.is_admin());

-- Complaints: authenticated players can submit and read only their own; admins can read/manage all.
create policy "players submit complaints" on public.complaints for insert to authenticated with check (user_id = auth.uid());
create policy "players read own complaints" on public.complaints for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "admins update complaints" on public.complaints for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete complaints" on public.complaints for delete using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.topics, public.profiles to anon, authenticated;
grant insert, update, delete on public.topics to authenticated;
grant insert, select, update, delete on public.complaints to authenticated;
grant select, update on public.profiles to authenticated;

-- IMPORTANT: After creating your account, promote YOUR account using the one-time SQL below.
-- Replace YOUR_EMAIL with the email used during registration, then run it as project owner:
-- update public.profiles p set role='admin' from auth.users u where p.id=u.id and u.email='YOUR_EMAIL';
