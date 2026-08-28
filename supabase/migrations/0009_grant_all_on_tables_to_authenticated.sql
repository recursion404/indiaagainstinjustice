-- Grant UPDATE, INSERT, and DELETE privileges on admin-managed tables to authenticated role.
-- Note: Row Level Security (RLS) is active on both tables, ensuring only authenticated
-- administrators and superadmins (where public.is_admin(auth.uid()) is true) are 
-- permitted to execute these mutations.
GRANT INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.public_records TO authenticated;
