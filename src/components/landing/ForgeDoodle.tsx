import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export function ForgeDoodle() {
  const [doodleUrl, setDoodleUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoodle = async () => {
      try {
        // Fetch a random active doodle
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

        // Pick a random one from recent doodles
        const randomIndex = Math.floor(Math.random() * data.length);
        setDoodleUrl(data[randomIndex].image_url);
      } catch {
        // Silently fail — landing page works fine without doodle
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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative max-w-4xl mx-auto mt-8 sm:mt-10 mb-4"
      >
        {/* Glow effect behind the image */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-forge-gold/20 to-forge-cyan/20 blur-xl opacity-60" />

        <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-2xl">
          <img
            src={doodleUrl}
            alt="AI-generated art — unique for every visitor, crafted by three AI perspectives"
            className="w-full h-auto object-cover"
            loading="eager"
          />

          {/* Subtle overlay badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-sm border border-primary/20 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-forge-gold" />
            <span>Forge Doodle — unique for you</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
