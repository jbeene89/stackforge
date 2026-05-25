import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Sticky bottom CTA that appears on mobile after the user scrolls past the hero.
 * The biggest lever for mobile conversion on this app (72% of traffic is mobile).
 * Hidden once authenticated.
 */
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      // Show after ~80% of viewport scrolled
      const threshold = window.innerHeight * 0.85;
      setVisible(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading || user) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-2 sm:hidden pointer-events-none"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto ffx-card glass rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl px-3 py-2.5 shadow-2xl glow-primary flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-forge-gold font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                <span>Free to start</span>
              </div>
              <div className="text-[11px] font-display font-bold tracking-wide leading-tight truncate">
                50 credits on the house
              </div>
            </div>
            <Link to="/signup" className="shrink-0">
              <button className="gradient-primary text-primary-foreground rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center gap-1.5 min-h-[42px] glow-primary">
                Start free
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
