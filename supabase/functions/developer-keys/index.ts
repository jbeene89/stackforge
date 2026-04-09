import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Generate a cryptographically random sk_ prefixed key */
function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sk_${hex}`;
}

/** SHA-256 hash a key for storage */
async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user JWT
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
    const body =
      method === "POST" || method === "DELETE" ? await req.json() : null;

    // GET — list keys
    if (method === "GET") {
      const { data: keys, error } = await adminClient
        .from("developer_api_keys")
        .select("id, key_prefix, label, revoked, last_used_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(keys || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST — generate new key
    if (method === "POST" && body) {
      const label = typeof body.label === "string" ? body.label.slice(0, 100) : "";

      const rawKey = generateApiKey();
      const hash = await hashKey(rawKey);
      const prefix = rawKey.slice(0, 8); // "sk_xxxxx"

      const { error } = await adminClient.from("developer_api_keys").insert({
        user_id: user.id,
        key_prefix: prefix,
        key_hash: hash,
        label,
      });

      if (error) throw error;

      // Return the raw key ONCE — it cannot be retrieved again
      return new Response(
        JSON.stringify({ key: rawKey, prefix, label }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // DELETE — revoke key
    if (method === "DELETE" && body?.id) {
      const { error } = await adminClient
        .from("developer_api_keys")
        .update({ revoked: true })
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
