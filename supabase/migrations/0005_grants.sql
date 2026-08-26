-- Grant select permissions on tables to anon and authenticated roles
GRANT SELECT ON public.reports TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.public_records TO anon, authenticated;
