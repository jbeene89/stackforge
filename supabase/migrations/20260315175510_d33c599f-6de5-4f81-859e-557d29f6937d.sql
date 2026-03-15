-- Fix 1: Remove public (unauthenticated) RLS policies on perspective_jobs
DROP POLICY IF EXISTS "Anyone can read pending jobs" ON public.perspective_jobs;
DROP POLICY IF EXISTS "Anyone can update processing jobs" ON public.perspective_jobs;

-- Fix 2: Remove user self-insert on user_credits (handled by trigger handle_new_user_credits)
DROP POLICY IF EXISTS "Users can view own credits insert" ON public.user_credits;