create type public.issue_severity as enum (
  'low',
  'moderate',
  'high',
  'critical'
);

create type public.traffic_condition as enum (
  'normal',
  'moderate',
  'heavy',
  'severe',
  'cleared'
);

create type public.location_kind as enum (
  'chowk',
  'road',
  'area',
  'landmark'
);

alter type public.issue_category add value if not exists 'road_bottleneck';
alter type public.issue_category add value if not exists 'road_work';
alter type public.issue_category add value if not exists 'accident';
alter type public.issue_category add value if not exists 'broken_signal';
alter type public.issue_category add value if not exists 'vip_convoy';
alter type public.issue_category add value if not exists 'wrong_side_driving';
alter type public.issue_category add value if not exists 'encroachment';
alter type public.issue_category add value if not exists 'waterlogging';
alter type public.issue_category add value if not exists 'pothole';
alter type public.issue_category add value if not exists 'missing_road_link';
alter type public.issue_category add value if not exists 'road_widening_required';
alter type public.issue_category add value if not exists 'diversion';
alter type public.issue_category add value if not exists 'public_event';
alter type public.issue_category add value if not exists 'bus_pmpml_issue';
alter type public.issue_category add value if not exists 'heavy_vehicle_movement';
alter type public.issue_category add value if not exists 'signal_timing';
alter type public.issue_category add value if not exists 'pedestrian_crossing';

alter type public.issue_status add value if not exists 'verified';
alter type public.issue_status add value if not exists 'action_started';
alter type public.issue_status add value if not exists 'action_taken';
alter type public.issue_status add value if not exists 'duplicate';
alter type public.issue_status add value if not exists 'insufficient_information';
alter type public.issue_status add value if not exists 'reopened';

create table public.traffic_locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_mr text,
  kind public.location_kind not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  ward text,
  jurisdiction text,
  connected_roads text[],
  search_keywords text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.authorities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  authority_type text not null check (
    authority_type in (
      'traffic_police',
      'municipal_corporation',
      'pmrda',
      'pmpml',
      'government_department',
      'joint_responsibility',
      'other'
    )
  ),
  contact_email text,
  contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.traffic_issues
  add column if not exists severity public.issue_severity not null default 'moderate',
  add column if not exists traffic_condition public.traffic_condition not null default 'heavy',
  add column if not exists location_id uuid references public.traffic_locations(id) on delete set null,
  add column if not exists location_name text,
  add column if not exists location_kind public.location_kind,
  add column if not exists citizen_landmark text,
  add column if not exists suggested_solution text,
  add column if not exists citizen_name text,
  add column if not exists citizen_phone text,
  add column if not exists citizen_email text,
  add column if not exists pincode text,
  add column if not exists ward_number text,
  add column if not exists duplicate_of uuid references public.traffic_issues(id) on delete set null,
  add column if not exists confirmation_count integer not null default 0,
  add column if not exists not_observed_count integer not null default 0,
  add column if not exists first_reported_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists resolved_at timestamptz;

create table public.issue_confirmations (
  issue_id uuid not null references public.traffic_issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  observed boolean not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (issue_id, user_id)
);

create table public.traffic_observations (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references public.traffic_locations(id) on delete set null,
  issue_id uuid references public.traffic_issues(id) on delete set null,
  observed_at timestamptz not null default now(),
  traffic_condition public.traffic_condition not null,
  issue_category public.issue_category,
  severity public.issue_severity not null default 'moderate',
  report_count integer not null default 1,
  confirmation_count integer not null default 0,
  source text not null default 'citizen_report',
  verification_status text not null default 'unverified' check (
    verification_status in ('unverified', 'under_review', 'verified', 'rejected')
  ),
  description text,
  created_at timestamptz not null default now()
);

create table public.issue_assignments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.traffic_issues(id) on delete cascade,
  authority_id uuid not null references public.authorities(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  status text not null default 'assigned' check (
    status in ('assigned', 'under_action', 'action_taken', 'resolved', 'closed')
  ),
  notes text
);

alter table public.traffic_locations enable row level security;
alter table public.authorities enable row level security;
alter table public.issue_confirmations enable row level security;
alter table public.traffic_observations enable row level security;
alter table public.issue_assignments enable row level security;

create policy "Active traffic locations are public"
  on public.traffic_locations for select
  using (is_active = true);

create policy "Admins can manage traffic locations"
  on public.traffic_locations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Active authorities are public"
  on public.authorities for select
  using (is_active = true);

create policy "Admins can manage authorities"
  on public.authorities for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Citizens can read their own confirmations"
  on public.issue_confirmations for select
  to authenticated
  using (user_id = auth.uid());

create policy "Citizens can confirm public issues"
  on public.issue_confirmations for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.traffic_issues
      where traffic_issues.id = issue_confirmations.issue_id
        and traffic_issues.is_public = true
        and traffic_issues.is_sensitive = false
    )
  );

create policy "Citizens can update their confirmations"
  on public.issue_confirmations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can read all confirmations"
  on public.issue_confirmations for select
  to authenticated
  using (public.is_admin());

create policy "Public verified observations are readable"
  on public.traffic_observations for select
  using (verification_status = 'verified');

create policy "Admins can manage traffic observations"
  on public.traffic_observations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can manage issue assignments"
  on public.issue_assignments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.set_issue_workflow_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.first_reported_at is null then
    new.first_reported_at = coalesce(new.created_at, now());
  end if;

  if new.status::text in ('verified', 'assigned', 'action_started', 'action_taken', 'resolved')
     and new.verified_at is null then
    new.verified_at = now();
  end if;

  if new.status::text = 'resolved' and new.resolved_at is null then
    new.resolved_at = now();
  end if;

  return new;
end;
$$;

create trigger traffic_issues_set_workflow_timestamps
  before insert or update on public.traffic_issues
  for each row execute function public.set_issue_workflow_timestamps();

create trigger traffic_locations_set_updated_at
  before update on public.traffic_locations
  for each row execute function public.set_updated_at();

create trigger issue_confirmations_set_updated_at
  before update on public.issue_confirmations
  for each row execute function public.set_updated_at();

create or replace function public.refresh_issue_confirmation_counts()
returns trigger
language plpgsql
as $$
declare
  target_issue_id uuid;
begin
  target_issue_id = coalesce(new.issue_id, old.issue_id);

  update public.traffic_issues
  set
    confirmation_count = (
      select count(*) from public.issue_confirmations
      where issue_id = target_issue_id and observed = true
    ),
    not_observed_count = (
      select count(*) from public.issue_confirmations
      where issue_id = target_issue_id and observed = false
    )
  where id = target_issue_id;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger issue_confirmations_refresh_counts
  after insert or update or delete on public.issue_confirmations
  for each row execute function public.refresh_issue_confirmation_counts();

create index if not exists traffic_locations_kind_active_idx
  on public.traffic_locations(kind, is_active);

create index if not exists traffic_issues_location_status_idx
  on public.traffic_issues(location_id, status, created_at desc);

create index if not exists traffic_issues_severity_idx
  on public.traffic_issues(severity, created_at desc);

create index if not exists traffic_observations_location_time_idx
  on public.traffic_observations(location_id, observed_at desc);

insert into public.authorities (name, authority_type)
values
  ('Pune Traffic Police', 'traffic_police'),
  ('Pune Municipal Corporation', 'municipal_corporation'),
  ('PMRDA', 'pmrda'),
  ('PMPML', 'pmpml'),
  ('Other Government Department', 'government_department'),
  ('Joint Responsibility', 'joint_responsibility')
on conflict (name) do nothing;

insert into public.traffic_locations (slug, name_en, kind, latitude, longitude, ward, jurisdiction, connected_roads, search_keywords)
values
  ('baner-radha-chowk', 'Baner Radha Chowk', 'chowk', 18.5595500, 73.7868200, 'Baner', 'Pune Municipal Corporation', array['Baner Road'], array['baner traffic', 'radha chowk traffic', 'baner radha chowk']),
  ('yashada-chowk', 'Yashada Chowk', 'chowk', 18.5587300, 73.8093300, 'Aundh', 'Pune Municipal Corporation', array['Baner Road', 'Aundh Road'], array['yashada chowk traffic', 'aundh traffic']),
  ('balewadi-high-street', 'Balewadi High Street', 'road', 18.5706500, 73.7749500, 'Balewadi', 'Pune Municipal Corporation', array['Balewadi High Street'], array['balewadi traffic', 'balewadi high street']),
  ('wakad-bridge', 'Wakad Bridge', 'chowk', 18.5980000, 73.7627900, 'Wakad', 'PCMC / PMRDA', array['Mumbai-Bengaluru Highway', 'Wakad Road'], array['wakad traffic', 'wakad bridge'])
on conflict (slug) do nothing;
