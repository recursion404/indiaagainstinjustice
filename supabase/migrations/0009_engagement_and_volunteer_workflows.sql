create unique index if not exists pledges_one_per_user_idx
  on public.pledges(user_id)
  where user_id is not null;

create policy "Citizens can read their own support rows"
  on public.issue_supports for select
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.volunteer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  interest text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'accepted', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.volunteer_requests enable row level security;

create policy "Anyone can submit volunteer request"
  on public.volunteer_requests for insert
  with check (true);

create policy "Admins can manage volunteer requests"
  on public.volunteer_requests for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
