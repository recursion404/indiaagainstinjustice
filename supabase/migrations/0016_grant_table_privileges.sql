-- Migration: Grant table-level privileges to anon and authenticated roles
-- Required so that RLS policies can actually execute.
-- Postgres requires GRANT privileges in addition to RLS policies.

-- traffic_issues: anon can INSERT (anonymous reports) and SELECT (reading public issues).
-- authenticated inherits anon privileges and also needs explicit grants.
grant select, insert on public.traffic_issues to anon, authenticated;

-- issue_photos: anon can INSERT (anonymous photo uploads).
grant select, insert on public.issue_photos to anon, authenticated;

-- issue_comments: anyone can SELECT and INSERT comments.
grant select, insert on public.issue_comments to anon, authenticated;

-- issue_supports, issue_share_events, issue_confirmations: authenticated only.
grant select, insert, delete on public.issue_supports to authenticated;
grant select, insert on public.issue_share_events to authenticated;
grant select, insert on public.issue_confirmations to authenticated;

-- polls and poll_options: authenticated can insert; everyone can select.
grant select on public.polls to anon, authenticated;
grant select on public.poll_options to anon, authenticated;
grant insert on public.polls to authenticated;
grant insert on public.poll_options to authenticated;

-- poll_votes: authenticated only.
grant select, insert on public.poll_votes to authenticated;

-- pledges: authenticated only.
grant select, insert on public.pledges to authenticated;

-- profiles: authenticated can read/update own profile.
grant select, update on public.profiles to authenticated;
