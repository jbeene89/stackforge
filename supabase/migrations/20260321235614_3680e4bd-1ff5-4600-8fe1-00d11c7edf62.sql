
-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Generate random referral codes for existing profiles
UPDATE public.profiles 
SET referral_code = substr(md5(random()::text || id::text), 1, 10)
WHERE referral_code IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT substr(md5(random()::text), 1, 10);

-- Update the handle_new_user function to generate a referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), substr(md5(random()::text || NEW.id::text), 1, 10));
  RETURN NEW;
END;
$function$;

-- Create index for fast referral code lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
