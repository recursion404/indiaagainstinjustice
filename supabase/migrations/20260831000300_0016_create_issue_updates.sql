-- Store admin-added issue context and public timeline updates.
--
-- Public updates can be shown on issue detail pages. Non-public updates remain
-- visible only through admin workflows protected by the existing admin RLS check.
CREATE TABLE IF NOT EXISTS public.issue_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  update_type TEXT NOT NULL DEFAULT 'authority_response',
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 1200),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_created
  ON public.issue_updates(issue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issue_updates_public_created
  ON public.issue_updates(is_public, created_at DESC);

DROP POLICY IF EXISTS "Allow public read of public issue updates" ON public.issue_updates;
CREATE POLICY "Allow public read of public issue updates"
  ON public.issue_updates FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1
      FROM public.reports
      WHERE reports.id = issue_updates.issue_id
        AND reports.status IN (
          'verified',
          'published',
          'assigned',
          'action_started',
          'action_taken',
          'action_recorded',
          'citizen_verified',
          'resolved',
          'reopened'
        )
    )
  );

DROP POLICY IF EXISTS "Allow admins to manage issue updates" ON public.issue_updates;
CREATE POLICY "Allow admins to manage issue updates"
  ON public.issue_updates FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

GRANT SELECT ON public.issue_updates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.issue_updates TO authenticated;
