create table if not exists public.issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.traffic_issues(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  update_type text not null check (
    update_type in ('authority_response', 'action_recorded', 'citizen_verified', 'resolution')
  ),
  body text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.traffic_issues
  add column if not exists authority_name text,
  add column if not exists authority_reference text,
  add column if not exists internal_notes text,
  add column if not exists rejection_reason text,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references public.profiles(id) on delete set null;

alter table public.issue_updates enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Admins can read all issues"
  on public.traffic_issues for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update issues"
  on public.traffic_issues for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can read all issue photos"
  on public.issue_photos for select
  to authenticated
  using (public.is_admin());

create policy "Admins can update issue photos"
  on public.issue_photos for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can read all issue photo files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'issue-photos' and public.is_admin());

create policy "Admins can read issue updates"
  on public.issue_updates for select
  to authenticated
  using (public.is_admin() or is_public = true);

create policy "Admins can create issue updates"
  on public.issue_updates for insert
  to authenticated
  with check (public.is_admin() and author_id = auth.uid());

create policy "Admins can update issue updates"
  on public.issue_updates for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete issue updates"
  on public.issue_updates for delete
  to authenticated
  using (public.is_admin());

create policy "Admins can manage content posts"
  on public.content_posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage polls"
  on public.polls for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage poll options"
  on public.poll_options for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists traffic_issues_status_created_at_idx
  on public.traffic_issues(status, created_at desc);

create index if not exists issue_updates_issue_id_created_at_idx
  on public.issue_updates(issue_id, created_at desc);
