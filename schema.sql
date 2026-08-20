-- Sonora's first Supabase schema.
-- Run this once in Supabase SQL Editor.
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  first_name text not null default '',
  last_name text not null default '',
  account_type text not null default 'listener' check (account_type in ('listener','broadcaster')),
  church_name text,
  logo_url text,
  short_description text,
  long_description text,
  venue text,
  theme_color text default '#d5683d',
  created_at timestamptz not null default now()
);

create table if not exists public.broadcasts (
  id uuid primary key default uuid_generate_v4(),
  broadcaster_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  speaker text,
  venue text,
  thumbnail_url text,
  audio_url text,
  status text not null default 'draft' check (status in ('draft','live','ended','published')),
  listener_count integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.broadcast_likes (
  broadcast_id uuid not null references public.broadcasts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (broadcast_id, user_id)
);

create table if not exists public.follows (
  broadcaster_id uuid not null references public.profiles(id) on delete cascade,
  listener_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (broadcaster_id, listener_id),
  check (broadcaster_id <> listener_id)
);

alter table public.profiles enable row level security;
alter table public.broadcasts enable row level security;
alter table public.comments enable row level security;
alter table public.broadcast_likes enable row level security;
alter table public.follows enable row level security;

create policy "Public profiles are readable" on public.profiles for select using (true);
create policy "Users can create their profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id);
create policy "Published and live broadcasts are public" on public.broadcasts for select using (status in ('live','published') or auth.uid() = broadcaster_id);
create policy "Broadcasters manage their broadcasts" on public.broadcasts for all using (auth.uid() = broadcaster_id) with check (auth.uid() = broadcaster_id);
create policy "Comments are public to read" on public.comments for select using (true);
create policy "Signed-in users can comment" on public.comments for insert with check (auth.uid() = author_id);
create policy "Authors can delete comments" on public.comments for delete using (auth.uid() = author_id);
create policy "Likes are readable" on public.broadcast_likes for select using (true);
create policy "Users manage their likes" on public.broadcast_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Follows are readable" on public.follows for select using (true);
create policy "Listeners manage their follows" on public.follows for all using (auth.uid() = listener_id) with check (auth.uid() = listener_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, first_name, last_name, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'account_type', 'listener')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();