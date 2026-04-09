
CREATE TABLE public.developer_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  label text DEFAULT '',
  revoked boolean NOT NULL DEFAULT false,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_developer_api_keys_user ON public.developer_api_keys (user_id);
CREATE INDEX idx_developer_api_keys_hash ON public.developer_api_keys (key_hash);

ALTER TABLE public.developer_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own developer keys"
  ON public.developer_api_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own developer keys"
  ON public.developer_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own developer keys"
  ON public.developer_api_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own developer keys"
  ON public.developer_api_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_developer_api_keys_updated_at
  BEFORE UPDATE ON public.developer_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
