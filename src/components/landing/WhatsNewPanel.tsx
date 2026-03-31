import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronRight, Sparkles, Zap, Paintbrush, Shield, Cpu, Users, Image, Layers, Terminal, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateItem {
  date: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tag: "new" | "improved" | "fix";
}

const recentUpdates: UpdateItem[] = [
  {
    date: "Mar 31",
    title: "Image Animator Actions",
    description: "Fire lasers, throw money, rain, fire & glitch effects on any image.",
    icon: Zap,
    tag: "new",
  },
  {
    date: "Mar 30",
    title: "Gallery Re-forge",
    description: "Restore any saved image back into Council Mode for more perspective rounds.",
    icon: Users,
    tag: "new",
  },
  {
    date: "Mar 29",
    title: "Forge Gallery Cache",
    description: "All Image Forge creations are now auto-saved — never lose your work.",
    icon: Image,
    tag: "new",
  },
  {
    date: "Mar 28",
    title: "Image Animator",
    description: "Select regions of any image and apply motion presets like float, pulse, and zoom.",
    icon: Paintbrush,
    tag: "new",
  },
  {
    date: "Mar 26",
    title: "Day/Night Backgrounds",
    description: "Landing page now swaps between alien landscapes for light and dark mode.",
    icon: Sparkles,
    tag: "improved",
  },
  {
    date: "Mar 24",
    title: "Easter Sale Banner",
    description: "50% off all credit packs — countdown timer on the landing page.",
    icon: Rocket,
    tag: "new",
  },
  {
    date: "Mar 22",
    title: "Cognitive Fingerprints",
    description: "Analyze your dataset's reasoning patterns, heuristics, and domain bridges.",
    icon: Cpu,
    tag: "new",
  },
  {
    date: "Mar 20",
    title: "Command Palette",
    description: "Press ⌘K to quickly navigate anywhere in the app.",
    icon: Terminal,
    tag: "improved",
  },
  {
    date: "Mar 18",
    title: "Stack Canvas",
    description: "Drag-and-drop visual builder for multi-agent pipelines.",
    icon: Layers,
    tag: "improved",
  },
  {
    date: "Mar 15",
    title: "Two-Factor Auth",
    description: "Added TOTP-based 2FA to secure your account.",
    icon: Shield,
    tag: "new",
  },
];

const tagColors: Record<string, string> = {
  new: "bg-forge-emerald/20 text-forge-emerald",
  improved: "bg-forge-cyan/20 text-forge-cyan",
  fix: "bg-forge-amber/20 text-forge-amber",
};

export function WhatsNewPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating tab */}
      <motion.button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-1.5 rounded-l-lg border border-r-0 border-primary/20 bg-background/90 backdrop-blur-md px-2 py-3 shadow-lg hover:bg-primary/10 transition-colors cursor-pointer",
          "writing-mode-vertical",
          open && "hidden"
        )}
        style={{ writingMode: "vertical-rl" }}
        whileHover={{ x: -4 }}
        aria-label="What's New"
      >
        <Bell className="h-3.5 w-3.5 text-primary rotate-0" style={{ writingMode: "horizontal-tb" }} />
        <span className="text-xs font-bold tracking-wider text-primary">WHAT'S NEW</span>
        <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground" style={{ writingMode: "horizontal-tb" }}>
          {recentUpdates.length}
        </span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            {/* Side panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[60] w-80 sm:w-96 border-l border-primary/15 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold">What's New</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Updates list */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                {recentUpdates.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group flex gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground">{item.date}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase", tagColors[item.tag])}>
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-border/50 px-5 py-3 text-center">
                <p className="text-[10px] text-muted-foreground">
                  Follow us for more updates — shipping daily 🚀
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
