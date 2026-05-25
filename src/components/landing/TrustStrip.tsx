import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Brain, Coins, Users, Globe2 } from "lucide-react";

interface PublicStats {
  models_trained: number;
  credits_used_total: number;
  users_total: number;
  datasets_total: number;
}

interface CountryRow {
  country: string;
  visits: number;
}

const FLAG: Record<string, string> = {
  US: "🇺🇸", IN: "🇮🇳", SA: "🇸🇦", RU: "🇷🇺", ID: "🇮🇩",
  IT: "🇮🇹", PK: "🇵🇰", BD: "🇧🇩", GB: "🇬🇧", DE: "🇩🇪",
  CA: "🇨🇦", BR: "🇧🇷", FR: "🇫🇷", AU: "🇦🇺", JP: "🇯🇵",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * Live trust strip directly under the hero.
 * Pulls aggregate counts (no PII) from the public_stats view + country RPC.
 */
export function TrustStrip() {
  const { data: stats } = useQuery<PublicStats | null>({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_stats" as any)
        .select("*")
        .maybeSingle();
      if (error) return null;
      return data as PublicStats;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: countries = [] } = useQuery<CountryRow[]>({
    queryKey: ["public-country-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_country_stats" as any);
      if (error) return [];
      return (data as CountryRow[]) || [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const tiles = [
    {
      icon: Brain,
      value: stats ? fmt(stats.models_trained) : "—",
      label: "models trained",
      tone: "text-forge-cyan",
    },
    {
      icon: Coins,
      value: stats ? fmt(stats.credits_used_total) : "—",
      label: "credits put to work",
      tone: "text-forge-gold",
    },
    {
      icon: Users,
      value: stats ? fmt(stats.users_total) : "—",
      label: "builders onboard",
      tone: "text-primary",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative max-w-5xl mx-auto mt-4 sm:mt-6 px-3 sm:px-6"
    >
      <div className="ffx-card glass rounded-xl border border-primary/15 px-3 sm:px-5 py-3 sm:py-4">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {tiles.map((t) => (
            <div key={t.label} className="flex items-center gap-2">
              <t.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${t.tone} shrink-0`} />
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-base sm:text-xl font-bold tabular-nums">
                  {t.value}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">
                  {t.label}
                </span>
              </div>
            </div>
          ))}

          {countries.length > 0 && (
            <div className="flex items-center gap-1.5 pl-0 sm:pl-3 sm:border-l border-primary/15">
              <Globe2 className="h-3.5 w-3.5 text-forge-emerald shrink-0" />
              <div className="flex items-center gap-0.5 text-sm sm:text-base">
                {countries.slice(0, 8).map((c) => (
                  <span
                    key={c.country}
                    title={`${c.country}: ${c.visits} visits`}
                    className="leading-none"
                  >
                    {FLAG[c.country] || "🌐"}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                worldwide
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
