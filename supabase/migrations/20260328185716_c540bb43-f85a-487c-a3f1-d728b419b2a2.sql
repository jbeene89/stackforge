
CREATE TABLE public.location_hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  region text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_hero_images ENABLE ROW LEVEL SECURITY;

-- Public read for anon/authenticated (images are non-sensitive)
CREATE POLICY "Anyone can view location images"
  ON public.location_hero_images FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert
CREATE POLICY "Service role manages location images"
  ON public.location_hero_images FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Index for fast IP-based lookups
CREATE INDEX idx_location_hero_ip_hash ON public.location_hero_images (ip_hash, created_at DESC);
CREATE INDEX idx_location_hero_region ON public.location_hero_images (region, country);
