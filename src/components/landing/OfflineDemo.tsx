import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Plane, Cpu, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_MESSAGES = [
  { role: "user", text: "Summarize this product review for tone and intent" },
  { role: "ai", text: "Tone: enthusiastic but measured. Intent: genuine recommendation with minor caveats about pricing. Sentiment: 8.2/10 positive." },
  { role: "user", text: "Extract the key objection" },
  { role: "ai", text: "\"Great product but hard to justify at this price point when competitors offer similar features for less.\"" },
];

function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayed}<span className="animate-pulse">|</span></>;
}

export function OfflineDemo() {
  const [step, setStep] = useState(0);
  const [wifiOff, setWifiOff] = useState(false);
  const [cycle, setCycle] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Sequence: wifi off → messages appear one by one
    timers.push(setTimeout(() => setWifiOff(true), 800));
    timers.push(setTimeout(() => setStep(1), 2000));
    timers.push(setTimeout(() => setStep(2), 4500));
    timers.push(setTimeout(() => setStep(3), 7000));
    timers.push(setTimeout(() => setStep(4), 9500));

    // Loop
    timers.push(
      setTimeout(() => {
        setStep(0);
        setWifiOff(false);
        setCycle((c) => c + 1);
        const restart = setTimeout(() => {
          setWifiOff(true);
          const t2 = setTimeout(() => setStep(1), 1200);
          const t3 = setTimeout(() => setStep(2), 3700);
          const t4 = setTimeout(() => setStep(3), 6200);
          const t5 = setTimeout(() => setStep(4), 8700);
          timers.push(t2, t3, t4, t5);
        }, 800);
        timers.push(restart);
      }, 13000)
    );

    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  const visibleMessages = DEMO_MESSAGES.slice(0, step);

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Mock browser chrome */}
      <div className="rounded-xl overflow-hidden border border-border/60 shadow-2xl bg-card/80 backdrop-blur-sm">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/60 border-b border-border/40">
          <div className="flex gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-red-400/80 text-red-400/80" />
            <Circle className="h-2.5 w-2.5 fill-yellow-400/80 text-yellow-400/80" />
            <Circle className="h-2.5 w-2.5 fill-green-400/80 text-green-400/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-background/60 rounded-md px-3 py-0.5 text-[10px] text-muted-foreground font-mono">
              localhost — on-device inference
            </div>
          </div>
          {/* Airplane mode badge */}
          <AnimatePresence>
            {wifiOff && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 rounded-full px-2 py-0.5"
              >
                <Plane className="h-3 w-3 text-amber-400" />
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                  Airplane Mode
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* App content area */}
        <div className="p-3 sm:p-4 min-h-[200px] sm:min-h-[260px] flex flex-col">
          {/* Model status bar */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-forge-cyan" />
              <span className="text-[10px] sm:text-xs font-mono font-semibold text-foreground/80">
                Local SLM via Ollama
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "h-2 w-2 rounded-full",
                wifiOff ? "bg-red-400" : "bg-emerald-400"
              )} />
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">
                {wifiOff ? "Offline" : "Online"}
              </span>
              {wifiOff && (
                <WifiOff className="h-3 w-3 text-red-400 ml-1" />
              )}
            </div>
          </div>

          {/* Chat messages */}
          <div ref={containerRef} className="flex-1 space-y-2.5 overflow-hidden">
            <AnimatePresence mode="wait">
              {visibleMessages.map((msg, i) => {
                const isLast = i === visibleMessages.length - 1;
                return (
                  <motion.div
                    key={`${msg.role}-${i}-${cycle}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[85%] text-[11px] sm:text-xs leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary/10 border border-primary/20 text-foreground"
                          : "bg-forge-cyan/10 border border-forge-cyan/20 text-foreground"
                      )}
                    >
                      {isLast && msg.role === "ai" ? (
                        <TypewriterText text={msg.text} speed={14} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Thinking indicator */}
            <AnimatePresence>
              {step > 0 && step <= DEMO_MESSAGES.length && DEMO_MESSAGES[step - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                >
                  <div className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-forge-cyan/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-forge-cyan/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-forge-cyan/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="font-medium">Running on-device…</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Performance bar — labeled as simulation */}
          <AnimatePresence>
            {step >= 2 && wifiOff && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 text-[9px] sm:text-[10px] text-muted-foreground font-mono">
                  <span>
                    <CheckCircle2 className="h-3 w-3 text-forge-emerald inline mr-0.5" />
                    No network calls
                  </span>
                  <span>GPU: Local</span>
                </div>
                <span className="text-[9px] font-bold text-forge-emerald uppercase tracking-wider">
                  100% On-Device
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Honest label */}
      <p className="text-center text-[9px] text-muted-foreground/60 mt-2 font-medium">
        Simulated demo — actual inference runs via Ollama or WebGPU on your hardware
      </p>
    </div>
  );
}
