
-- Tighten discussions INSERT: require target ownership
DROP POLICY IF EXISTS "Authenticated users can create discussions" ON public.discussions;
CREATE POLICY "Users can create discussions on own items"
  ON public.discussions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      target_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
      OR target_id IN (SELECT id FROM public.modules WHERE user_id = auth.uid())
      OR target_id IN (SELECT id FROM public.stacks WHERE user_id = auth.uid())
    )
  );

-- Allow service_role to update perspective_jobs (edge function writes status/results)
CREATE POLICY "Service role can update perspective_jobs"
  ON public.perspective_jobs FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);

-- Idempotency log for processed Stripe events
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.processed_stripe_events TO service_role;
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.processed_stripe_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
