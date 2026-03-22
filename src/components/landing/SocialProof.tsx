import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Users, Layers, Cpu, Rocket } from "lucide-react";
import { FFXDivider } from "@/components/FFXOrnament";

const stats = [
  { icon: Users, value: "500+", label: "Builders", color: "text-forge-cyan" },
  { icon: Layers, value: "2,400+", label: "Modules Created", color: "text-forge-gold" },
  { icon: Cpu, value: "12", label: "Module Types", color: "text-primary" },
  { icon: Rocket, value: "99.9%", label: "Uptime", color: "text-forge-emerald" },
];

const testimonials = [
  {
    quote: "We replaced three separate AI tools with one Soupy stack. Our proposal turnaround went from 3 days to 20 minutes.",
    name: "Marcus Reinhold",
    role: "Ops Lead, Marine Construction",
    color: "border-forge-cyan/30",
  },
  {
    quote: "The module system clicks instantly. Each AI does one thing well — no prompt wrestling, no hallucination rabbit holes.",
    name: "Dr. Priya Nair",
    role: "R&D Director, BioTech",
    color: "border-forge-gold/30",
  },
  {
    quote: "Generated an Android inspection app for our field team in an afternoon. They were using it the next morning.",
    name: "Jake Torres",
    role: "Field Manager, Infrastructure Co.",
    color: "border-forge-emerald/30",
  },
];

export function SocialProof() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="text-[10px] mb-4 border-forge-emerald/30 text-forge-emerald font-semibold">
            <Star className="h-3 w-3 mr-1" /> Trusted by builders
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-4xl font-display font-bold tracking-wide">
            Real teams. Real <span className="gradient-text">results.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-14">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="ffx-card glass rounded-xl p-5 text-center hover:glow-primary transition-all duration-500"
            >
              <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
              <div className="text-2xl sm:text-3xl font-display font-bold tracking-wider">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <FFXDivider className="mb-14" />

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`ffx-card glass rounded-xl p-6 border-l-4 ${t.color} hover:glow-primary transition-all duration-500 flex flex-col`}
            >
              <Quote className="h-5 w-5 text-muted-foreground/30 mb-3 shrink-0" />
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed flex-1 font-medium italic">
                "{t.quote}"
              </p>
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="text-xs font-bold font-display tracking-wide">{t.name}</div>
                <div className="text-[10px] text-muted-foreground font-medium">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
