import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DAILY_LIMIT = 2;

// Hash IP for privacy (we don't store raw IPs)
async function hashIP(ip: string): Promise<string> {
  const salt = "soupy-location-hero-v1";
  const data = new TextEncoder().encode(ip + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// US state landmarks/scenery for hero images
const STATE_SCENES: Record<string, string> = {
  AL: "Alabama rolling hills with cotton fields at golden hour",
  AK: "Alaska glaciers and aurora borealis over snowy mountains",
  AZ: "Arizona Grand Canyon at sunset with dramatic desert sky",
  AR: "Arkansas Ozark mountains with misty forest valleys",
  CA: "California Golden Gate Bridge at sunset with Pacific Ocean",
  CO: "Colorado Rocky Mountains with snow-capped peaks and aspen trees",
  CT: "Connecticut autumn foliage along a charming New England village",
  DE: "Delaware coastal boardwalk with Atlantic sunrise",
  FL: "Florida scenery|tropical beach with palm trees and turquoise water|Everglades wetlands with herons at golden hour|Key West sunset over the ocean with fishing boats|Miami Art Deco skyline reflecting on Biscayne Bay|St. Augustine historic lighthouse with coastal dunes|Crystal River springs with manatees in clear water",
  GA: "Georgia Savannah oak trees draped in Spanish moss",
  HI: "Hawaii volcanic landscape with tropical flowers and ocean",
  ID: "Idaho Shoshone Falls with rugged mountain backdrop",
  IL: "Illinois Chicago skyline reflecting in Lake Michigan at dusk",
  IN: "Indiana countryside with golden wheat fields at sunset",
  IA: "Iowa rolling farmland with dramatic cloud formations",
  KS: "Kansas Flint Hills prairie with wildflowers at golden hour",
  KY: "Kentucky horse country with white fences and rolling bluegrass",
  LA: "Louisiana bayou with cypress trees and misty morning light",
  ME: "Maine rocky coastline with lighthouse at sunrise",
  MD: "Maryland Chesapeake Bay with sailboats and autumn colors",
  MA: "Massachusetts Cape Cod beach with historic lighthouses",
  MI: "Michigan Great Lakes shoreline with sand dunes and sunset",
  MN: "Minnesota Boundary Waters with pristine lakes and boreal forest",
  MS: "Mississippi River delta with magnolia trees and golden light",
  MO: "Missouri Gateway Arch with St. Louis skyline at twilight",
  MT: "Montana Glacier National Park with crystal lakes and mountains",
  NE: "Nebraska Sandhills with vast prairie and starlit sky",
  NV: "Nevada Red Rock Canyon with desert formations at sunset",
  NH: "New Hampshire White Mountains with autumn foliage",
  NJ: "New Jersey Pine Barrens with misty cranberry bogs",
  NM: "New Mexico desert with Carlsbad Caverns and turquoise sky",
  NY: "New York City skyline with Brooklyn Bridge at twilight",
  NC: "North Carolina Blue Ridge Parkway with mountain mist",
  ND: "North Dakota Badlands with dramatic painted canyon",
  OH: "Ohio Cuyahoga Valley with covered bridges and autumn trees",
  OK: "Oklahoma prairie with wildflowers and dramatic thunderhead clouds",
  OR: "Oregon Crater Lake with deep blue water and pine forests",
  PA: "Pennsylvania Pocono Mountains with waterfalls and autumn colors",
  RI: "Rhode Island Newport mansions with ocean cliffs",
  SC: "South Carolina Lowcountry marsh at golden hour with egrets",
  SD: "South Dakota Badlands with dramatic rock formations at sunset",
  TN: "Tennessee Great Smoky Mountains with morning fog and wildflowers",
  TX: "Texas Big Bend desert canyon with Rio Grande at sunset",
  UT: "Utah Arches National Park with red rock formations and stars",
  VT: "Vermont covered bridge with autumn maple trees",
  VA: "Virginia Shenandoah Valley with Blue Ridge mountains at dawn",
  WA: "Washington Mount Rainier with wildflower meadows",
  WV: "West Virginia New River Gorge Bridge with autumn forest",
  WI: "Wisconsin Door County with cherry blossoms and lake shore",
  WY: "Wyoming Yellowstone geysers with bison and mountain backdrop",
};

// Country scenes for non-US visitors
const COUNTRY_SCENES: Record<string, string> = {
  GB: "English countryside with rolling green hills and stone villages",
  DE: "German Black Forest with fairy-tale castles and misty valleys",
  FR: "French lavender fields in Provence at golden hour",
  JP: "Japanese cherry blossoms with Mount Fuji at sunrise",
  AU: "Australian Great Barrier Reef with turquoise waters",
  CA: "Canadian Rocky Mountains with pristine glacial lakes",
  BR: "Brazilian Amazon rainforest with dramatic waterfalls",
  IN: "Indian Himalayan peaks with temple architecture",
  IT: "Italian Amalfi Coast with colorful cliffside villages",
  ES: "Spanish Alhambra gardens with Moorish architecture at sunset",
  MX: "Mexican cenote with turquoise water in jungle setting",
  KR: "Korean temple nestled in autumn mountain foliage",
  NL: "Dutch tulip fields with windmills at golden hour",
  SE: "Swedish northern lights over snowy pine forests",
  NO: "Norwegian fjords with dramatic cliffs and waterfalls",
  CN: "Chinese karst mountains with misty river valleys",
  PK: "Pakistani Hunza Valley with snow-capped Karakoram peaks",
};

const DEFAULT_SCENE = "a breathtaking panoramic landscape with mountains, water, and golden light — cinematic and inspiring";

function getSceneForLocation(country: string, region: string): string {
  let sceneStr = DEFAULT_SCENE;
  if (country === "US" && region && STATE_SCENES[region]) {
    sceneStr = STATE_SCENES[region];
  } else if (COUNTRY_SCENES[country]) {
    sceneStr = COUNTRY_SCENES[country];
  }
  // If scene has pipe-separated variants, pick one randomly
  const variants = sceneStr.split("|").map(s => s.trim()).filter(Boolean);
  return variants[Math.floor(Math.random() * variants.length)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("LOVABLE_API_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Get IP from headers (Supabase Edge Functions provide this)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = await hashIP(ip);

    // Get location from request body (client sends it) or use IP geolocation header
    const body = await req.json().catch(() => ({}));
    const country = (body.country || "").toUpperCase().slice(0, 2);
    const region = (body.region || "").toUpperCase().slice(0, 5);

    // Check if we already have an image for this IP today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { data: existing } = await supabase
      .from("location_hero_images")
      .select("image_url, region, country")
      .eq("ip_hash", ipHash)
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(DAILY_LIMIT);

    // If already at limit, return random existing one
    if (existing && existing.length >= DAILY_LIMIT) {
      const pick = existing[Math.floor(Math.random() * existing.length)];
      return new Response(JSON.stringify({
        image_url: pick.image_url,
        region: pick.region,
        country: pick.country,
        source: "cached",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If we have one already but under limit, generate a NEW one (don't reuse — variety matters)
    // Only reuse if generation fails later

    // Check regional cache (15 min window, only reuse if 3+ exist for variety)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    if (region || country) {
      const { data: regionCached } = await supabase
        .from("location_hero_images")
        .select("image_url, region, country")
        .eq("region", region || "")
        .eq("country", country || "")
        .gte("created_at", fifteenMinAgo)
        .order("created_at", { ascending: false })
        .limit(5);

      if (regionCached && regionCached.length >= 3) {
        const pick = regionCached[Math.floor(Math.random() * regionCached.length)];
        // Store this as the visitor's image too
        await supabase.from("location_hero_images").insert({
          ip_hash: ipHash,
          region: pick.region,
          country: pick.country,
          image_url: pick.image_url,
        });
        return new Response(JSON.stringify({
          image_url: pick.image_url,
          region: pick.region,
          country: pick.country,
          source: "region_cached",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate a new location-based image
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured", fallback: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scene = getSceneForLocation(country, region);
    const seed = Math.floor(Math.random() * 10000);
    const timeOfDay = ["at sunrise", "at golden hour", "at dusk", "under dramatic clouds", "in soft morning light", "at blue hour"][Math.floor(Math.random() * 6)];
    const prompt = `Create a stunning wide-format cinematic banner image (16:9 aspect ratio) of: ${scene} ${timeOfDay}. Variation seed: ${seed}. Make it vibrant, atmospheric, and suitable as a website hero banner. Photorealistic quality with dramatic lighting. Do NOT include any text or letters in the image. Generate an image.`;

    const resp = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      console.error("Image generation failed:", resp.status);
      return new Response(JSON.stringify({ fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      return new Response(JSON.stringify({ fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store the generated image
    await supabase.from("location_hero_images").insert({
      ip_hash: ipHash,
      region: region || "",
      country: country || "",
      image_url: imageUrl,
    });

    return new Response(JSON.stringify({
      image_url: imageUrl,
      region,
      country,
      source: "generated",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("location-hero error:", err);
    return new Response(JSON.stringify({ fallback: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
