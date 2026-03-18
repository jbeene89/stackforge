import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AES-GCM encryption helpers using Web Crypto API
const ALGO = "AES-GCM";

async function getEncryptionKey(): Promise<CryptoKey> {
  // Derive a stable key from SUPABASE_SERVICE_ROLE_KEY (always available)
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: ALGO }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );
  // Concatenate iv + ciphertext and base64 encode
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encryptedB64: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

function maskKey(raw: string): string {
  if (raw.length <= 12) return "*".repeat(raw.length);
  return raw.slice(0, 4) + "*".repeat(raw.length - 8) + raw.slice(-4);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user via their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { method } = req;
    const body = method === "POST" || method === "DELETE" ? await req.json() : null;

    // GET — list keys (masked)
    if (method === "GET") {
      const { data: keys, error } = await adminClient
        .from("user_api_keys")
        .select("id, provider, label, api_key_encrypted, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const masked = await Promise.all(
        (keys || []).map(async (k: any) => {
          let display: string;
          try {
            const raw = await decrypt(k.api_key_encrypted);
            display = maskKey(raw);
          } catch {
            // Legacy plaintext key — mask directly
            display = maskKey(k.api_key_encrypted);
          }
          return {
            id: k.id,
            provider: k.provider,
            label: k.label,
            masked_key: display,
            created_at: k.created_at,
          };
        })
      );

      return new Response(JSON.stringify(masked), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST — add new key (encrypt before storing)
    if (method === "POST" && body) {
      const { provider, label, api_key } = body;
      if (!api_key || !provider) {
        return new Response(
          JSON.stringify({ error: "provider and api_key required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const encrypted = await encrypt(api_key);
      const { error } = await adminClient.from("user_api_keys").insert({
        user_id: user.id,
        provider,
        label: label || null,
        api_key_encrypted: encrypted,
      });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE — remove key
    if (method === "DELETE" && body?.id) {
      // Verify ownership
      const { error } = await adminClient
        .from("user_api_keys")
        .delete()
        .eq("id", body.id)
        .eq("user_id", user.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
