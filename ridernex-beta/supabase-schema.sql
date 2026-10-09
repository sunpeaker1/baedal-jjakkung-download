-- RiderNex production database baseline (Supabase/PostgreSQL)
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  primary_region text,
  secondary_region text,
  bio text,
  bike text,
  role text not null default 'member' check (role in ('member','moderator','admin')),
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  terms_version text,
  privacy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  region text not null,
  category text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_region_created_idx on public.posts(region, created_at desc);
create index if not exists posts_category_created_idx on public.posts(category, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at);

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  title text not null,
  price integer not null check (price >= 0),
  region text not null,
  item_condition text not null default '중고',
  body text not null,
  status text not null default 'active' check (status in ('active','reserved','sold','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketplace_region_created_idx on public.marketplace_items(region, created_at desc);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  business_type text not null,
  name text not null,
  region text not null,
  phone text,
  address text,
  body text not null,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists businesses_region_created_idx on public.businesses(region, created_at desc);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('구인','구직')),
  title text not null,
  region text not null,
  pay text,
  schedule text,
  body text not null,
  status text not null default 'active' check (status in ('active','closed','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_region_created_idx on public.jobs(region, created_at desc);

create table if not exists public.interest_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  room text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, room)
);

create table if not exists public.interest_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  room text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists interest_posts_room_created_idx on public.interest_posts(room, created_at desc);

create table if not exists public.care_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists care_posts_category_created_idx on public.care_posts(category, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','market','business','job','interest_post','care_post')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','resolved','dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id,nickname,primary_region,
    terms_accepted_at,privacy_accepted_at,terms_version,privacy_version
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname','라이더'),
    new.raw_user_meta_data->>'primary_region',
    case when new.raw_user_meta_data->>'terms_accepted' = 'true' then now() else null end,
    case when new.raw_user_meta_data->>'privacy_accepted' = 'true' then now() else null end,
    new.raw_user_meta_data->>'terms_version',
    new.raw_user_meta_data->>'privacy_version'
  )
  on conflict (id) do nothing;

  insert into public.notifications (user_id,type,title,body,href)
  values (
    new.id,
    'system',
    'RiderNex 가입을 환영합니다.',
    '지역방, 장터, 관심방과 라이더 정보를 함께 이용할 수 있습니다.',
    'my.html'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.businesses enable row level security;
alter table public.jobs enable row level security;
alter table public.interest_memberships enable row level security;
alter table public.interest_posts enable row level security;
alter table public.care_posts enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "profile owner update" on public.profiles;
create policy "profile owner update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "posts readable" on public.posts;
create policy "posts readable" on public.posts for select using (true);
drop policy if exists "posts own insert" on public.posts;
create policy "posts own insert" on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists "posts own update" on public.posts;
create policy "posts own update" on public.posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "posts own delete" on public.posts;
create policy "posts own delete" on public.posts for delete using (auth.uid() = author_id);

drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using (true);
drop policy if exists "comments own insert" on public.comments;
create policy "comments own insert" on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists "comments own delete" on public.comments;
create policy "comments own delete" on public.comments for delete using (auth.uid() = author_id);

drop policy if exists "market readable" on public.marketplace_items;
create policy "market readable" on public.marketplace_items for select using (status <> 'hidden');
drop policy if exists "market own insert" on public.marketplace_items;
create policy "market own insert" on public.marketplace_items for insert with check (auth.uid() = author_id);
drop policy if exists "market own update" on public.marketplace_items;
create policy "market own update" on public.marketplace_items for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "market own delete" on public.marketplace_items;
create policy "market own delete" on public.marketplace_items for delete using (auth.uid() = author_id);

drop policy if exists "business readable" on public.businesses;
create policy "business readable" on public.businesses for select using (approval_status in ('approved','pending'));
drop policy if exists "business own insert" on public.businesses;
create policy "business own insert" on public.businesses for insert with check (auth.uid() = author_id);
drop policy if exists "business own update" on public.businesses;
create policy "business own update" on public.businesses for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "jobs readable" on public.jobs;
create policy "jobs readable" on public.jobs for select using (status <> 'hidden');
drop policy if exists "jobs own insert" on public.jobs;
create policy "jobs own insert" on public.jobs for insert with check (auth.uid() = author_id);
drop policy if exists "jobs own update" on public.jobs;
create policy "jobs own update" on public.jobs for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "interest memberships readable" on public.interest_memberships;
create policy "interest memberships readable" on public.interest_memberships for select using (true);
drop policy if exists "interest memberships own insert" on public.interest_memberships;
create policy "interest memberships own insert" on public.interest_memberships for insert with check (auth.uid() = user_id);
drop policy if exists "interest memberships own delete" on public.interest_memberships;
create policy "interest memberships own delete" on public.interest_memberships for delete using (auth.uid() = user_id);

drop policy if exists "interest posts readable" on public.interest_posts;
create policy "interest posts readable" on public.interest_posts for select using (true);
drop policy if exists "interest posts own insert" on public.interest_posts;
create policy "interest posts own insert" on public.interest_posts for insert with check (auth.uid() = author_id);

drop policy if exists "care posts readable" on public.care_posts;
create policy "care posts readable" on public.care_posts for select using (true);
drop policy if exists "care posts own insert" on public.care_posts;
create policy "care posts own insert" on public.care_posts for insert with check (auth.uid() = author_id);

drop policy if exists "notifications own select" on public.notifications;
create policy "notifications own select" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notifications own delete" on public.notifications;
create policy "notifications own delete" on public.notifications for delete using (auth.uid() = user_id);

drop policy if exists "reports own insert" on public.reports;
create policy "reports own insert" on public.reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports own select" on public.reports;
create policy "reports own select" on public.reports for select using (
  auth.uid() = reporter_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('moderator','admin'))
);
drop policy if exists "reports moderator update" on public.reports;
create policy "reports moderator update" on public.reports for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('moderator','admin'))
);


-- Security/performance hardening and notification trigger
revoke all on function public.handle_new_user() from public, anon, authenticated;

create index if not exists businesses_author_id_idx on public.businesses(author_id);
create index if not exists care_posts_author_id_idx on public.care_posts(author_id);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists interest_posts_author_id_idx on public.interest_posts(author_id);
create index if not exists jobs_author_id_idx on public.jobs(author_id);
create index if not exists marketplace_items_author_id_idx on public.marketplace_items(author_id);
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists reports_reviewed_by_idx on public.reports(reviewed_by);

create or replace function public.notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  commenter_name text;
begin
  select author_id into owner_id from public.posts where id = new.post_id;
  if owner_id is null or owner_id = new.author_id then return new; end if;
  select nickname into commenter_name from public.profiles where id = new.author_id;
  insert into public.notifications(user_id,type,title,body,href)
  values(owner_id,'comment',coalesce(commenter_name,'회원') || '님이 내 글에 댓글을 남겼습니다.',left(new.body,160),'region.html');
  return new;
end;
$$;

revoke all on function public.notify_post_comment() from public, anon, authenticated;

drop trigger if exists on_comment_created_notify on public.comments;
create trigger on_comment_created_notify
after insert on public.comments
for each row execute function public.notify_post_comment();


-- Admin/moderation hardening
revoke update on public.profiles from authenticated;
grant update (nickname, primary_region, secondary_region, bio, bike, updated_at)
on public.profiles to authenticated;

drop policy if exists "business readable" on public.businesses;
create policy "business readable" on public.businesses for select
using (
  approval_status = 'approved'
  or author_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('moderator','admin')
  )
);

drop policy if exists "business own insert" on public.businesses;
create policy "business own insert" on public.businesses for insert
with check (
  (select auth.uid()) = author_id
  and (
    approval_status = 'pending'
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('moderator','admin')
    )
  )
);

create or replace function public.protect_business_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare caller_role text;
begin
  if new.approval_status is distinct from old.approval_status then
    select role into caller_role from public.profiles where id = auth.uid();
    if caller_role not in ('moderator','admin') then
      raise exception 'Only moderators or admins can change business approval status';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_business_approval_status() from public, anon, authenticated;

drop trigger if exists protect_business_approval_status_trigger on public.businesses;
create trigger protect_business_approval_status_trigger
before update on public.businesses
for each row execute function public.protect_business_approval_status();

drop policy if exists "market moderator update" on public.marketplace_items;
create policy "market moderator update" on public.marketplace_items for update
using (
  exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('moderator','admin'))
)
with check (
  exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('moderator','admin'))
);

drop policy if exists "business moderator update" on public.businesses;
create policy "business moderator update" on public.businesses for update
using (
  exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('moderator','admin'))
)
with check (
  exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('moderator','admin'))
);

drop policy if exists "jobs moderator update" on public.jobs;
create policy "jobs moderator update" on public.jobs for update
using (
  exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('moderator','admin'))
)
with check (
  exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('moderator','admin'))
);


-- NexHome V1 foundation
create table if not exists public.nexhomes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  life_region text not null check (char_length(btrim(life_region)) between 2 and 80),
  room_name text not null check (char_length(btrim(room_name)) between 2 and 30),
  road_no integer not null check (road_no between 1 and 9999),
  house_no integer not null check (house_no between 1 and 9999),
  intro text not null default '오늘도 안전하게 달립니다.' check (char_length(intro) <= 80),
  cover_url text,
  profile_url text,
  theme text not null default 'light' check (theme in ('light','blue','dark')),
  entry_scope text not null default 'public' check (entry_scope in ('public','friends','private')),
  guestbook_scope text not null default 'friends' check (guestbook_scope in ('all','friends','off')),
  menu_order jsonb not null default '["home","records","photos","guestbook","friends"]'::jsonb,
  menu_hidden jsonb not null default '[]'::jsonb,
  first_visit boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists nexhomes_room_name_unique_idx on public.nexhomes (lower(btrim(room_name)));
create unique index if not exists nexhomes_address_unique_idx on public.nexhomes (lower(btrim(life_region)), road_no, house_no);
create index if not exists nexhomes_owner_id_idx on public.nexhomes(owner_id);
alter table public.nexhomes enable row level security;
grant select on public.nexhomes to anon, authenticated;
grant insert, update, delete on public.nexhomes to authenticated;

drop policy if exists "nexhomes public or owner read" on public.nexhomes;
create policy "nexhomes public or owner read" on public.nexhomes for select to anon, authenticated
using (entry_scope = 'public' or (select auth.uid()) = owner_id);
drop policy if exists "nexhomes owner insert" on public.nexhomes;
create policy "nexhomes owner insert" on public.nexhomes for insert to authenticated
with check ((select auth.uid()) = owner_id);
drop policy if exists "nexhomes owner update" on public.nexhomes;
create policy "nexhomes owner update" on public.nexhomes for update to authenticated
using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "nexhomes owner delete" on public.nexhomes;
create policy "nexhomes owner delete" on public.nexhomes for delete to authenticated
using ((select auth.uid()) = owner_id);

create or replace function public.check_nexhome_availability(
  p_life_region text, p_room_name text, p_road_no integer, p_house_no integer
)
returns table(room_name_available boolean, address_available boolean)
language sql stable security definer set search_path = public
as $$
  select
    not exists (select 1 from public.nexhomes where lower(btrim(room_name)) = lower(btrim(p_room_name))),
    not exists (
      select 1 from public.nexhomes
      where lower(btrim(life_region)) = lower(btrim(p_life_region))
        and road_no = p_road_no and house_no = p_house_no
    );
$$;
revoke all on function public.check_nexhome_availability(text,text,integer,integer) from public, anon;
grant execute on function public.check_nexhome_availability(text,text,integer,integer) to authenticated;


-- ============================================================
-- NexHome V1 records
-- ============================================================
create table if not exists public.nexhome_records (
  id uuid primary key default gen_random_uuid(),
  nexhome_id uuid not null references public.nexhomes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 12000),
  visibility text not null default 'public' check (visibility in ('public','friends','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nexhome_records_home_created_idx
  on public.nexhome_records(nexhome_id, created_at desc);
create index if not exists nexhome_records_author_idx
  on public.nexhome_records(author_id);

alter table public.nexhome_records enable row level security;

grant select on public.nexhome_records to anon, authenticated;
grant insert, update, delete on public.nexhome_records to authenticated;

drop policy if exists "NexHome records readable" on public.nexhome_records;
create policy "NexHome records readable"
on public.nexhome_records
for select
to anon, authenticated
using (
  visibility = 'public'
  or author_id = (select auth.uid())
);

drop policy if exists "NexHome owner can create records" on public.nexhome_records;
create policy "NexHome owner can create records"
on public.nexhome_records
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and nexhome_id in (
    select id from public.nexhomes
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "NexHome owner can update records" on public.nexhome_records;
create policy "NexHome owner can update records"
on public.nexhome_records
for update
to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and nexhome_id in (
    select id from public.nexhomes
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "NexHome owner can delete records" on public.nexhome_records;
create policy "NexHome owner can delete records"
on public.nexhome_records
for delete
to authenticated
using (author_id = (select auth.uid()));


-- ============================================================
-- NexHome public media bucket
-- ============================================================
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'nexhome-media',
  'nexhome-media',
  true,
  6291456,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "NexHome users upload own media" on storage.objects;
create policy "NexHome users upload own media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'nexhome-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "NexHome users delete own media" on storage.objects;
create policy "NexHome users delete own media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'nexhome-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);


-- ============================================================
-- NexHome V1 photo albums
-- ============================================================
create table if not exists public.nexhome_albums (
  id uuid primary key default gen_random_uuid(),
  nexhome_id uuid not null references public.nexhomes(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  description text not null default '',
  visibility text not null default 'public' check (visibility in ('public','friends','private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nexhome_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.nexhome_albums(id) on delete cascade,
  nexhome_id uuid not null references public.nexhomes(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  caption text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists nexhome_albums_home_created_idx
  on public.nexhome_albums(nexhome_id, created_at desc);
create index if not exists nexhome_photos_album_created_idx
  on public.nexhome_photos(album_id, created_at desc);
create index if not exists nexhome_photos_home_idx
  on public.nexhome_photos(nexhome_id);
create index if not exists nexhome_albums_owner_idx
  on public.nexhome_albums(owner_id);
create index if not exists nexhome_photos_owner_idx
  on public.nexhome_photos(owner_id);

alter table public.nexhome_albums enable row level security;
alter table public.nexhome_photos enable row level security;

grant select on public.nexhome_albums, public.nexhome_photos to anon, authenticated;
grant insert, update, delete on public.nexhome_albums, public.nexhome_photos to authenticated;

drop policy if exists "NexHome albums readable" on public.nexhome_albums;
create policy "NexHome albums readable"
on public.nexhome_albums
for select
to anon, authenticated
using (
  visibility = 'public'
  or owner_id = (select auth.uid())
);

drop policy if exists "NexHome owner can create albums" on public.nexhome_albums;
create policy "NexHome owner can create albums"
on public.nexhome_albums
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and nexhome_id in (
    select id from public.nexhomes
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "NexHome owner can update albums" on public.nexhome_albums;
create policy "NexHome owner can update albums"
on public.nexhome_albums
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and nexhome_id in (
    select id from public.nexhomes
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "NexHome owner can delete albums" on public.nexhome_albums;
create policy "NexHome owner can delete albums"
on public.nexhome_albums
for delete
to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "NexHome photos readable" on public.nexhome_photos;
create policy "NexHome photos readable"
on public.nexhome_photos
for select
to anon, authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.nexhome_albums a
    where a.id = album_id
      and a.visibility = 'public'
  )
);

drop policy if exists "NexHome owner can create photos" on public.nexhome_photos;
create policy "NexHome owner can create photos"
on public.nexhome_photos
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and nexhome_id in (
    select id from public.nexhomes
    where owner_id = (select auth.uid())
  )
  and album_id in (
    select id from public.nexhome_albums
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "NexHome owner can update photos" on public.nexhome_photos;
create policy "NexHome owner can update photos"
on public.nexhome_photos
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "NexHome owner can delete photos" on public.nexhome_photos;
create policy "NexHome owner can delete photos"
on public.nexhome_photos
for delete
to authenticated
using (owner_id = (select auth.uid()));
