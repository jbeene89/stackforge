
-- 1. Atomic credit deduction RPC (prevents TOCTOU races)
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  _user_id uuid,
  _cost integer,
  _description text,
  _transaction_type text DEFAULT 'deduction'
) RETURNS TABLE(new_balance integer, success boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance integer;
BEGIN
  IF _cost IS NULL OR _cost < 0 THEN
    RETURN QUERY SELECT NULL::int, false, 'invalid_cost';
    RETURN;
  END IF;

  UPDATE public.user_credits
  SET credits_balance = credits_balance - _cost,
      credits_used = credits_used + _cost
  WHERE user_id = _user_id AND credits_balance >= _cost
  RETURNING credits_balance INTO _new_balance;

  IF _new_balance IS NULL THEN
    RETURN QUERY SELECT NULL::int, false, 'insufficient_credits';
    RETURN;
  END IF;

  INSERT INTO public.credit_transactions(user_id, amount, balance_after, description, transaction_type)
  VALUES (_user_id, -_cost, _new_balance, COALESCE(_description, ''), COALESCE(_transaction_type, 'deduction'));

  RETURN QUERY SELECT _new_balance, true, NULL::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.deduct_user_credits(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;

-- Refund helper (atomic)
CREATE OR REPLACE FUNCTION public.refund_user_credits(
  _user_id uuid,
  _amount integer,
  _description text,
  _transaction_type text DEFAULT 'refund'
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_balance integer;
BEGIN
  IF _amount IS NULL OR _amount < 0 THEN RETURN NULL; END IF;

  UPDATE public.user_credits
  SET credits_balance = credits_balance + _amount,
      credits_used = GREATEST(credits_used - _amount, 0)
  WHERE user_id = _user_id
  RETURNING credits_balance INTO _new_balance;

  IF _new_balance IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.credit_transactions(user_id, amount, balance_after, description, transaction_type)
  VALUES (_user_id, _amount, _new_balance, COALESCE(_description, ''), COALESCE(_transaction_type, 'refund'));

  RETURN _new_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_user_credits(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;

-- 2. Unique constraint to prevent duplicate template purchases
ALTER TABLE public.template_purchases
  ADD CONSTRAINT template_purchases_buyer_template_unique UNIQUE (buyer_id, template_id);

-- 3. Allow anon to read active announcements (public)
CREATE POLICY "Anon can read active announcements"
  ON public.announcements
  FOR SELECT
  TO anon
  USING (active = true);

-- 4. Allow users to delete their own paid_quick_jobs records
CREATE POLICY "Users delete own quick jobs"
  ON public.paid_quick_jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. DB-backed rate limit table for demo endpoints
CREATE TABLE IF NOT EXISTS public.demo_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_demo_rate_limit_lookup
  ON public.demo_rate_limit(endpoint, ip_hash, created_at DESC);

ALTER TABLE public.demo_rate_limit ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role can access. Good.

CREATE OR REPLACE FUNCTION public.check_demo_rate_limit(
  _ip_hash text,
  _endpoint text,
  _window_seconds integer,
  _max_requests integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  DELETE FROM public.demo_rate_limit
  WHERE created_at < now() - (interval '1 second' * (_window_seconds * 4));

  SELECT count(*) INTO _count
  FROM public.demo_rate_limit
  WHERE endpoint = _endpoint
    AND ip_hash = _ip_hash
    AND created_at > now() - (interval '1 second' * _window_seconds);

  IF _count >= _max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.demo_rate_limit(ip_hash, endpoint) VALUES (_ip_hash, _endpoint);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_demo_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;

-- 6. Lock down SECURITY DEFINER helpers from anon/authenticated execution
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_credits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
