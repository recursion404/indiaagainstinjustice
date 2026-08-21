-- Migration: Use security definer function to allow anonymous issue reporting
-- The RLS policy approach has proven unreliable for the anon role in this setup.
-- A SECURITY DEFINER function runs as the table owner (postgres) and bypasses RLS.
-- This is a standard Supabase pattern for operations that need to work without auth.

create or replace function public.submit_traffic_issue(
  p_public_id       text,
  p_reporter_id     uuid,
  p_title           text,
  p_slug            text,
  p_category        public.issue_category,
  p_custom_category text,
  p_traffic_condition text,
  p_area            text,
  p_public_summary  text,
  p_location_name   text,
  p_location_kind   text,
  p_suggested_solution text,
  p_pincode         text,
  p_ward_number     text,
  p_latitude        double precision,
  p_longitude       double precision
)
returns table (id uuid, public_id text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  insert into public.traffic_issues (
    public_id,
    reporter_id,
    title,
    slug,
    category,
    custom_category,
    traffic_condition,
    area,
    public_summary,
    location_name,
    location_kind,
    citizen_landmark,
    private_address,
    suggested_solution,
    pincode,
    ward_number,
    latitude,
    longitude
  ) values (
    p_public_id,
    p_reporter_id,
    p_title,
    p_slug,
    p_category,
    p_custom_category,
    p_traffic_condition::public.traffic_condition,
    p_area,
    coalesce(p_public_summary, ''),
    p_location_name,
    p_location_kind::public.location_kind,
    null,
    null,
    p_suggested_solution,
    p_pincode,
    p_ward_number,
    p_latitude,
    p_longitude
  )
  returning traffic_issues.id, traffic_issues.public_id;
end;
$$;

-- Grant execute to both anon and authenticated so anyone can call it
grant execute on function public.submit_traffic_issue to anon, authenticated;
