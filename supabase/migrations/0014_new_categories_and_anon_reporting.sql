-- Migration: New categories, anonymous reporting support, and citizen poll creation

-- 1. Add new categories to the enum type
alter type public.issue_category add value if not exists 'no_traffic_police_on_signal';
alter type public.issue_category add value if not exists 'incomplete_road';
alter type public.issue_category add value if not exists 'people_waiting_for_bus_on_road';

-- 2. Add custom category column on traffic_issues
alter table public.traffic_issues add column if not exists custom_category text;

-- 3. Make public_summary nullable
alter table public.traffic_issues alter column public_summary drop not null;

-- 4. Update traffic_issues insert policy to support anonymous reporting
drop policy if exists "Authenticated citizens can submit issues" on public.traffic_issues;

create policy "Anyone can submit issues"
  on public.traffic_issues for insert
  with check (
    (auth.role() = 'authenticated' and reporter_id = auth.uid()) or
    (auth.role() <> 'authenticated' and reporter_id is null)
  );

-- 5. Update issue_photos insert policy to support anonymous reporting
drop policy if exists "Citizens can add photos to their own issues" on public.issue_photos;

create policy "Anyone can add photos to issues"
  on public.issue_photos for insert
  with check (
    exists (
      select 1
      from public.traffic_issues
      where traffic_issues.id = issue_photos.issue_id
        and (
          (traffic_issues.reporter_id = auth.uid()) or
          (traffic_issues.reporter_id is null)
        )
    )
  );

-- 6. Update storage objects insert policy for issue-photos bucket
drop policy if exists "Citizens can upload issue photos to their folder" on storage.objects;

create policy "Anyone can upload issue photos"
  on storage.objects for insert
  with check (
    bucket_id = 'issue-photos'
    and (
      (auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1])
      or
      (auth.role() <> 'authenticated' and (storage.foldername(name))[1] = 'anonymous')
    )
  );

-- 7. Add creator_id to public.polls and RLS insert policies
alter table public.polls add column if not exists creator_id uuid references public.profiles(id) on delete set null;

create policy "Authenticated citizens can insert polls"
  on public.polls for insert
  to authenticated
  with check (creator_id = auth.uid());

create policy "Authenticated citizens can insert poll options"
  on public.poll_options for insert
  to authenticated
  with check (
    exists (
      select 1 from public.polls
      where polls.id = poll_options.poll_id
        and polls.creator_id = auth.uid()
    )
  );
