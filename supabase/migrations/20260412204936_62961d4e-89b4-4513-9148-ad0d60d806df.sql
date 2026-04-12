-- Remove the broad SELECT policy that exposes template_data to all authenticated users.
-- Browsing is handled safely via the marketplace_templates_public view (which excludes template_data).
-- The "Users can view own or purchased templates" policy already covers creators and purchasers.
DROP POLICY IF EXISTS "Authenticated users can browse published templates" ON public.marketplace_templates;
