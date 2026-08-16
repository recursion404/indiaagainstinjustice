create or replace function public.increment_issue_share_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.traffic_issues
  set share_count = share_count + 1
  where id = new.issue_id;

  return new;
end;
$$;

create trigger issue_share_events_increment_count
  after insert on public.issue_share_events
  for each row execute function public.increment_issue_share_count();
