create or replace function public.broadcast_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_name text;
  author_image_url text;
begin
  select user_profile.name, user_profile.image_url
  into author_name, author_image_url
  from public.user_profile
  where user_profile.id = new.author_id;

  perform realtime.send(
    jsonb_build_object(
      'id', new.id,
      'text', new.text,
      'created_at', new.created_at,
      'author_name', author_name,
      'author_image_url', author_image_url
    ),
    'INSERT',
    'room:' || new.chat_room_id::text || ':messages',
    true
  );

  return new;
end;
$$;

revoke all on function public.broadcast_new_message() from public;

create or replace trigger on_message_insert_broadcast
after insert on public.message
for each row
execute function public.broadcast_new_message();
