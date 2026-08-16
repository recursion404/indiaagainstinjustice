-- Promote the requested existing account without exposing or changing its auth credentials.
drop trigger if exists profiles_protect_role on public.profiles;

insert into public.profiles (id, full_name, role)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', email),
  'admin'
from auth.users
where lower(email) = lower('ganeshpawar.me@gmail.com')
on conflict (id) do update
set role = 'admin';

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.prevent_citizen_role_escalation();
