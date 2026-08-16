alter table public.issue_share_events
add column if not exists user_id uuid references public.profiles(id) on delete set null;

alter table public.issue_share_events
drop constraint if exists issue_share_events_issue_id_user_id_key;

alter table public.issue_share_events
add constraint issue_share_events_issue_id_user_id_key unique (issue_id, user_id);

drop policy if exists "Anyone can record share events" on public.issue_share_events;

create policy "Authenticated citizens can record one share per issue"
  on public.issue_share_events for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Citizens can read their own share events"
  on public.issue_share_events for select
  to authenticated
  using (user_id = auth.uid());

create policy "Citizens can remove their own support"
  on public.issue_supports for delete
  to authenticated
  using (user_id = auth.uid());
