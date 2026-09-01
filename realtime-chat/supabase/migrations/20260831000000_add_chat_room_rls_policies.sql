create policy "Users can read their own memberships"
on public.chat_room_members
for select
to authenticated
using ((select auth.uid()) = member_id);

create policy "Users can join public rooms"
on public.chat_room_members
for insert
to authenticated
with check (
  (select auth.uid()) = member_id
  and exists (
    select 1
    from public.chat_room
    where public.chat_room.id = chat_room_id
      and public.chat_room.is_public = true
  )
);

create policy "Users can leave rooms"
on public.chat_room_members
for delete
to authenticated
using ((select auth.uid()) = member_id);

create policy "Anyone can read public chat rooms"
on public.chat_room
for select
to authenticated
using (is_public = true);

create policy "Room members can read messages"
on public.message for select to authenticated
using (exists (select 1 from public.chat_room_members
  where chat_room_members.chat_room_id = message.chat_room_id
    and chat_room_members.member_id = (select auth.uid())));

create policy "Room members can send messages"
on public.message for insert to authenticated
with check (author_id = (select auth.uid()) and exists (select 1 from public.chat_room_members
  where chat_room_members.chat_room_id = message.chat_room_id
    and chat_room_members.member_id = (select auth.uid())));
