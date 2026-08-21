-- Migration: Fix RLS policy for anonymous issue reporting
-- The previous policy used auth.role() checks which can conflict with other policies.
-- Replace with a simple, clear rule: reporter_id must either be null (anonymous)
-- or match the authenticated user's uid.

-- Drop all existing insert policies on traffic_issues to avoid conflicts
drop policy if exists "Anyone can submit issues" on public.traffic_issues;
drop policy if exists "Authenticated citizens can submit issues" on public.traffic_issues;
drop policy if exists "Citizens can submit issues" on public.traffic_issues;

-- Create a single clean insert policy covering both anonymous and authenticated users
create policy "Allow issue insert for anon and authenticated"
  on public.traffic_issues for insert
  with check (
    reporter_id is null
    or
    reporter_id = auth.uid()
  );

-- Also ensure issue_photos insert policy is clean
drop policy if exists "Anyone can add photos to issues" on public.issue_photos;
drop policy if exists "Citizens can add photos to their own issues" on public.issue_photos;

create policy "Allow photo insert for anon and authenticated"
  on public.issue_photos for insert
  with check (
    exists (
      select 1 from public.traffic_issues
      where traffic_issues.id = issue_photos.issue_id
        and (
          traffic_issues.reporter_id is null
          or
          traffic_issues.reporter_id = auth.uid()
        )
    )
  );

-- Fix anonymous comment inserts too
drop policy if exists "Anyone can post comments" on public.issue_comments;
drop policy if exists "Authenticated users can post comments" on public.issue_comments;

create policy "Allow comment insert for anon and authenticated"
  on public.issue_comments for insert
  with check (
    user_id is null
    or
    user_id = auth.uid()
  );
