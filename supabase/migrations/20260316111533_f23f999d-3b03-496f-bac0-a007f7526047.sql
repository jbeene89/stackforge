
-- Drop the existing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view published templates" ON public.marketplace_templates;

-- Create a view that excludes template_data for browsing
CREATE OR REPLACE VIEW public.marketplace_templates_public
WITH (security_invoker = on) AS
  SELECT id, creator_id, name, description, type, tier, status, tags, price_credits, downloads, source_id, created_at, updated_at
  FROM public.marketplace_templates
  WHERE status = 'published';

-- New SELECT policy: users can see their own templates fully,
-- OR published templates only if they purchased them
CREATE POLICY "Users can view own or purchased templates"
  ON public.marketplace_templates FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR (
      status = 'published'
      AND id IN (SELECT template_id FROM public.template_purchases WHERE buyer_id = auth.uid())
    )
  );
