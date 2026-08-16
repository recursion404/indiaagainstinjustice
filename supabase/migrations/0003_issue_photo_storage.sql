insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'issue-photos',
  'issue-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Citizens can upload issue photos to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'issue-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Citizens can read their uploaded issue photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'issue-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public can read photos approved for public issues"
  on storage.objects for select
  using (
    bucket_id = 'issue-photos'
    and exists (
      select 1
      from public.issue_photos
      join public.traffic_issues on traffic_issues.id = issue_photos.issue_id
      where issue_photos.storage_path = storage.objects.name
        and issue_photos.is_public = true
        and traffic_issues.is_public = true
        and traffic_issues.is_sensitive = false
        and traffic_issues.status <> 'rejected'
    )
  );

create policy "Citizens can update photos in their folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'issue-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'issue-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Citizens can remove photos in their folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'issue-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
