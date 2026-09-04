create policy "Room members can insert room presence"
on realtime.messages
for insert
to authenticated
with check (
  extension = 'presence'
  and (select realtime.topic()) like 'room:%:presence'
  and exists (
    select 1
    from public.chat_room_members
    where public.chat_room_members.chat_room_id = split_part((select realtime.topic()), ':', 2)::uuid
      and public.chat_room_members.member_id = (select auth.uid())
  )
);

create policy "Room members can read room presence"
on realtime.messages
for select
to authenticated
using (
  extension = 'presence'
  and (select realtime.topic()) like 'room:%:presence'
  and exists (
    select 1
    from public.chat_room_members
    where public.chat_room_members.chat_room_id = split_part((select realtime.topic()), ':', 2)::uuid
      and public.chat_room_members.member_id = (select auth.uid())
  )
);
