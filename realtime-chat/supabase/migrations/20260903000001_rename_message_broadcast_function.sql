do $$
begin
  if exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'broadcast_message_insert'
      and pg_proc.proargtypes = ''::oidvector
  ) and not exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'broadcast_new_message'
      and pg_proc.proargtypes = ''::oidvector
  ) then
    alter function public.broadcast_message_insert() rename to broadcast_new_message;
  end if;
end
$$;

revoke all on function public.broadcast_new_message() from public;
