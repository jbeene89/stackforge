import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MapPin, Heart, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
    return { country: data.country_code || "", region: data.region_code || "" };
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
  const [userId, setUserId] = useState<string | null>(null);
  const [hasSavedHero, setHasSavedHero] = useState(false);
  const [usingSaved, setUsingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load image
  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      try {
        // If signed in, check for saved hero first
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("saved_hero_url")
            .eq("user_id", userId)
            .single();

          if (profile?.saved_hero_url && !cancelled) {
            setImageUrl(profile.saved_hero_url);
            setHasSavedHero(true);
            setUsingSaved(true);
            setLoading(false);
            return;
          }
        }

        // Try location-based image
        const location = await fetchLocationInfo();
        if (location && !cancelled) {
          const { data, error } = await supabase.functions.invoke("location-hero", {
            body: { country: location.country, region: location.region },
          });

          if (!error && data?.image_url && !cancelled) {
            setImageUrl(data.image_url);
            setIsLocationBased(true);
            if (data.country === "US" && data.region && US_STATE_NAMES[data.region]) {
              setLocationLabel(US_STATE_NAMES[data.region]);
            } else if (data.country && COUNTRY_NAMES[data.country]) {
              setLocationLabel(COUNTRY_NAMES[data.country]);
            }
            setLoading(false);
            return;
          }
        }

        // Fallback to forge doodles
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
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadImage();
    return () => { cancelled = true; };
  }, [userId]);

  const handleSave = async () => {
    if (!userId || !imageUrl || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ saved_hero_url: imageUrl } as any)
        .eq("user_id", userId);
      if (error) throw error;
      setHasSavedHero(true);
      setUsingSaved(true);
      toast.success("Hero image saved to your profile!");
    } catch {
      toast.error("Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setImgLoaded(false);
    try {
      // Force a new location-based image (skip saved)
      const location = await fetchLocationInfo();
      if (location) {
        const { data, error } = await supabase.functions.invoke("location-hero", {
          body: { country: location.country, region: location.region },
        });
        if (!error && data?.image_url) {
          setImageUrl(data.image_url);
          setIsLocationBased(true);
          setUsingSaved(false);
          if (data.country === "US" && data.region && US_STATE_NAMES[data.region]) {
            setLocationLabel(US_STATE_NAMES[data.region]);
          } else if (data.country && COUNTRY_NAMES[data.country]) {
            setLocationLabel(COUNTRY_NAMES[data.country]);
          }
          return;
        }
      }
      // Fallback: pick a random doodle
      const { data: doodles } = await (supabase as any)
        .from("forge_doodles")
        .select("image_url")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (doodles?.length) {
        setImageUrl(doodles[Math.floor(Math.random() * doodles.length)].image_url);
        setIsLocationBased(false);
        setUsingSaved(false);
        setLocationLabel(null);
      }
    } catch {
      toast.error("Couldn't refresh — try again");
    } finally {
      setRefreshing(false);
    }
  };

  const handleUseSaved = async () => {
    if (!userId) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("saved_hero_url")
      .eq("user_id", userId)
      .single();
    if (profile?.saved_hero_url) {
      setImgLoaded(false);
      setImageUrl(profile.saved_hero_url);
      setUsingSaved(true);
      setIsLocationBased(false);
      setLocationLabel(null);
    }
  };

  if (loading || !imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative max-w-4xl mx-auto mt-6 sm:mt-10 mb-4"
      >
        {/* Animated glow */}
        <motion.div
          className="absolute -inset-2 sm:-inset-3 rounded-2xl blur-xl sm:blur-2xl opacity-50"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--forge-gold) / 0.25), hsl(var(--forge-cyan) / 0.3))",
          }}
          animate={{ opacity: [0.4, 0.65, 0.4], scale: [1, 1.02, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl">
          <ForgeEmbers count={14} />
          <ShimmerSweep />

          <img
            src={imageUrl}
            alt={
              usingSaved
                ? "Your saved hero image"
                : isLocationBased && locationLabel
                  ? `AI-generated scenic view of ${locationLabel}`
                  : "AI-generated art — unique for every visitor"
            }
            className={`w-full h-auto object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            loading="eager"
            onLoad={() => setImgLoaded(true)}
          />

          {/* Bottom bar with badge + actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between gap-2"
          >
            {/* Label badge */}
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 text-[9px] sm:text-[10px] text-muted-foreground">
              {usingSaved ? (
                <>
                  <Heart className="h-3 w-3 text-forge-gold fill-forge-gold" />
                  <span>Your saved hero</span>
                </>
              ) : isLocationBased ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <MapPin className="h-3 w-3 text-forge-gold" />
                  </motion.div>
                  <span>{locationLabel ? `Forged for ${locationLabel}` : "Forged for your location"}</span>
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
            </div>

            {/* Action buttons for signed-in users */}
            {userId && (
              <div className="flex items-center gap-1.5">
                {/* Save button — show if not currently viewing saved */}
                {!usingSaved && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 text-[9px] sm:text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
                    title="Save as my hero image"
                  >
                    <Heart className={`h-3 w-3 ${saving ? "animate-pulse" : ""}`} />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                )}

                {/* Show saved button — if has saved and not viewing it */}
                {hasSavedHero && !usingSaved && (
                  <button
                    onClick={handleUseSaved}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 text-[9px] sm:text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    title="Show my saved hero"
                  >
                    <Heart className="h-3 w-3 fill-current" />
                    <span className="hidden sm:inline">My hero</span>
                  </button>
                )}

                {/* Refresh button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 text-[9px] sm:text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
                  title="Generate a new image"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
