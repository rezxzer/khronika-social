-- 0006_reports_select_policy.sql
-- Adds SELECT policy for reports table + admin RPC function
-- Run in Supabase SQL Editor AFTER 0002_rls.sql

-- Allow authenticated users to read their own reports
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own"
ON public.reports
FOR SELECT
USING (reporter_id = auth.uid());

-- RPC function for admin to fetch ALL reports (security definer bypasses RLS)
-- The function accepts an array of admin UUIDs and only returns data
-- if the calling user's auth.uid() is in that array.
CREATE OR REPLACE FUNCTION public.get_admin_reports(admin_ids uuid[])
RETURNS SETOF public.reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (auth.uid() = ANY(admin_ids)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT *
    FROM public.reports
    ORDER BY created_at DESC
    LIMIT 200;
END;
$$;
