create policy "Users insert messages for rooms they are members of"
on public.message
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.chat_room_members
    where chat_room_members.chat_room_id = message.chat_room_id
      and chat_room_members.member_id = (select auth.uid())
  )
);

create policy "Users can read messages from rooms they are members of"
on public.message
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_room_members
    where chat_room_members.chat_room_id = message.chat_room_id
      and chat_room_members.member_id = (select auth.uid())
  )
);
