
REVOKE EXECUTE ON FUNCTION public.get_public_country_stats() FROM anon, authenticated, PUBLIC;

CREATE POLICY "No client access to demo_rate_limit"
  ON public.demo_rate_limit
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
