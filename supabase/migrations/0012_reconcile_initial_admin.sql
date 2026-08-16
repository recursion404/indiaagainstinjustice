-- The first admin migration may have run before the account was created.
-- Reconcile the now-existing account while preserving role-escalation protection.
drop trigger if exists profiles_protect_role on public.profiles;

update public.profiles
set role = 'admin'
where id in (
  select id
  from auth.users
  where lower(email) = lower('ganeshpawar.me@gmail.com')
);

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.prevent_citizen_role_escalation();
