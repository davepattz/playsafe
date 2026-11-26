begin;

alter role playsafe_v2_app nologin;
drop policy v2_shared_metadata on public.v2_game_metadata;
drop policy v2_shared_catalogue on public.v2_game_catalogue;
drop policy v2_shared_popularity on public.v2_game_popularity;
drop policy v2_shared_windows on public.v2_request_windows;

revoke all on public.v2_game_metadata, public.v2_game_catalogue, public.v2_game_popularity,
  public.v2_request_windows from playsafe_v2_app;
revoke execute on function public.v2_save_metadata(bigint,text,text,jsonb,jsonb,jsonb,timestamptz,timestamptz),
  public.v2_find_games(text,text,text), public.v2_increment_popularity(bigint,text),
  public.v2_allow_request(text,text,integer,integer) from playsafe_v2_app;
revoke usage on schema public from playsafe_v2_app;
drop role playsafe_v2_app;

commit;
