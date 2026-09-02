create policy "Room members can insert presence"
on realtime.messages
for insert
to authenticated
with check (
  extension = 'presence'
  and (select realtime.topic()) like 'room:%:messages'
  and exists (
    select 1
    from public.chat_room_members
    where chat_room_members.chat_room_id = split_part((select realtime.topic()), ':', 2)::uuid
      and chat_room_members.member_id = (select auth.uid())
  )
);

create policy "Room members can read presence"
on realtime.messages
for select
to authenticated
using (
  extension = 'presence'
  and (select realtime.topic()) like 'room:%:messages'
  and exists (
    select 1
    from public.chat_room_members
    where chat_room_members.chat_room_id = split_part((select realtime.topic()), ':', 2)::uuid
      and chat_room_members.member_id = (select auth.uid())
  )
);

create policy "Room members can receive message broadcasts"
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) like 'room:%:messages'
  and exists (
    select 1
    from public.chat_room_members
    where chat_room_members.chat_room_id = split_part((select realtime.topic()), ':', 2)::uuid
      and chat_room_members.member_id = (select auth.uid())
  )
);
