begin;

do $$
declare
  legacy regclass := to_regclass('public.steam_results_cache');
begin
  if legacy is not null and has_table_privilege('playsafe_v2_app', legacy, 'INSERT, UPDATE, DELETE, TRUNCATE')
    then raise exception 'Shared role has legacy cache write permissions'; end if;
  if has_table_privilege('playsafe_v2_app', 'public.v2_game_metadata', 'DELETE, TRUNCATE')
    or has_table_privilege('playsafe_v2_app', 'public.v2_game_catalogue', 'DELETE, TRUNCATE')
    or has_table_privilege('playsafe_v2_app', 'public.v2_game_popularity', 'DELETE, TRUNCATE')
    then raise exception 'Shared role has unnecessary V2 write permissions'; end if;
  if pg_has_role('playsafe_v2_app', 'service_role', 'MEMBER')
    then raise exception 'Shared role can assume the service role'; end if;
end;
$$;

set local role playsafe_v2_app;

do $$
declare
  fixture bigint := 4294967294;
  clock timestamptz := clock_timestamp();
begin
  if not public.v2_save_metadata(fixture, 'AU', 'english', '{"title":"fixture"}', '{}', '{}', clock, clock + interval '1 day')
    then raise exception 'Shared role could not save a V2 snapshot'; end if;
  if (select metadata->>'title' from public.v2_game_metadata where app_id=fixture and region='AU' and language='english') <> 'fixture'
    then raise exception 'Shared role could not read its V2 snapshot'; end if;
  insert into public.v2_game_catalogue(app_id, region, language, title, source)
    values (fixture,'AU','english','Shared role fixture','steam_store');
  if (select app_id from public.v2_find_games('Shared role fixture','AU','english') limit 1) <> fixture
    then raise exception 'Shared role could not search the catalogue'; end if;
  perform public.v2_increment_popularity(fixture,'AU');
  if (select report_views from public.v2_game_popularity where app_id=fixture and region='AU') <> 1
    then raise exception 'Shared role could not record popularity'; end if;
  if not public.v2_allow_request('search','shared-sql-fixture',500000,1)
    or public.v2_allow_request('search','shared-sql-fixture',500000,1)
    then raise exception 'Shared role limiter failed'; end if;
end;
$$;

rollback;
