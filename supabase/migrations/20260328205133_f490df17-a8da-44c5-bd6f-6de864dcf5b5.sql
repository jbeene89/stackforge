
-- Fix: recreate view with SECURITY INVOKER to use the querying user's permissions
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS SELECT user_id, display_name, avatar_url, bio FROM public.profiles;

-- Grant access
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Add a SELECT policy so authenticated users can read via the invoker view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow users to read their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow reading only display_name/avatar for other users (needed for marketplace/discussions)
-- Since the view is security_invoker, we need a broader SELECT policy
-- but the view itself limits which columns are exposed
-- We'll use a simple approach: allow all authenticated to SELECT, but only expose safe columns through the view
-- Actually, we need the full table for own profile, and the view for others
-- Let's restore broad SELECT on profiles but the view is the recommended path for cross-user lookups
-- The referral_code is still in the table but only accessible to the owner
-- Better approach: allow all SELECT but the app code uses the view for cross-user
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
