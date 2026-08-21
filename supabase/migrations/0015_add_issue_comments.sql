-- Migration: Add comments to traffic issues with comment counters and triggers

-- 1. Create issue_comments table
create table if not exists public.issue_comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.traffic_issues(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);

-- 2. Add comment_count column to traffic_issues
alter table public.traffic_issues add column if not exists comment_count integer not null default 0;

-- 3. Trigger to increment comment_count
create or replace function public.increment_issue_comment_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.traffic_issues
  set comment_count = comment_count + 1
  where id = new.issue_id;
  return new;
end;
$$;

drop trigger if exists issue_comments_on_insert on public.issue_comments;
create trigger issue_comments_on_insert
  after insert on public.issue_comments
  for each row execute function public.increment_issue_comment_count();

-- 4. Trigger to decrement comment_count
create or replace function public.decrement_issue_comment_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.traffic_issues
  set comment_count = greatest(comment_count - 1, 0)
  where id = old.issue_id;
  return old;
end;
$$;

drop trigger if exists issue_comments_on_delete on public.issue_comments;
create trigger issue_comments_on_delete
  after delete on public.issue_comments
  for each row execute function public.decrement_issue_comment_count();

-- 5. Enable RLS on issue_comments
alter table public.issue_comments enable row level security;

-- 6. RLS select policy
create policy "Anyone can read public issue comments"
  on public.issue_comments for select
  using (
    exists (
      select 1 from public.traffic_issues
      where traffic_issues.id = issue_comments.issue_id
        and traffic_issues.is_public = true
        and traffic_issues.is_sensitive = false
    )
  );

-- 7. RLS insert policy
create policy "Anyone can add comments to public issues"
  on public.issue_comments for insert
  with check (
    exists (
      select 1 from public.traffic_issues
      where traffic_issues.id = issue_comments.issue_id
        and traffic_issues.is_public = true
        and traffic_issues.is_sensitive = false
    )
    and (
      (auth.role() = 'authenticated' and user_id = auth.uid()) or
      (auth.role() <> 'authenticated' and user_id is null)
    )
  );
