begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
set local search_path = public, extensions, pg_catalog;

create table public.v2_game_metadata (
  app_id bigint not null check (app_id between 1 and 4294967295),
  region text not null,
  language text not null,
  metadata jsonb not null check (jsonb_typeof(metadata) = 'object'),
  sources jsonb not null check (jsonb_typeof(sources) = 'object'),
  coverage jsonb not null check (jsonb_typeof(coverage) = 'object'),
  retrieved_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > retrieved_at),
  primary key (app_id, region, language)
);
create index v2_game_metadata_expiry on public.v2_game_metadata (expires_at);

create table public.v2_game_catalogue (
  app_id bigint not null check (app_id between 1 and 4294967295),
  region text not null,
  language text not null,
  title text not null check (length(title) between 1 and 300),
  search_name text generated always as (lower(title)) stored,
  capsule_image text,
  release_year integer,
  platforms text[],
  source text not null check (source in ('steam_store', 'steam_app_list')),
  observed_at timestamptz not null default now(),
  primary key (app_id, region, language)
);
create index v2_game_catalogue_prefix on public.v2_game_catalogue
  (region, language, search_name text_pattern_ops);
create index v2_game_catalogue_name_trgm on public.v2_game_catalogue
  using gin (search_name gin_trgm_ops);

create table public.v2_game_popularity (
  day date not null,
  app_id bigint not null check (app_id between 1 and 4294967295),
  region text not null,
  report_views bigint not null default 1 check (report_views > 0),
  primary key (day, app_id, region)
);

create table public.v2_request_windows (
  bucket text not null,
  minute bigint not null,
  request_count integer not null,
  primary key (bucket, minute)
);
create index v2_request_windows_expiry on public.v2_request_windows (minute);

alter table public.v2_game_metadata enable row level security;
alter table public.v2_game_catalogue enable row level security;
alter table public.v2_game_popularity enable row level security;
alter table public.v2_request_windows enable row level security;

revoke all on public.v2_game_metadata, public.v2_game_catalogue, public.v2_game_popularity, public.v2_request_windows from public, anon, authenticated, service_role;
grant select, insert, update on public.v2_game_metadata, public.v2_game_catalogue, public.v2_game_popularity to service_role;
grant select, insert, update, delete on public.v2_request_windows to service_role;

create function public.v2_save_metadata(
  p_app_id bigint, p_region text, p_language text, p_metadata jsonb, p_sources jsonb,
  p_coverage jsonb, p_retrieved_at timestamptz, p_expires_at timestamptz
) returns boolean
language sql volatile security invoker set search_path = ''
as $$
  with saved as (
    insert into public.v2_game_metadata as previous
      (app_id, region, language, metadata, sources, coverage, retrieved_at, expires_at)
    values (p_app_id, p_region, p_language, p_metadata, p_sources, p_coverage, p_retrieved_at, p_expires_at)
    on conflict (app_id, region, language) do update
      set metadata = excluded.metadata, sources = excluded.sources, coverage = excluded.coverage,
          retrieved_at = excluded.retrieved_at, expires_at = excluded.expires_at
      where excluded.retrieved_at > previous.retrieved_at
        and excluded.coverage @> previous.coverage
    returning 1
  )
  select exists (select 1 from saved);
$$;

create function public.v2_find_games(p_query text, p_region text, p_language text)
returns table (app_id bigint, title text, capsule_image text, release_year integer, platforms text[])
language sql stable security invoker set search_path = ''
as $$
  with needle as (
    select lower(trim(p_query)) as term,
      replace(replace(replace(lower(trim(p_query)), '\', '\\'), '%', '\%'), '_', '\_') as pattern
  ), candidates as (
    select distinct on (game.app_id) game.*, needle.term, needle.pattern
    from public.v2_game_catalogue game cross join needle
    where length(needle.term) between 2 and 100
      and game.observed_at >= now() - interval '30 days'
      and ((game.region = p_region and game.language = p_language) or (game.region = '*' and game.language = '*'))
      and (game.search_name like needle.pattern || '%' or
        (length(needle.term) >= 3 and game.search_name like '%' || needle.pattern || '%'))
    order by game.app_id, (game.region = p_region and game.language = p_language) desc
  )
  select candidates.app_id, candidates.title, candidates.capsule_image, candidates.release_year, candidates.platforms
  from candidates
  order by case when search_name = term then 0 when search_name like pattern || '%' then 1 else 2 end,
    search_name, candidates.app_id
  limit 8;
$$;

create function public.v2_increment_popularity(p_app_id bigint, p_region text)
returns void
language sql volatile security invoker set search_path = ''
as $$
  insert into public.v2_game_popularity as daily (day, app_id, region)
    values ((now() at time zone 'UTC')::date, p_app_id, p_region)
    on conflict (day, app_id, region) do update set report_views = daily.report_views + 1;
$$;

create function public.v2_allow_request(p_scope text, p_client text, p_global_limit integer, p_client_limit integer)
returns boolean
language plpgsql volatile security invoker set search_path = ''
as $$
declare
  current_minute bigint := floor(extract(epoch from clock_timestamp()) / 60);
  hits integer;
begin
  if p_scope not in ('search', 'metadata', 'report') then return false; end if;
  if random() < 0.01 then
    delete from public.v2_request_windows where minute < current_minute - 2;
  end if;
  if p_client is not null then
    insert into public.v2_request_windows as counter (bucket, minute, request_count)
      values (p_scope || ':' || p_client, current_minute, 1)
      on conflict (bucket, minute) do update set request_count = counter.request_count + 1
        where counter.request_count < p_client_limit
      returning request_count into hits;
    if hits is null then return false; end if;
  end if;
  insert into public.v2_request_windows as counter (bucket, minute, request_count)
    values (p_scope || ':global', current_minute, 1)
    on conflict (bucket, minute) do update set request_count = counter.request_count + 1
      where counter.request_count < p_global_limit
    returning request_count into hits;
  return hits is not null;
end;
$$;

revoke all on function public.v2_save_metadata(bigint,text,text,jsonb,jsonb,jsonb,timestamptz,timestamptz) from public, anon, authenticated;
revoke all on function public.v2_find_games(text,text,text) from public, anon, authenticated;
revoke all on function public.v2_increment_popularity(bigint,text) from public, anon, authenticated;
revoke all on function public.v2_allow_request(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.v2_save_metadata(bigint,text,text,jsonb,jsonb,jsonb,timestamptz,timestamptz) to service_role;
grant execute on function public.v2_find_games(text,text,text) to service_role;
grant execute on function public.v2_increment_popularity(bigint,text) to service_role;
grant execute on function public.v2_allow_request(text,text,integer,integer) to service_role;

commit;
