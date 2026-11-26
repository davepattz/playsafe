begin;

create role playsafe_v2_app nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
grant usage on schema public to playsafe_v2_app;
grant select, insert, update on public.v2_game_metadata, public.v2_game_catalogue, public.v2_game_popularity to playsafe_v2_app;
grant select, insert, update, delete on public.v2_request_windows to playsafe_v2_app;

create policy v2_shared_metadata on public.v2_game_metadata to playsafe_v2_app using (true) with check (true);
create policy v2_shared_catalogue on public.v2_game_catalogue to playsafe_v2_app using (true) with check (true);
create policy v2_shared_popularity on public.v2_game_popularity to playsafe_v2_app using (true) with check (true);
create policy v2_shared_windows on public.v2_request_windows to playsafe_v2_app using (true) with check (true);

grant execute on function public.v2_save_metadata(bigint,text,text,jsonb,jsonb,jsonb,timestamptz,timestamptz) to playsafe_v2_app;
grant execute on function public.v2_find_games(text,text,text) to playsafe_v2_app;
grant execute on function public.v2_increment_popularity(bigint,text) to playsafe_v2_app;
grant execute on function public.v2_allow_request(text,text,integer,integer) to playsafe_v2_app;

do $$
declare
  legacy regclass := to_regclass('public.steam_results_cache');
begin
  if legacy is not null and (
    has_table_privilege('playsafe_v2_app', legacy, 'INSERT, UPDATE, DELETE, TRUNCATE')
    or has_any_column_privilege('playsafe_v2_app', legacy, 'INSERT, UPDATE')
  ) then
    raise exception 'The shared V2 role must not have write access to the legacy cache';
  end if;
end;
$$;

commit;
