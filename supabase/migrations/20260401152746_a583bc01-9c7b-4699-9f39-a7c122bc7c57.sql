
-- 1. Restrict profiles SELECT to own profile only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Recreate profiles_public view as SECURITY DEFINER so cross-user lookups still work
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
  WITH (security_invoker = false)
  AS SELECT user_id, display_name, avatar_url, bio FROM public.profiles;

-- Grant access to the view for anon and authenticated roles
GRANT SELECT ON public.profiles_public TO anon, authenticated;
