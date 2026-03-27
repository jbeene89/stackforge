
-- Table to store pre-generated doodle images
CREATE TABLE public.forge_doodles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'daily',
  perspectives TEXT[] NOT NULL DEFAULT '{}',
  prompt_seed TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Allow public read access (no auth needed for landing page)
ALTER TABLE public.forge_doodles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active doodles"
ON public.forge_doodles
FOR SELECT
TO anon, authenticated
USING (active = true);

-- Only service role can insert/update (edge function)
CREATE POLICY "Service role manages doodles"
ON public.forge_doodles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
