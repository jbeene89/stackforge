-- Fix marketplace_templates_public view: add status filter since it uses security_invoker=false
DROP VIEW IF EXISTS public.marketplace_templates_public;
CREATE VIEW public.marketplace_templates_public
  WITH (security_invoker = false)
  AS SELECT id, name, description, type, tier, status, tags,
            creator_id, downloads, price_credits, source_id,
            created_at, updated_at
  FROM public.marketplace_templates
  WHERE status = 'published';

GRANT SELECT ON public.marketplace_templates_public TO anon, authenticated;