create policy "Authenticated users can read user profiles"
on public.user_profile
for select
to authenticated
using (true);