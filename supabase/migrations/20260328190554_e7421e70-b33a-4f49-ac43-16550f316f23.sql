
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS saved_hero_url text DEFAULT NULL;
