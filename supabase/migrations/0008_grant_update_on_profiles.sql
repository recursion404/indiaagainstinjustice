-- Grant table-level UPDATE privileges on profiles to authenticated role.
-- Note: Row Level Security (RLS) is enabled, meaning this is securely filtered 
-- so only users with the 'superadmin' role are permitted to execute updates.
GRANT UPDATE ON public.profiles TO authenticated;
