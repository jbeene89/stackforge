-- Public aggregate stats view for landing page trust signals
CREATE OR REPLACE VIEW public.public_stats
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*)::bigint FROM public.training_jobs)               AS models_trained,
  (SELECT COALESCE(SUM(credits_used),0)::bigint FROM public.user_credits) AS credits_used_total,
  (SELECT COUNT(*)::bigint FROM public.user_credits)               AS users_total,
  (SELECT COUNT(*)::bigint FROM public.training_datasets)          AS datasets_total;

-- Country leaderboard view (last 30d) - aggregates only, no PII
CREATE OR REPLACE VIEW public.public_country_stats
WITH (security_invoker = true)
AS
SELECT
  COALESCE(NULLIF(country,''),'Unknown') AS country,
  COUNT(*)::bigint AS visits
FROM public.page_views
WHERE created_at > now() - interval '30 days'
GROUP BY 1
ORDER BY visits DESC
LIMIT 10;

-- Grant read to anon and authenticated
GRANT SELECT ON public.public_stats TO anon, authenticated;
GRANT SELECT ON public.public_country_stats TO anon, authenticated;

-- The underlying tables already have RLS; public_country_stats reads page_views
-- which currently only allows service_role to SELECT. Add a permissive aggregate
-- policy specifically for the view's needs by adding an anon policy that returns
-- nothing personal — we instead grant via a SECURITY DEFINER function for country stats.
-- Drop the view-based approach for country stats and use a function:
DROP VIEW IF EXISTS public.public_country_stats;

CREATE OR REPLACE FUNCTION public.get_public_country_stats()
RETURNS TABLE(country text, visits bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(country,''),'Unknown') AS country,
         COUNT(*)::bigint AS visits
  FROM public.page_views
  WHERE created_at > now() - interval '30 days'
  GROUP BY 1
  ORDER BY visits DESC
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.get_public_country_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_country_stats() TO anon, authenticated;