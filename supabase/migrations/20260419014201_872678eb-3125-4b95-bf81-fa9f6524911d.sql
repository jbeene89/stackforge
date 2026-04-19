DO $$
DECLARE
  rec RECORD;
  bump INTEGER;
BEGIN
  FOR rec IN
    SELECT user_id, credits_balance
    FROM public.user_credits
    WHERE credits_balance < 100
  LOOP
    bump := 100 - rec.credits_balance;

    UPDATE public.user_credits
    SET credits_balance = 100,
        updated_at = now()
    WHERE user_id = rec.user_id;

    INSERT INTO public.credit_transactions (user_id, amount, balance_after, description, transaction_type)
    VALUES (rec.user_id, bump, 100, 'Credit floor bump — thanks for being early!', 'bonus');
  END LOOP;
END $$;

INSERT INTO public.announcements (title, content, priority, active)
VALUES (
  'Your credits got a bump 🎉',
  'We just topped every existing account up to a 100-credit floor as a thank-you for being here early. Check your balance — the extra credits are already there. Go forge something.',
  'success',
  true
);