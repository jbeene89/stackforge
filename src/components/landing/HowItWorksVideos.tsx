import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Play, Brain, Heart, Zap, Shield, Layers } from "lucide-react";

const videos = [
  {
    id: "builder",
    title: "Builder — Axiom",
    subtitle: "Kernel Activation",
    desc: "Watch how a raw prompt triggers kernel activation — expanding into structured reasoning pathways that build outward from a single seed idea.",
    src: "/videos/soupy-1-builder-axiom.mp4",
    icon: Brain,
    accent: "text-forge-cyan",
    border: "border-forge-cyan/30",
    bg: "bg-forge-cyan/10",
    glow: "shadow-forge-cyan/20",
  },
  {
    id: "empath",
    title: "Empath — Lyra",
    subtitle: "Tone Mapping",
    desc: "The empathic lens rewrites outputs for emotional intelligence — adjusting tone, softening friction, and amplifying human resonance.",
    src: "/videos/soupy-2-empath-lyra.mp4",
    icon: Heart,
    accent: "text-forge-rose",
    border: "border-forge-rose/30",
    bg: "bg-forge-rose/10",
    glow: "shadow-forge-rose/20",
  },
  {
    id: "framebreaker",
    title: "Frame Breaker — Flux",
    subtitle: "Lateral Thinking",
    desc: "Flux shatters the default frame — surfacing blind spots, alternative framings, and unexpected connections that linear thinking misses.",
    src: "/videos/soupy-3-framebreaker-flux.mp4",
    icon: Zap,
    accent: "text-forge-gold",
    border: "border-forge-gold/30",
    bg: "bg-forge-gold/10",
    glow: "shadow-forge-gold/20",
  },
  {
    id: "redteam",
    title: "Red Team — Sentinel",
    subtitle: "Vulnerability Scan",
    desc: "Sentinel probes every output for weaknesses — hallucinations, logic gaps, security risks — and hardens the response before it ships.",
    src: "/videos/soupy-4-redteam-sentinel.mp4",
    icon: Shield,
    accent: "text-forge-emerald",
    border: "border-forge-emerald/30",
    bg: "bg-forge-emerald/10",
    glow: "shadow-forge-emerald/20",
  },
  {
    id: "systems",
    title: "Systems — Prism",
    subtitle: "Five-Mind Synthesis",
    desc: "Prism converges all five perspectives into a unified output — recursive loops fill gaps until the result is airtight.",
    src: "/videos/soupy-5-systems-prism.mp4",
    icon: Layers,
    accent: "text-forge-violet",
    border: "border-forge-violet/30",
    bg: "bg-forge-violet/10",
    glow: "shadow-forge-violet/20",
  },
];

export function HowItWorksVideos() {
  const [activeVideo, setActiveVideo] = useState(0);
  const current = videos[activeVideo];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-30" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <Badge variant="outline" className="text-[10px] mb-4 border-forge-violet/30 text-forge-violet font-semibold">
            The Popcorn Injection Pipeline
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold text-balance tracking-wide">
            See the <span className="gradient-text">Five Perspectives</span> in action
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-4 max-w-2xl mx-auto font-medium leading-relaxed">
            Every piece of training data passes through five cognitive lenses. Watch how each perspective transforms raw input into deeply nuanced intelligence.
          </p>
        </motion.div>

        {/* Video selector tabs */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
          {videos.map((v, i) => (
            <motion.button
              key={v.id}
              onClick={() => setActiveVideo(i)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 border ${
                activeVideo === i
                  ? `${v.bg} ${v.border} ${v.accent}`
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <v.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{v.title.split(" — ")[0]}</span>
              <span className="sm:hidden">{v.title.split(" — ")[1]}</span>
            </motion.button>
          ))}
        </div>

        {/* Main video + description */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-center"
        >
          {/* Video player */}
          <div className={`lg:col-span-3 ffx-card glass rounded-xl overflow-hidden border ${current.border}`}>
            <div className="relative aspect-video bg-background/80">
              <video
                key={current.src}
                src={current.src}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Description panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${current.bg} ${current.border}`}>
                <current.icon className={`h-5 w-5 ${current.accent}`} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-display font-bold tracking-wide">{current.title}</h3>
                <p className={`text-xs font-semibold ${current.accent}`}>{current.subtitle}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {current.desc}
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-2 pt-2">
              {videos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveVideo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeVideo
                      ? `w-6 bg-primary`
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
