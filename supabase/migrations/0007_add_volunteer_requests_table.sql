-- Create public.volunteer_requests table
CREATE TABLE public.volunteer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  interest TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.volunteer_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit applications anonymously or signed in
CREATE POLICY "Allow anyone to submit volunteer requests"
  ON public.volunteer_requests FOR INSERT
  WITH CHECK (true);

-- Allow only admins and superadmins to view applications
CREATE POLICY "Allow admins to view volunteer requests"
  ON public.volunteer_requests FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Grant proper permissions to public roles
GRANT INSERT ON public.volunteer_requests TO anon, authenticated;
GRANT SELECT ON public.volunteer_requests TO authenticated, service_role;
