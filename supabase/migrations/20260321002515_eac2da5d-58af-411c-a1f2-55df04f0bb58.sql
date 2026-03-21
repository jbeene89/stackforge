
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  referrer text DEFAULT '',
  user_agent text DEFAULT '',
  device_type text DEFAULT 'desktop',
  country text DEFAULT '',
  session_id text DEFAULT '',
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to insert page views for tracking
CREATE POLICY "Anyone can insert page views"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read analytics
CREATE POLICY "Authenticated users can read page views"
  ON public.page_views
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at);
CREATE INDEX idx_page_views_page_path ON public.page_views (page_path);
