
-- Add a browsing policy for published templates (the public view already strips template_data)
-- This covers direct queries to the base table (e.g. admin count queries)
CREATE POLICY "Authenticated users can browse published templates"
ON public.marketplace_templates FOR SELECT TO authenticated
USING (status = 'published');

-- Drop the overly restrictive policy since the browsing policy covers published ones
-- and creator access is already covered by status='published' + creator_id match
DROP POLICY IF EXISTS "Published templates visible to owners and purchasers" ON public.marketplace_templates;
