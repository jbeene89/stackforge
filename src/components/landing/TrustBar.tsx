import { motion } from "framer-motion";
import { Shield, Clock, CreditCard } from "lucide-react";

const signals = [
  { icon: Clock, text: "Set up in under 2 minutes" },
  { icon: CreditCard, text: "No credit card required" },
  { icon: Shield, text: "Your data never leaves your control" },
];

export function TrustBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
      className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8"
    >
      {signals.map((s) => (
        <div key={s.text} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium">
          <s.icon className="h-3.5 w-3.5 text-forge-emerald/70" />
          <span>{s.text}</span>
        </div>
      ))}
    </motion.div>
  );
}
