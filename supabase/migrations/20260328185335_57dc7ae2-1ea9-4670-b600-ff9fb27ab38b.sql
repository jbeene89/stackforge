
-- Drop overly permissive write policies on announcements
DROP POLICY IF EXISTS "Authenticated users can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Authenticated users can delete announcements" ON public.announcements;

-- Only service_role can manage announcements
CREATE POLICY "Service role manages announcements"
  ON public.announcements FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
