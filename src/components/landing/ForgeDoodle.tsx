import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

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

export function ForgeDoodle() {
  const [doodleUrl, setDoodleUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const fetchDoodle = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("forge_doodles")
          .select("image_url, prompt_seed, perspectives")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error || !data?.length) {
          setLoading(false);
          return;
        }

        const randomIndex = Math.floor(Math.random() * data.length);
        setDoodleUrl(data[randomIndex].image_url);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchDoodle();
  }, []);

  if (loading || !doodleUrl) return null;

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
            src={doodleUrl}
            alt="AI-generated art — unique for every visitor, crafted by three AI perspectives"
            className={`w-full h-auto object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            loading="eager"
            onLoad={() => setImgLoaded(true)}
          />

          {/* Subtle overlay badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 text-[9px] sm:text-[10px] text-muted-foreground"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-3 w-3 text-forge-gold" />
            </motion.div>
            <span>Forge Doodle — unique for you</span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
