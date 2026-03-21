
-- Fix 1: Remove client-facing INSERT policy on referrals (edge function uses service role)
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

-- Add UNIQUE constraint on referred_user_id to prevent duplicate referrals
ALTER TABLE public.referrals ADD CONSTRAINT referrals_referred_user_id_unique UNIQUE (referred_user_id);

-- Fix 2: Restrict page_views SELECT to owner only
DROP POLICY IF EXISTS "Authenticated users can read page views" ON public.page_views;

-- Fix 2b: Restrict page_views INSERT to set user_id = auth.uid() or null (no impersonation)
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
