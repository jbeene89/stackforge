import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin } from "lucide-react";

/* ── Floating ember particles ── */
function ForgeEmbers({ count = 18 }: { count?: number }) {
  const embers = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
      hue: [185, 38, 258, 345][Math.floor(Math.random() * 4)],
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {embers.map((e) => (
        <motion.div
          key={e.id}
          className="absolute rounded-full"
          style={{
            width: e.size,
            height: e.size,
            left: `${e.x}%`,
            top: `${e.y}%`,
            background: `hsl(${e.hue} 80% 60% / 0.6)`,
            boxShadow: `0 0 ${e.size * 2}px hsl(${e.hue} 80% 60% / 0.4)`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Shimmer sweep overlay ── */
function ShimmerSweep() {
  return (
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none"
      style={{
        background:
          "linear-gradient(105deg, transparent 40%, hsl(var(--primary) / 0.08) 45%, hsl(var(--forge-gold) / 0.12) 50%, transparent 55%)",
      }}
      animate={{ x: ["-100%", "200%"] }}
      transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
    />
  );
}

const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France",
  JP: "Japan", AU: "Australia", CA: "Canada", BR: "Brazil", IN: "India",
  IT: "Italy", ES: "Spain", MX: "Mexico", KR: "South Korea", NL: "Netherlands",
  SE: "Sweden", NO: "Norway", CN: "China", PK: "Pakistan",
};

async function fetchLocationInfo(): Promise<{ country: string; region: string } | null> {
  try {
    const resp = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      country: data.country_code || "",
      region: data.region_code || "",
    };
  } catch {
    return null;
  }
}

export function ForgeDoodle() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [isLocationBased, setIsLocationBased] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      try {
        // Try location-based image first
        const location = await fetchLocationInfo();

        if (location && !cancelled) {
          const { data, error } = await supabase.functions.invoke("location-hero", {
            body: { country: location.country, region: location.region },
          });

          if (!error && data?.image_url && !cancelled) {
            setImageUrl(data.image_url);
            setIsLocationBased(true);

            // Build location label
            if (data.country === "US" && data.region && US_STATE_NAMES[data.region]) {
              setLocationLabel(US_STATE_NAMES[data.region]);
            } else if (data.country && COUNTRY_NAMES[data.country]) {
              setLocationLabel(COUNTRY_NAMES[data.country]);
            }
            setLoading(false);
            return;
          }
        }

        // Fallback to existing forge doodles
        if (!cancelled) {
          const { data: doodles, error } = await (supabase as any)
            .from("forge_doodles")
            .select("image_url, prompt_seed, perspectives")
            .eq("active", true)
            .order("created_at", { ascending: false })
            .limit(20);

          if (!error && doodles?.length && !cancelled) {
            const randomIndex = Math.floor(Math.random() * doodles.length);
            setImageUrl(doodles[randomIndex].image_url);
          }
        }
      } catch {
        // Silently fail — hero image is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadImage();
    return () => { cancelled = true; };
  }, []);

  if (loading || !imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative max-w-4xl mx-auto mt-6 sm:mt-10 mb-4"
      >
        {/* Animated glow behind the image */}
        <motion.div
          className="absolute -inset-2 sm:-inset-3 rounded-2xl blur-xl sm:blur-2xl opacity-50"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--forge-gold) / 0.25), hsl(var(--forge-cyan) / 0.3))",
          }}
          animate={{
            opacity: [0.4, 0.65, 0.4],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl">
          {/* Ember particles */}
          <ForgeEmbers count={14} />

          {/* Shimmer sweep */}
          <ShimmerSweep />

          <img
            src={imageUrl}
            alt={
              isLocationBased && locationLabel
                ? `AI-generated scenic view of ${locationLabel} — crafted uniquely for you`
                : "AI-generated art — unique for every visitor, crafted by three AI perspectives"
            }
            className={`w-full h-auto object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            loading="eager"
            onLoad={() => setImgLoaded(true)}
          />

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 text-[9px] sm:text-[10px] text-muted-foreground"
          >
            {isLocationBased ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MapPin className="h-3 w-3 text-forge-gold" />
                </motion.div>
                <span>
                  {locationLabel
                    ? `Forged for ${locationLabel}`
                    : "Forged for your location"}
                </span>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-3 w-3 text-forge-gold" />
                </motion.div>
                <span>Forge Doodle — unique for you</span>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
