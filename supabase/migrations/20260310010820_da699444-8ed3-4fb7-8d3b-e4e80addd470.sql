
-- User credits table: tracks credit balance per user
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  credits_balance integer NOT NULL DEFAULT 50,
  credits_used integer NOT NULL DEFAULT 0,
  monthly_allowance integer NOT NULL DEFAULT 50,
  tier text NOT NULL DEFAULT 'free',
  last_reset_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own credits
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own credits (for deductions from edge functions we use service role)
CREATE POLICY "Users can view own credits insert" ON public.user_credits
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Credit usage log for tracking what credits were spent on
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text NOT NULL DEFAULT '',
  transaction_type text NOT NULL DEFAULT 'deduction',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Auto-create credits row for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_balance, monthly_allowance, tier)
  VALUES (NEW.id, 50, 50, 'free');
  
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, description, transaction_type)
  VALUES (NEW.id, 50, 50, 'Welcome bonus credits', 'bonus');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Updated_at trigger
CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
