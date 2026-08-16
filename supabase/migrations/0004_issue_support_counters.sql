create or replace function public.increment_issue_support_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.traffic_issues
  set support_count = support_count + 1
  where id = new.issue_id;

  return new;
end;
$$;

create or replace function public.decrement_issue_support_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.traffic_issues
  set support_count = greatest(support_count - 1, 0)
  where id = old.issue_id;

  return old;
end;
$$;

create trigger issue_supports_increment_count
  after insert on public.issue_supports
  for each row execute function public.increment_issue_support_count();

create trigger issue_supports_decrement_count
  after delete on public.issue_supports
  for each row execute function public.decrement_issue_support_count();
