-- Drop the legacy status constraint on public.reports
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;

-- Add updated constraint including all advanced workflow statuses defined in the frontend
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
    'rejected'
  )
);
