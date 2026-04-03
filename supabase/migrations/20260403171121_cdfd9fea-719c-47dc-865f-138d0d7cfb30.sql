
CREATE OR REPLACE VIEW public.location_hero_images_public
  WITH (security_invoker = true) AS
  SELECT id, image_url, region, country, created_at
  FROM public.location_hero_images;
