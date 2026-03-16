
-- Fix 1: Restrict discussions SELECT to only author or target item owner
DROP POLICY IF EXISTS "Users can view discussions on their items" ON public.discussions;
CREATE POLICY "Users can view discussions on their items"
  ON public.discussions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR target_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
    OR target_id IN (SELECT id FROM public.modules WHERE user_id = auth.uid())
    OR target_id IN (SELECT id FROM public.stacks WHERE user_id = auth.uid())
  );

-- Fix 2: Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Also restrict profiles INSERT and UPDATE to authenticated role
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
