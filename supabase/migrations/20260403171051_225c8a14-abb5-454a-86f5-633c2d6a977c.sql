
-- 1. Fix location_hero_images: replace public SELECT with a safe view that strips ip_hash
DROP POLICY IF EXISTS "Anyone can view location images" ON public.location_hero_images;

CREATE POLICY "Service role can read location images"
  ON public.location_hero_images FOR SELECT
  TO service_role
  USING (true);

CREATE OR REPLACE VIEW public.location_hero_images_public AS
  SELECT id, image_url, region, country, created_at
  FROM public.location_hero_images;

GRANT SELECT ON public.location_hero_images_public TO anon, authenticated;

-- 2. Fix SECURITY DEFINER on profiles_public and marketplace_templates_public views
CREATE OR REPLACE VIEW public.profiles_public
  WITH (security_invoker = true) AS
  SELECT user_id, display_name, avatar_url, bio
  FROM profiles;

CREATE OR REPLACE VIEW public.marketplace_templates_public
  WITH (security_invoker = true) AS
  SELECT id, name, description, type, tier, status, tags, creator_id, downloads, price_credits, source_id, created_at, updated_at
  FROM marketplace_templates
  WHERE status = 'published'::text;

-- 3. Add explicit SELECT policy on page_views restricted to service_role
CREATE POLICY "Service role can read page views"
  ON public.page_views FOR SELECT
  TO service_role
  USING (true);
