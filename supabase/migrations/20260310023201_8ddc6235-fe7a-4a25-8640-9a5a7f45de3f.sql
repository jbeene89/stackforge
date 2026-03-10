-- Marketplace templates
CREATE TABLE public.marketplace_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('module', 'stack', 'project')),
  tier text NOT NULL DEFAULT 'small' CHECK (tier IN ('small', 'medium', 'large')),
  price_credits integer NOT NULL DEFAULT 5,
  source_id uuid,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  downloads integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can browse published templates
CREATE POLICY "Anyone can view published templates"
  ON public.marketplace_templates FOR SELECT TO authenticated
  USING (status = 'published' OR creator_id = auth.uid());

CREATE POLICY "Users can create own templates"
  ON public.marketplace_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own templates"
  ON public.marketplace_templates FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own templates"
  ON public.marketplace_templates FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

CREATE TRIGGER update_marketplace_templates_updated_at
  BEFORE UPDATE ON public.marketplace_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Template purchases
CREATE TABLE public.template_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
  credits_paid integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.template_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON public.template_purchases FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "System can insert purchases"
  ON public.template_purchases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  revenue_share_pct numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referred_user_id);

-- Referral earnings log
CREATE TABLE public.referral_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'purchase',
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own earnings"
  ON public.referral_earnings FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id);