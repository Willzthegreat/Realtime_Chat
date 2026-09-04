create policy "Room members can join message channels"
on realtime.messages
for select
to authenticated
using (
  (select realtime.topic()) like 'room:%:messages'
  and exists (
    select 1
    from public.chat_room_members
    where public.chat_room_members.chat_room_id = split_part((select realtime.topic()), ':', 2)::uuid
      and public.chat_room_members.member_id = (select auth.uid())
  )
);
