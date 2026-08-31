-- Create private issue photo storage used by web and mobile report forms.
--
-- Report submission creates the report first, then uploads evidence to the
-- `issue-photos` bucket and stores the object path in `public.issue_photos`.
-- This migration makes that flow reproducible across Supabase projects.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-photos',
  'issue-photos',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.issue_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  alt_text TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.issue_photos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_issue_photos_issue_id
  ON public.issue_photos(issue_id);

DROP POLICY IF EXISTS "Allow public read of public issue photos" ON public.issue_photos;
CREATE POLICY "Allow public read of public issue photos"
  ON public.issue_photos FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1
      FROM public.reports
      WHERE reports.id = issue_photos.issue_id
        AND reports.status IN ('verified', 'published', 'action_started', 'action_taken', 'closed')
    )
  );

DROP POLICY IF EXISTS "Allow report photo metadata inserts" ON public.issue_photos;
CREATE POLICY "Allow report photo metadata inserts"
  ON public.issue_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reports
      WHERE reports.id = issue_photos.issue_id
        AND (
          reports.reporter_id IS NULL
          OR reports.reporter_id = auth.uid()
          OR public.is_admin(auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "Allow admins to manage issue photos" ON public.issue_photos;
CREATE POLICY "Allow admins to manage issue photos"
  ON public.issue_photos FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.issue_photos TO anon, authenticated;
GRANT INSERT ON public.issue_photos TO anon, authenticated;
GRANT UPDATE, DELETE ON public.issue_photos TO authenticated;

DROP POLICY IF EXISTS "Allow issue photo uploads" ON storage.objects;
CREATE POLICY "Allow issue photo uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'issue-photos'
    AND (
      (auth.role() = 'anon' AND (storage.foldername(name))[1] = 'anonymous')
      OR (
        auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] IN ('anonymous', auth.uid()::text)
      )
    )
  );

DROP POLICY IF EXISTS "Allow public read of published issue photo objects" ON storage.objects;
CREATE POLICY "Allow public read of published issue photo objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'issue-photos'
    AND EXISTS (
      SELECT 1
      FROM public.issue_photos
      JOIN public.reports ON reports.id = issue_photos.issue_id
      WHERE issue_photos.storage_path = storage.objects.name
        AND issue_photos.is_public = true
        AND reports.status IN ('verified', 'published', 'action_started', 'action_taken', 'closed')
    )
  );

DROP POLICY IF EXISTS "Allow admins to manage issue photo objects" ON storage.objects;
CREATE POLICY "Allow admins to manage issue photo objects"
  ON storage.objects FOR ALL
  USING (bucket_id = 'issue-photos' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'issue-photos' AND public.is_admin(auth.uid()));
