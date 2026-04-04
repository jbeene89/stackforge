import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";

const SALE_END = new Date("2026-04-06T23:59:59").getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { days, hours, minutes, seconds, expired: diff <= 0 };
}

export function SaleCountdownBanner() {
  const { days, hours, minutes, seconds, expired } = useCountdown(SALE_END);

  if (expired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden mb-5 sm:mb-6"
      style={{
        background: "linear-gradient(135deg, hsl(var(--forge-amber) / 0.15), hsl(var(--primary) / 0.1))",
        border: "1px solid hsl(var(--forge-amber) / 0.3)",
      }}
    >
      <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Message */}
        <div className="flex items-center gap-2 sm:gap-3 text-center sm:text-left">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-forge-amber animate-pulse shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">
              🔥 Easter Sale — <span className="text-forge-amber">50% off everything</span>
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              All plans and credit packs. Ends April 6.
            </p>
          </div>
        </div>

        {/* Right: Countdown */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Clock className="h-3 w-3 text-forge-amber mr-1 hidden sm:block" />
          {[
            { val: days, label: "d" },
            { val: hours, label: "h" },
            { val: minutes, label: "m" },
            { val: seconds, label: "s" },
          ].map(({ val, label }) => (
            <div key={label} className="flex items-baseline">
              <span
                className="inline-flex items-center justify-center rounded font-mono text-sm sm:text-base font-bold min-w-[28px] sm:min-w-[32px] h-8 sm:h-9 text-center"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              >
                {String(val).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-0.5 mr-1">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Mini sale comparison for credit packs section
export function SaleComparisonTable() {
  const expired = Date.now() >= SALE_END;
  if (expired) return null;

  const packs = [
    { label: "Starter", credits: 100, regular: 4.99, sale: 2.50 },
    { label: "Popular", credits: 500, regular: 19.99, sale: 10.00 },
    { label: "Best Value", credits: 1500, regular: 59.99, sale: 30.00 },
    { label: "Full Pipeline", credits: 3000, regular: 99.99, sale: 50.00 },
  ];

  return (
    <div className="glass rounded-xl p-3 sm:p-4 mt-4">
      <p className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-forge-amber" />
        Sale vs Post-Sale
      </p>
      <div className="grid grid-cols-3 gap-x-2 text-[10px] sm:text-xs mb-2 text-muted-foreground font-medium">
        <span>Pack</span>
        <span className="text-center" style={{ color: "#7FFF00" }}>During Sale</span>
        <span className="text-center">After April 6</span>
      </div>
      {packs.map((p) => (
        <div key={p.label} className="grid grid-cols-3 gap-x-2 py-1.5 border-t border-border text-xs sm:text-sm items-center">
          <span className="text-foreground font-medium truncate">{p.credits.toLocaleString()} cr</span>
          <span className="text-center font-bold" style={{ color: "#7FFF00" }}>${p.sale.toFixed(2)}</span>
          <span className="text-center text-muted-foreground line-through">${p.regular.toFixed(2)}</span>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Save up to 50% — buy now, use anytime. Credits never expire.
      </p>
    </div>
  );
}