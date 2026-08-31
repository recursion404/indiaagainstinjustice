-- Add scalable account roles and admin approval workflow.
--
-- `role` is the effective permission used by RLS.
-- `requested_role` records what the user selected during signup.
-- Admin requests remain usable accounts, but keep effective role `citizen`
-- until a superadmin approves them.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requested_role TEXT NOT NULL DEFAULT 'citizen',
  ADD COLUMN IF NOT EXISTS role_approval_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS role_requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  ADD COLUMN IF NOT EXISTS role_approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS role_approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('citizen', 'volunteer', 'ngo', 'admin', 'superadmin'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_requested_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_requested_role_check
  CHECK (requested_role IN ('citizen', 'volunteer', 'ngo', 'admin', 'superadmin'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_approval_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_approval_status_check
  CHECK (role_approval_status IN ('not_required', 'pending', 'approved', 'rejected'));

UPDATE public.profiles
SET
  requested_role = role,
  role_approval_status = CASE
    WHEN role IN ('admin', 'superadmin') THEN 'approved'
    ELSE 'not_required'
  END,
  role_approved_at = CASE
    WHEN role IN ('admin', 'superadmin') THEN COALESCE(role_approved_at, updated_at, created_at, TIMEZONE('utc'::text, NOW()))
    ELSE role_approved_at
  END
WHERE requested_role = 'citizen'
  AND role IN ('volunteer', 'ngo', 'admin', 'superadmin');

CREATE OR REPLACE FUNCTION public.is_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
      AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_requested_role TEXT;
  v_effective_role TEXT;
  v_approval_status TEXT;
BEGIN
  v_requested_role := LOWER(COALESCE(new.raw_user_meta_data->>'requested_role', 'citizen'));

  IF v_requested_role NOT IN ('citizen', 'volunteer', 'ngo', 'admin') THEN
    v_requested_role := 'citizen';
  END IF;

  IF v_requested_role = 'admin' THEN
    v_effective_role := 'citizen';
    v_approval_status := 'pending';
  ELSE
    v_effective_role := v_requested_role;
    v_approval_status := 'not_required';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    requested_role,
    role_approval_status,
    role_requested_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    v_effective_role,
    v_requested_role,
    v_approval_status,
    TIMEZONE('utc'::text, NOW())
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF public.is_superadmin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.requested_role IS DISTINCT FROM OLD.requested_role
    OR NEW.role_approval_status IS DISTINCT FROM OLD.role_approval_status
    OR NEW.role_approved_at IS DISTINCT FROM OLD.role_approved_at
    OR NEW.role_approved_by IS DISTINCT FROM OLD.role_approved_by
  ) THEN
    RAISE EXCEPTION 'Only a superadmin can change account role approval fields.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_profile_role_self_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_role_self_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_self_escalation();

DROP POLICY IF EXISTS "Allow superadmins to update profiles" ON public.profiles;
CREATE POLICY "Allow superadmins to update profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
