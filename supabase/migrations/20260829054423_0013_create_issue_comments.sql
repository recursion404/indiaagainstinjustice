-- Add public issue discussion comments.
--
-- Anyone may read comments for public issue statuses. Only signed-in users may
-- create comments, and they can only comment as themselves.

CREATE TABLE IF NOT EXISTS public.issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT,
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 1200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_created
  ON public.issue_comments(issue_id, created_at);

CREATE POLICY "Allow public read of comments on public reports"
  ON public.issue_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reports
      WHERE reports.id = issue_comments.issue_id
        AND reports.status IN ('verified', 'published', 'action_started', 'action_taken', 'closed')
    )
  );

CREATE POLICY "Allow authenticated users to comment on public reports"
  ON public.issue_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.reports
      WHERE reports.id = issue_comments.issue_id
        AND reports.status IN ('verified', 'published', 'action_started', 'action_taken', 'closed')
    )
  );

GRANT SELECT ON public.issue_comments TO anon, authenticated;
GRANT INSERT ON public.issue_comments TO authenticated;
