-- Initial schema for India Against Injustice (IAI)

-- Create custom types / check constraints as domains or within tables
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  display_name TEXT,
  mobile TEXT UNIQUE,
  email TEXT UNIQUE,
  profession TEXT,
  gender TEXT,
  birth_year INTEGER,
  state TEXT,
  district TEXT,
  town_village TEXT,
  pincode TEXT,
  preferences JSONB DEFAULT '{"contact_allowed": false, "social_follow_allowed": false}'::JSONB,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'volunteer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of basic profile info" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow users to update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create reports table (India-wide)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL,
  reporter_mobile TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  summary TEXT,
  description TEXT,
  state TEXT NOT NULL,
  district TEXT,
  town_village TEXT NOT NULL, -- Ward/Village
  pincode TEXT NOT NULL,
  photo_url TEXT,
  video_url TEXT,
  additional_location_detail TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'action_started', 'action_taken', 'closed', 'rejected')),
  rejection_reason TEXT,
  closure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to select their own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Allow public read of approved/verified reports"
  ON public.reports FOR SELECT
  USING (status IN ('verified', 'action_started', 'action_taken', 'closed'));

-- Create public records table (Issues, works, politicians, entities etc.)
CREATE TABLE public.public_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('issue', 'public_work', 'politician', 'public_officer', 'government_entity', 'political_party')),
  state TEXT NOT NULL,
  district TEXT,
  town_village TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for public records
ALTER TABLE public.public_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select of public records"
  ON public.public_records FOR SELECT
  USING (true);

-- Create Admin rules
-- Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for all tables
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to reports"
  ON public.reports FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to public_records"
  ON public.public_records FOR ALL
  USING (public.is_admin(auth.uid()));

-- RPC function for safe report submission
CREATE OR REPLACE FUNCTION public.submit_report_rpc(
  p_reporter_name TEXT,
  p_reporter_mobile TEXT,
  p_category TEXT,
  p_subcategory TEXT,
  p_summary TEXT,
  p_description TEXT,
  p_state TEXT,
  p_district TEXT,
  p_town_village TEXT,
  p_pincode TEXT,
  p_photo_url TEXT,
  p_video_url TEXT,
  p_additional_location_detail TEXT
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_public_id TEXT;
  v_reporter_id UUID;
BEGIN
  -- Resolve auth user if logged in
  v_reporter_id := auth.uid();
  
  -- Generate a human-readable 8-char slug/id
  v_public_id := 'IAI-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);

  INSERT INTO public.reports (
    public_id,
    reporter_id,
    reporter_name,
    reporter_mobile,
    category,
    subcategory,
    summary,
    description,
    state,
    district,
    town_village,
    pincode,
    photo_url,
    video_url,
    additional_location_detail,
    status
  ) VALUES (
    v_public_id,
    v_reporter_id,
    p_reporter_name,
    p_reporter_mobile,
    p_category,
    p_subcategory,
    p_summary,
    p_description,
    p_state,
    p_district,
    p_town_village,
    p_pincode,
    p_photo_url,
    p_video_url,
    p_additional_location_detail,
    'submitted'
  ) RETURNING id INTO v_report_id;

  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'citizen'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
