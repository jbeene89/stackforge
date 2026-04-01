
CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  tag text NOT NULL DEFAULT 'new',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active changelog entries"
  ON public.changelog_entries FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Service role manages changelog"
  ON public.changelog_entries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO public.changelog_entries (date, title, description, icon, tag, sort_order) VALUES
  ('Mar 31', 'Image Animator Actions', 'Fire lasers, throw money, rain, fire & glitch effects on any image.', 'Zap', 'new', 10),
  ('Mar 30', 'Gallery Re-forge', 'Restore any saved image back into Council Mode for more perspective rounds.', 'Users', 'new', 20),
  ('Mar 29', 'Forge Gallery Cache', 'All Image Forge creations are now auto-saved — never lose your work.', 'Image', 'new', 30),
  ('Mar 28', 'Image Animator', 'Select regions of any image and apply motion presets like float, pulse, and zoom.', 'Paintbrush', 'new', 40),
  ('Mar 26', 'Day/Night Backgrounds', 'Landing page now swaps between alien landscapes for light and dark mode.', 'Sparkles', 'improved', 50),
  ('Mar 24', 'Easter Sale Banner', '50% off all credit packs — countdown timer on the landing page.', 'Rocket', 'new', 60),
  ('Mar 22', 'Cognitive Fingerprints', 'Analyze your dataset''s reasoning patterns, heuristics, and domain bridges.', 'Cpu', 'new', 70),
  ('Mar 20', 'Command Palette', 'Press ⌘K to quickly navigate anywhere in the app.', 'Terminal', 'improved', 80),
  ('Mar 18', 'Stack Canvas', 'Drag-and-drop visual builder for multi-agent pipelines.', 'Layers', 'improved', 90),
  ('Mar 15', 'Two-Factor Auth', 'Added TOTP-based 2FA to secure your account.', 'Shield', 'new', 100);
