create extension if not exists "pgcrypto";

create type public.issue_category as enum (
  'traffic_jam',
  'road_damage',
  'signal_issue',
  'illegal_parking',
  'public_transport',
  'unsafe_junction',
  'other'
);

create type public.issue_status as enum (
  'submitted',
  'under_review',
  'published',
  'assigned',
  'action_recorded',
  'citizen_verified',
  'resolved',
  'rejected'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'citizen' check (role in ('citizen', 'volunteer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.traffic_issues (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  reporter_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  category public.issue_category not null,
  status public.issue_status not null default 'submitted',
  area text not null,
  city text not null default 'Pune',
  public_summary text not null,
  private_address text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  support_count integer not null default 0,
  share_count integer not null default 0,
  is_public boolean not null default false,
  is_sensitive boolean not null default false,
  seo_title text,
  meta_description text,
  canonical_url text,
  indexable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.issue_photos (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.traffic_issues(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.issue_supports (
  issue_id uuid not null references public.traffic_issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);

create table public.issue_share_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.traffic_issues(id) on delete cascade,
  channel text,
  created_at timestamptz not null default now()
);

create table public.content_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  content_type text not null check (
    content_type in (
      'daily_highest_reported',
      'weekly_report',
      'most_supported_issue',
      'unresolved_issue',
      'authority_update',
      'public_transport_observation',
      'solution_proposal',
      'citizen_story',
      'poll_result',
      'pledge_milestone'
    )
  ),
  seo_title text,
  meta_description text,
  primary_keyword text,
  secondary_keywords text[],
  featured_image_path text,
  social_title text,
  social_description text,
  social_image_path text,
  canonical_url text,
  indexable boolean not null default false,
  schema_type text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  slug text not null unique,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null
);

create table public.poll_votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table public.pledges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  public_name text,
  city text not null default 'Pune',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.traffic_issues enable row level security;
alter table public.issue_photos enable row level security;
alter table public.issue_supports enable row level security;
alter table public.issue_share_events enable row level security;
alter table public.content_posts enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.pledges enable row level security;

create policy "Public issues expose only safe rows"
  on public.traffic_issues for select
  using (is_public = true and is_sensitive = false and status <> 'rejected');

create policy "Authenticated citizens can submit issues"
  on public.traffic_issues for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Citizens can read their own submitted issues"
  on public.traffic_issues for select
  to authenticated
  using (reporter_id = auth.uid());

create policy "Public photos expose only safe rows"
  on public.issue_photos for select
  using (
    is_public = true
    and exists (
      select 1
      from public.traffic_issues
      where traffic_issues.id = issue_photos.issue_id
        and traffic_issues.is_public = true
        and traffic_issues.is_sensitive = false
    )
  );

create policy "Published content is public"
  on public.content_posts for select
  using (published_at is not null);

create policy "Public polls are readable"
  on public.polls for select
  using (is_public = true);

create policy "Public poll options are readable"
  on public.poll_options for select
  using (
    exists (
      select 1 from public.polls
      where polls.id = poll_options.poll_id
        and polls.is_public = true
    )
  );

create policy "Authenticated citizens can vote once per poll"
  on public.poll_votes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Authenticated citizens can support issues"
  on public.issue_supports for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Anyone can record share events"
  on public.issue_share_events for insert
  with check (true);

create policy "Pledges are public"
  on public.pledges for select
  using (true);

create policy "Authenticated citizens can take pledge"
  on public.pledges for insert
  to authenticated
  with check (user_id = auth.uid());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger traffic_issues_set_updated_at
  before update on public.traffic_issues
  for each row execute function public.set_updated_at();

create trigger content_posts_set_updated_at
  before update on public.content_posts
  for each row execute function public.set_updated_at();
