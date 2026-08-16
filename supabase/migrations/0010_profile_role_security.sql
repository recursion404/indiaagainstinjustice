create or replace function public.prevent_citizen_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only an administrator can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.prevent_citizen_role_escalation();

drop policy if exists "Anyone can submit volunteer request" on public.volunteer_requests;

create policy "Anyone can submit volunteer request"
  on public.volunteer_requests for insert
  with check (user_id is null or user_id = auth.uid());
