-- Keep the public read policy aligned with the admin publishing workflow.
--
-- Admins can mark a report as `published`, but the original public RLS policy
-- only exposed the older reviewed statuses. This made a successfully published
-- issue remain invisible on public pages.

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;

ALTER TABLE public.reports ADD CONSTRAINT reports_status_check CHECK (
  status IN (
    'submitted',
    'under_review',
    'verified',
    'published',
    'assigned',
    'action_started',
    'action_taken',
    'action_recorded',
    'citizen_verified',
    'resolved',
    'closed',
    'rejected',
    'duplicate',
    'insufficient_information',
    'reopened'
  )
);

DROP POLICY IF EXISTS "Allow public read of approved/verified reports" ON public.reports;

CREATE POLICY "Allow public read of approved/verified reports"
  ON public.reports FOR SELECT
  USING (
    status IN (
      'verified',
      'published',
      'action_started',
      'action_taken',
      'closed'
    )
  );
