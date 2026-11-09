-- Run once in a NEW Supabase project's SQL editor. No existing tables are replaced.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);
create table public.artworks (
  id uuid primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  source_id text not null check (char_length(source_id) between 1 and 100),
  image_path text generated always as (owner_id::text || '/' || id::text || '.png') stored,
  title text not null check (char_length(title) between 1 and 120),
  caption text not null default '' check (char_length(caption) <= 100),
  topic_id text not null check (char_length(topic_id) between 1 and 100),
  drawing_day date not null,
  mode text not null check (mode in ('daily','practice','variation','legacy')),
  visibility text not null default 'private' check (visibility in ('private','public')),
  created_at timestamptz not null default now(),
  unique(owner_id, source_id)
);
create index artworks_feed on public.artworks(visibility, created_at desc, id);
create index artworks_owner on public.artworks(owner_id, created_at desc);
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  primary key(user_id, artwork_id)
);
create index likes_artwork on public.likes(artwork_id);
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  primary key(follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.profiles enable row level security;
alter table public.artworks enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
-- Explicit grants; RLS remains responsible for row visibility/ownership.
revoke all on public.profiles, public.artworks, public.likes, public.follows from anon, authenticated;
grant select on public.profiles, public.artworks, public.likes, public.follows to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.artworks to authenticated;
grant insert, delete on public.likes, public.follows to authenticated;
create policy profiles_read on public.profiles for select using (true);
create policy profiles_create on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_edit on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy artwork_read on public.artworks for select using (visibility = 'public' or owner_id = (select auth.uid()));
create policy artwork_create on public.artworks for insert to authenticated with check (owner_id = (select auth.uid()));
create policy artwork_edit on public.artworks for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy artwork_delete on public.artworks for delete to authenticated using (owner_id = (select auth.uid()));
create policy likes_read on public.likes for select using (
  exists (select 1 from public.artworks a where a.id = artwork_id)
);
create policy likes_create on public.likes for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.artworks a where a.id = artwork_id and a.visibility = 'public')
);
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));
create policy follows_read on public.follows for select using (true);
create policy follows_create on public.follows for insert to authenticated with check (follower_id = (select auth.uid()));
create policy follows_delete on public.follows for delete to authenticated using (follower_id = (select auth.uid()));
-- A PRIVATE bucket. Signed URLs last 60 seconds; possession of a URL grants access until expiry.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('drawings', 'drawings', false, 2097152, array['image/png']);
create policy drawings_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'drawings' and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.png$'
);
create policy drawings_read on storage.objects for select using (
  bucket_id = 'drawings' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.artworks a where a.image_path = name and a.visibility = 'public')
  )
);
create policy drawings_delete on storage.objects for delete to authenticated using (
  bucket_id = 'drawings' and (storage.foldername(name))[1] = (select auth.uid())::text
);
commit;
