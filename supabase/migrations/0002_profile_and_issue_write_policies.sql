create policy "Citizens can create their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Citizens can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Citizens can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Citizens can add photos to their own issues"
  on public.issue_photos for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.traffic_issues
      where traffic_issues.id = issue_photos.issue_id
        and traffic_issues.reporter_id = auth.uid()
    )
  );
