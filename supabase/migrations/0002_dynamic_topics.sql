-- Migration: Dynamic Categories/Topics table for India Against Injustice

CREATE TABLE public.categories (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read of active categories
CREATE POLICY "Allow public read of active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

-- Allow admin full control
CREATE POLICY "Admins have full access to categories"
  ON public.categories FOR ALL
  USING (public.is_admin(auth.uid()));

-- Seed default dynamic topics
INSERT INTO public.categories (slug, label, icon) VALUES
  ('traffic', 'Traffic & Road Safety', '🚦'),
  ('corruption', 'Corruption & Bribes', '💼'),
  ('infrastructure', 'Infrastructure & Potholes', '🧱'),
  ('garbage', 'Garbage & Sanitation', '🗑️'),
  ('water_scarcity', 'Water Supply & Quality', '💧'),
  ('other', 'Other Civil Issues', '📝')
ON CONFLICT (slug) DO UPDATE 
SET label = EXCLUDED.label, icon = EXCLUDED.icon;

-- Connect reports table category field as a foreign key to categories
ALTER TABLE public.reports
  ADD CONSTRAINT fk_reports_category
  FOREIGN KEY (category)
  REFERENCES public.categories(slug)
  ON DELETE RESTRICT;
