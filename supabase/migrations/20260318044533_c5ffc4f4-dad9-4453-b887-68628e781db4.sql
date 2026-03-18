
-- Drop the pgcrypto-based functions since we can't set the DB passphrase
-- Encryption will be handled entirely in edge functions instead
DROP FUNCTION IF EXISTS public.encrypt_api_key(text);
DROP FUNCTION IF EXISTS public.decrypt_api_key(text);
DROP FUNCTION IF EXISTS public.mask_api_key(text);
