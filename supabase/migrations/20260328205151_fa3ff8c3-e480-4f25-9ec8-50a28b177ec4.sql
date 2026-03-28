
-- Restore broad SELECT so the security_invoker view works for cross-user lookups
-- The view itself limits columns exposed (no referral_code)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
