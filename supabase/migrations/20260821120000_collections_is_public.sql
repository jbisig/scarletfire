-- supabase/migrations/20260821120000_collections_is_public.sql
--
-- WHAT: Adds `collections.is_public` — the owner-facing Public/Private
-- toggle — and routes every discovery surface through it:
--   * get_activity_feed hides collection events whose target is private or
--     gone (previously "X created a playlist" linked to "not found");
--   * get_popular_collections gates on is_public instead of is_shared.
--
-- WHY: `is_shared` means "the share link works" and is flipped silently the
-- first time the owner shares. It was doing double duty as "discoverable",
-- and new collections (is_shared = false) were announced to followers who
-- then couldn't open them. Two flags, two meanings:
--   is_shared  -> anyone with the link can read it (RLS, unchanged)
--   is_public  -> listed on the profile, in Popular, and in the feed
-- Private + shared = unlisted.
--
-- BACKFILL: is_public = is_shared, so nothing visible today disappears
-- (grandfathered rows were all is_shared = true). New rows default false.
--
-- DEPENDS ON: 20260706120000_collections_sharing_flag.sql (is_shared),
-- 20260706130000_feed_streams_search_avatar_auth_uid.sql (feed signature).
--
-- Never edit this file after it has been applied anywhere — create a new
-- migration instead.

alter table public.collections
  add column if not exists is_public boolean not null default false;

-- Same trigger dance as the is_shared grandfathering: don't let a blanket
-- UPDATE stamp updated_at (it drives recency ordering).
alter table public.collections disable trigger collections_set_updated_at;
update public.collections set is_public = is_shared where is_public <> is_shared;
alter table public.collections enable trigger collections_set_updated_at;

-- The feed's EXISTS probe and the profile listing both filter on this.
create index if not exists collections_public_idx
  on public.collections (user_id, updated_at desc)
  where is_public = true;

-- ---------------------------------------------------------------------------
-- get_activity_feed: same signature/shape as 20260706130000, plus a target
-- check on collection events. security invoker, so the EXISTS runs under the
-- viewer's RLS — public rows are also is_shared, so they're readable.
-- ---------------------------------------------------------------------------
create or replace function public.get_activity_feed(
  following_cursor   timestamptz default null,
  public_cursor      timestamptz default null,
  include_following  boolean     default true,
  include_public     boolean     default true,
  page_size          int         default 30
)
returns table (
  id                  uuid,
  actor_id            uuid,
  event_type          text,
  target_type         text,
  target_id           text,
  metadata            jsonb,
  created_at          timestamptz,
  source              text,
  actor_username      text,
  actor_display_name  text,
  actor_avatar_url    text
)
language sql
stable
security invoker
set search_path = public
as $$
  with viewer as (
    select auth.uid() as id
  ),
  following_events as (
    select e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'following'::text as source,
           p.username as actor_username,
           p.display_name as actor_display_name,
           p.avatar_url as actor_avatar_url
    from public.activity_events e
    join viewer v on true
    join public.user_follows f
      on f.following_id = e.actor_id and f.follower_id = v.id
    join public.profiles p
      on p.id = e.actor_id and p.is_public = true
    where include_following
      and (following_cursor is null or e.created_at < following_cursor)
      and e.actor_id <> v.id
      and (
        e.target_type <> 'collection'
        or exists (
          select 1 from public.collections c
          where c.id::text = e.target_id and c.is_public = true
        )
      )
    order by e.created_at desc
    limit page_size
  ),
  public_events as (
    select e.id, e.actor_id, e.event_type, e.target_type, e.target_id,
           e.metadata, e.created_at, 'public'::text as source,
           p.username as actor_username,
           p.display_name as actor_display_name,
           p.avatar_url as actor_avatar_url
    from public.activity_events e
    join viewer v on true
    join public.profiles p
      on p.id = e.actor_id and p.is_public = true
    where include_public
      and (public_cursor is null or e.created_at < public_cursor)
      and e.actor_id <> v.id
      and not exists (
        select 1 from public.user_follows f
        where f.follower_id = v.id and f.following_id = e.actor_id
      )
      and (
        e.target_type <> 'collection'
        or exists (
          select 1 from public.collections c
          where c.id::text = e.target_id and c.is_public = true
        )
      )
    order by e.created_at desc
    limit ceil(page_size / 4.0)
  )
  select * from following_events
  union all
  select * from public_events
  order by created_at desc
  limit page_size;
$$;

grant execute on function public.get_activity_feed(timestamptz, timestamptz, boolean, boolean, int) to authenticated;

-- ---------------------------------------------------------------------------
-- get_popular_collections: identical to 20260706120500 except the gate.
-- ---------------------------------------------------------------------------
create or replace function public.get_popular_collections(
  p_type text,
  p_limit int default 10
)
returns table (
  id uuid,
  user_id uuid,
  name text,
  type text,
  description text,
  cover_image_url text,
  slug text,
  created_at timestamptz,
  updated_at timestamptz,
  item_count bigint,
  save_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.user_id,
    c.name,
    c.type,
    c.description,
    c.cover_image_url,
    c.slug,
    c.created_at,
    c.updated_at,
    (select count(*) from public.collection_items ci where ci.collection_id = c.id) as item_count,
    coalesce(sc.save_count, 0) as save_count
  from public.collections c
  inner join public.profiles p on p.id = c.user_id and p.is_public = true
  left join (
    select collection_id, count(*) as save_count
    from public.saved_collections
    where collection_id is not null
    group by collection_id
  ) sc on sc.collection_id = c.id
  where c.type = p_type
    and c.is_public = true
  order by coalesce(sc.save_count, 0) desc, c.updated_at desc
  limit greatest(p_limit, 0);
$$;
