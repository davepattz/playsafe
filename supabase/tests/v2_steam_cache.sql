begin;

do $$
begin
  if has_table_privilege('anon', 'public.v2_game_metadata', 'SELECT')
    or has_table_privilege('authenticated', 'public.v2_game_catalogue', 'SELECT')
    or has_function_privilege('anon', 'public.v2_find_games(text,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.v2_allow_request(text,text,integer,integer)', 'EXECUTE') then
    raise exception 'Unprivileged roles have V2 access';
  end if;
  if (select count(*) from pg_class where relnamespace = 'public'::regnamespace
    and relname in ('v2_game_metadata', 'v2_game_catalogue', 'v2_game_popularity', 'v2_request_windows')
    and relrowsecurity) <> 4 then raise exception 'RLS is missing'; end if;
end;
$$;

set local role service_role;

do $$
declare
  fixture bigint := 4294967293;
  instant timestamptz := '2026-11-25 00:00Z';
begin
  if not public.v2_save_metadata(fixture,'AU','english','{"title":"fixture"}','{}','{"rating":true}',instant,instant + interval '7 days')
    then raise exception 'Initial insert failed'; end if;
  if public.v2_save_metadata(fixture,'AU','english','{}','{}','{}',instant + interval '1 day',instant + interval '8 days')
    then raise exception 'Coverage downgrade overwrote the cache'; end if;
  if public.v2_save_metadata(fixture,'AU','english','{}','{}','{"rating":true}',instant - interval '1 day',instant + interval '6 days')
    then raise exception 'An older observation overwrote the cache'; end if;
  if not public.v2_save_metadata(fixture,'AU','english','{"title":"updated"}','{}','{"rating":true,"tags":true}',instant + interval '1 day',instant + interval '8 days')
    then raise exception 'A newer, more complete observation was rejected'; end if;
  if not public.v2_save_metadata(fixture,'US','english','{}','{}','{}',instant,instant + interval '7 days')
    then raise exception 'Region must be part of the identity'; end if;
  if not public.v2_save_metadata(fixture,'AU','french','{}','{}','{}',instant,instant + interval '7 days')
    then raise exception 'Language must be part of the identity'; end if;

  insert into public.v2_game_catalogue (app_id,region,language,title,source) values
    (fixture,'*','*','Phase Five Fixture Extended','steam_app_list'),
    (fixture,'AU','english','Phase Five Fixture','steam_store'),
    (fixture - 1,'AU','english','Phase Five Fixture Adventure','steam_store'),
    (fixture - 2,'US','english','Phase Five Fixture US Only','steam_store'),
    (fixture - 3,'AU','english','Phase Five Fixture 100%','steam_store');
  if (select title from public.v2_find_games('Phase Five Fixture','AU','english') limit 1) <> 'Phase Five Fixture'
    then raise exception 'Regional exact match should rank first'; end if;
  if (select count(*) from public.v2_find_games('Five Fixture','AU','english')) <> 3
    then raise exception 'Substring, regional filtering or deduplication failed'; end if;
  if (select count(*) from public.v2_find_games('100%','AU','english')) <> 1
    then raise exception 'Percent is treated as wildcard'; end if;

  perform public.v2_increment_popularity(fixture,'AU');
  perform public.v2_increment_popularity(fixture,'AU');
  if (select report_views from public.v2_game_popularity where app_id=fixture and region='AU') <> 2
    then raise exception 'Daily counter failed'; end if;
  if not public.v2_allow_request('search','sql-fixture',500000,1)
    or public.v2_allow_request('search','sql-fixture',500000,1)
    then raise exception 'Per-client limit failed'; end if;
  delete from public.v2_request_windows where bucket = 'metadata:global';
  if not public.v2_allow_request('metadata',null,1,1)
    or public.v2_allow_request('metadata',null,1,1)
    then raise exception 'Global limit failed'; end if;
end;
$$;

rollback;
