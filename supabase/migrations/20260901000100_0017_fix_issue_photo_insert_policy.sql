-- Fix issue photo metadata inserts for private newly submitted reports.
--
-- The previous policy checked public.reports directly from inside RLS. For
-- anonymous/private submitted reports, that EXISTS check can fail because the
-- report itself is not publicly selectable yet. This helper runs as a security
-- definer and validates only the relationship needed for inserting photo
-- metadata.

CREATE OR REPLACE FUNCTION public.can_insert_issue_photo(p_issue_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.reports
    WHERE reports.id = p_issue_id
      AND (
        reports.reporter_id IS NULL
        OR reports.reporter_id = auth.uid()
        OR public.is_admin(auth.uid())
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.can_insert_issue_photo(UUID) TO anon, authenticated;

DROP POLICY IF EXISTS "Allow report photo metadata inserts" ON public.issue_photos;
CREATE POLICY "Allow report photo metadata inserts"
  ON public.issue_photos FOR INSERT
  WITH CHECK (public.can_insert_issue_photo(issue_id));
