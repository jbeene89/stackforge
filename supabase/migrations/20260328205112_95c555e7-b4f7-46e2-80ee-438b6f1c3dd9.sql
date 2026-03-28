
-- Create a public view of profiles with only safe columns (no referral_code)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT user_id, display_name, avatar_url, bio
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Restrict the profiles SELECT policy to owner-only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
