import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/useCredits";
import { useSpriteSettings } from "@/providers/SpriteSettingsProvider";
import { SpellCanvas, type SpellEffect } from "@/components/SpellCanvas";
import {
  Brain, Layers, Wand2, FolderOpen, Sparkles, Coins, ArrowRight,
  Zap, FlaskConical, BarChart3, Gamepad2, Radio, Joystick
} from "lucide-react";

// ─── Route-aware contextual tips ───
const PAGE_TIPS: Record<string, { sprite: string; tips: string[] }> = {
  "/dashboard": {
    sprite: "mochi",
    tips: [
      "Welcome back! Your workspace is ready.",
      "Try creating a new project — click the + button!",
      "Check your recent runs in the activity feed.",
    ],
  },
  "/modules": {
    sprite: "mochi",
    tips: [
      "Each module is a single-purpose AI brain.",
      "Click + to create your first specialist module!",
      "Try setting guardrails to keep your AI focused.",
    ],
  },
  "/stacks": {
    sprite: "ember",
    tips: [
      "Stacks chain modules into pipelines.",
      "Drag modules onto the canvas to build a workflow!",
      "Add conditional edges for smart routing.",
    ],
  },
  "/projects": {
    sprite: "mochi",
    tips: [
      "Projects hold everything — apps, modules, stacks.",
      "Try generating an Android app from plain English!",
    ],
  },
  "/forge-ai": {
    sprite: "wisp",
    tips: [
      "I can generate code for any domain!",
      "Pick a domain, describe what you want, and watch the magic.",
    ],
  },
  "/lab": {
    sprite: "wisp",
    tips: [
      "Test your modules here before wiring them up!",
      "Run benchmarks to compare different configurations.",
    ],
  },
  "/marketplace": {
    sprite: "ember",
    tips: [
      "Browse community-built templates!",
      "You can publish your own modules here too.",
    ],
  },
  "/pricing": {
    sprite: "ember",
    tips: [
      "Builder tier unlocks Export Studio!",
      "Pro tier gives you 2,000 credits/month.",
    ],
  },
  "/": {
    sprite: "mochi",
    tips: [
      "Welcome to Soupy! Sign up to start building.",
      "We build specialist AIs, not chatbots.",
      "Try the demo — no account needed!",
    ],
  },
};

// ─── Navigation shortcuts ───
const NAV_SHORTCUTS = [
  { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { label: "Projects", path: "/projects", icon: FolderOpen },
  { label: "Modules", path: "/modules", icon: Brain },
  { label: "Stacks", path: "/stacks", icon: Layers },
  { label: "Forge AI", path: "/forge-ai", icon: Wand2 },
  { label: "Lab", path: "/lab", icon: FlaskConical },
];

// ─── Framebreaker events ───
const FRAMEBREAKER_MESSAGES = [
  "✨ Psst... you've been scrolling for a while. Take a stretch!",
  "🔥 Fun fact: I've been floating here for 30 seconds and you haven't noticed.",
  "💡 Did you know? Each sprite has a different personality. Try scrolling FAST!",
  "🎮 Click me 5 times fast for a surprise!",
  "🌊 I once dreamed I was a real AI module... then I woke up as a sprite.",
];

// ─── Spell combat lines ───
const SPELL_TAUNT_LINES: Record<string, string[]> = {
  mochi: [
    "❄️ Take THIS, Ember! Frost Surge!",
    "⚡ Wisp, you're too slow! Thunder!",
    "🌊 Hydro Blast! Nobody escapes!",
  ],
  ember: [
    "🔥 FIREBALL! Burn, Mochi!",
    "✨ Arcane Burst! Feel my power, Wisp!",
    "🔥 Inferno Wave! Too hot for ya?",
  ],
  wisp: [
    "⚡ Lightning Strike! Zzzap!",
    "💜 Void Pulse! Into the abyss, Ember!",
    "💚 Healing light... wait, wrong spell! ZAP!",
  ],
};

const SPELL_HIT_LINES: Record<string, string[]> = {
  mochi: ["Ow! That stung! 😤", "Hey, watch it! 💢", "I'll get you back! 🥶"],
  ember: ["Oof! Not the fur! 😫", "That's cold! Literally! 🥶", "Oh it's ON now! 🔥"],
  wisp: ["EEK! 😱", "Why always me?! 💀", "M-my circuits! ⚡"],
};

const SPELL_TYPES: SpellEffect["type"][] = ["fire", "ice", "lightning", "arcane", "heal"];

// ─── Sprite definitions ───
const SPRITES = [
  {
    id: "mochi",
    baseX: 92,
    baseY: 55,
    size: 48,
    color: "hsl(var(--forge-cyan))",
    glowColor: "hsl(var(--forge-cyan) / 0.4)",
    personality: "curious" as const,
    role: "Guide — contextual tips & onboarding",
  },
  {
    id: "ember",
    baseX: 5,
    baseY: 45,
    size: 40,
    color: "hsl(var(--forge-gold))",
    glowColor: "hsl(var(--forge-gold) / 0.4)",
    personality: "lazy" as const,
    role: "Navigator — quick jumps & credit alerts",
  },
  {
    id: "wisp",
    baseX: 88,
    baseY: 25,
    size: 34,
    color: "hsl(var(--forge-violet))",
    glowColor: "hsl(var(--forge-violet) / 0.4)",
    personality: "nervous" as const,
    role: "AI Gateway — opens Forge AI chat",
  },
];

type BubbleMode = "tip" | "nav" | "credit" | "framebreaker" | "ai-hint" | null;

interface SpriteState {
  clicked: boolean;
  scrollVelocity: number;
  mouseX: number;
  mouseY: number;
}

// ─── Speech Bubble ───
function SpeechBubble({
  sprite,
  mode,
  content,
  onNavigate,
  onDismiss,
  creditData,
}: {
  sprite: (typeof SPRITES)[0];
  mode: BubbleMode;
  content: string;
  onNavigate?: (path: string) => void;
  onDismiss: () => void;
  creditData?: { balance: number; tier: string; isLow: boolean } | null;
}) {
  const isLeft = sprite.baseX < 50;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute z-50 pointer-events-auto"
      style={{
        bottom: "calc(100% + 12px)",
        [isLeft ? "left" : "right"]: "-8px",
        width: "220px",
      }}
    >
      <div
        className="rounded-xl p-3 text-xs backdrop-blur-xl border shadow-lg cursor-pointer"
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.85), hsl(var(--card) / 0.7))`,
          borderColor: sprite.color.replace(")", " / 0.3)"),
          boxShadow: `0 0 20px ${sprite.glowColor}`,
        }}
        onClick={onDismiss}
      >
        {/* Sprite name tag */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: sprite.color }} />
          <span className="font-display text-[9px] tracking-[0.15em] uppercase font-bold" style={{ color: sprite.color }}>
            {sprite.id}
          </span>
          {mode === "credit" && creditData?.isLow && (
            <span className="ml-auto text-[9px] text-destructive font-bold animate-pulse">⚠ LOW</span>
          )}
        </div>

        {/* Content */}
        <p className="text-foreground/90 leading-relaxed font-medium">{content}</p>

        {/* Credit display */}
        {mode === "credit" && creditData && (
          <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: `${sprite.color.replace(")", " / 0.1)")}` }}>
            <Coins className="h-3 w-3" style={{ color: sprite.color }} />
            <span className="font-bold text-[11px]">{creditData.balance} credits</span>
            <span className="text-[9px] text-muted-foreground ml-auto">{creditData.tier}</span>
          </div>
        )}

        {/* Nav shortcuts */}
        {mode === "nav" && onNavigate && (
          <div className="mt-2 grid grid-cols-2 gap-1">
            {NAV_SHORTCUTS.map((s) => (
              <button
                key={s.path}
                onClick={(e) => { e.stopPropagation(); onNavigate(s.path); }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-primary/10 transition-colors text-left"
              >
                <s.icon className="h-3 w-3 text-primary shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* AI hint */}
        {mode === "ai-hint" && onNavigate && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate("/forge-ai"); }}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold gradient-primary text-primary-foreground"
          >
            <Wand2 className="h-3 w-3" /> Open Forge AI <ArrowRight className="h-3 w-3" />
          </button>
        )}

        {/* Dismiss hint */}
        <p className="text-[8px] text-muted-foreground/50 mt-1.5 text-center">tap to dismiss</p>
      </div>

      {/* Speech bubble arrow */}
      <div
        className="absolute -bottom-1.5 w-3 h-3 rotate-45"
        style={{
          [isLeft ? "left" : "right"]: "20px",
          background: `hsl(var(--card) / 0.8)`,
          borderRight: `1px solid ${sprite.color.replace(")", " / 0.3)")}`,
          borderBottom: `1px solid ${sprite.color.replace(")", " / 0.3)")}`,
        }}
      />
    </motion.div>
  );
}

// ─── Individual Sprite ───
function CompanionSprite({
  sprite,
  state,
  activeBubble,
  onSpriteClick,
  onNavigate,
  onDismiss,
  bubbleContent,
  creditData,
  sizeMultiplier,
  isHit,
}: {
  sprite: (typeof SPRITES)[0];
  state: SpriteState;
  activeBubble: BubbleMode;
  onSpriteClick: () => void;
  onNavigate: (path: string) => void;
  onDismiss: () => void;
  bubbleContent: string;
  creditData?: { balance: number; tier: string; isLow: boolean } | null;
  sizeMultiplier: number;
  isHit: boolean;
}) {
  const { scrollVelocity, clicked, mouseX, mouseY } = state;

  const floatIntensity =
    sprite.personality === "nervous" ? 1.8 : sprite.personality === "lazy" ? 0.6 : 1;
  const clickReaction =
    sprite.personality === "curious" ? 25 : sprite.personality === "nervous" ? 40 : 12;

  const freefallY = useSpring(0, { stiffness: 60, damping: 12, mass: floatIntensity });
  const wobbleX = useSpring(0, { stiffness: 80, damping: 14 });
  const bounceY = useSpring(0, { stiffness: 300, damping: 10 });
  const rotation = useSpring(0, { stiffness: 50, damping: 8 });
  const scale = useSpring(1, { stiffness: 400, damping: 15 });
  const eyeX = useSpring(0, { stiffness: 100, damping: 20 });
  const eyeY = useSpring(0, { stiffness: 100, damping: 20 });

  useEffect(() => {
    const clampedVel = Math.max(-80, Math.min(80, scrollVelocity));
    freefallY.set(-clampedVel * 2 * floatIntensity);
    wobbleX.set(Math.sin(scrollVelocity * 0.1) * 15 * floatIntensity);
    rotation.set(clampedVel * 0.3);
  }, [scrollVelocity]);

  useEffect(() => {
    if (clicked) {
      bounceY.set(-clickReaction);
      scale.set(1.3);
      setTimeout(() => { bounceY.set(0); scale.set(1); }, 150);
    }
  }, [clicked]);

  useEffect(() => {
    const sx = (sprite.baseX / 100) * window.innerWidth;
    const sy = (sprite.baseY / 100) * window.innerHeight;
    const dx = mouseX - sx;
    const dy = mouseY - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      eyeX.set((dx / dist) * 3);
      eyeY.set((dy / dist) * 3);
    }
  }, [mouseX, mouseY]);

  const [idleOffset, setIdleOffset] = useState(0);
  useEffect(() => {
    let frame: number;
    let t = Math.random() * 100;
    const tick = () => { t += 0.02; setIdleOffset(Math.sin(t) * 6); frame = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  const s = sprite.size * sizeMultiplier;

  // Hit shake effect
  const hitShake = useSpring(0, { stiffness: 600, damping: 8 });
  useEffect(() => {
    if (isHit) {
      hitShake.set(15);
      setTimeout(() => hitShake.set(-12), 50);
      setTimeout(() => hitShake.set(8), 100);
      setTimeout(() => hitShake.set(-5), 150);
      setTimeout(() => hitShake.set(0), 200);
    }
  }, [isHit]);

  return (
    <motion.div
      className="fixed z-40"
      style={{
        left: `${sprite.baseX}%`,
        top: `${sprite.baseY}%`,
        x: wobbleX,
        y: freefallY,
        rotate: rotation,
        scale,
        width: s,
        height: s,
      }}
    >
      <motion.div style={{ y: bounceY }} className="relative">
        {/* Speech Bubble */}
        <AnimatePresence>
          {activeBubble && (
            <SpeechBubble
              sprite={sprite}
              mode={activeBubble}
              content={bubbleContent}
              onNavigate={onNavigate}
              onDismiss={onDismiss}
              creditData={creditData}
            />
          )}
        </AnimatePresence>

        {/* Glow aura */}
        <div
          className="absolute inset-[-50%] rounded-full animate-pulse-ring pointer-events-none"
          style={{ background: `radial-gradient(circle, ${sprite.glowColor}, transparent 70%)` }}
        />

        {/* Clickable body */}
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          className="relative drop-shadow-lg cursor-pointer pointer-events-auto"
          style={{
            filter: `drop-shadow(0 0 8px ${sprite.glowColor})`,
            transform: `translateY(${idleOffset}px)`,
            transition: "transform 0.3s ease",
          }}
          onClick={(e) => { e.stopPropagation(); onSpriteClick(); }}
        >
          <ellipse cx="24" cy="26" rx="12" ry="14" fill={sprite.color} opacity="0.9" />
          <ellipse cx="22" cy="22" rx="6" ry="8" fill="white" opacity="0.15" />
          <path d="M24 12 Q20 6 24 2 Q28 6 24 12" fill={sprite.color} opacity="0.7" />
          <path d="M22 14 Q18 9 21 5" stroke={sprite.color} strokeWidth="1.5" fill="none" opacity="0.4" />

          <motion.g style={{ x: eyeX, y: eyeY }}>
            <ellipse cx="19" cy="25" rx="3" ry="3.5" fill="white" opacity="0.95" />
            <circle cx="19.5" cy="25" r="1.8" fill="hsl(var(--background))" />
            <circle cx="20" cy="24.2" r="0.7" fill="white" />
            <ellipse cx="29" cy="25" rx="3" ry="3.5" fill="white" opacity="0.95" />
            <circle cx="29.5" cy="25" r="1.8" fill="hsl(var(--background))" />
            <circle cx="30" cy="24.2" r="0.7" fill="white" />
          </motion.g>

          {Math.abs(scrollVelocity) > 15 ? (
            <ellipse cx="24" cy="32" rx="2.5" ry="3" fill="hsl(var(--background))" opacity="0.6" />
          ) : activeBubble ? (
            // Talking mouth
            <ellipse cx="24" cy="32" rx="2" ry="1.5" fill="hsl(var(--background))" opacity="0.5" />
          ) : (
            <path d="M21 31 Q24 34 27 31" stroke="hsl(var(--background))" strokeWidth="1.2" fill="none" opacity="0.5" />
          )}

          {clicked && (
            <>
              <circle cx="8" cy="18" r="1.5" fill="white" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0" dur="0.4s" fill="freeze" />
                <animate attributeName="r" values="1.5;4" dur="0.4s" fill="freeze" />
              </circle>
              <circle cx="38" cy="20" r="1.5" fill="white" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0" dur="0.5s" fill="freeze" />
                <animate attributeName="r" values="1.5;3" dur="0.5s" fill="freeze" />
              </circle>
            </>
          )}
        </svg>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Controller ───
export function CompanionSprites() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: credits } = useCredits();
  const { visible, sizeMultiplier, spellsEnabled } = useSpriteSettings();

  const [state, setState] = useState<SpriteState>({
    clicked: false, scrollVelocity: 0, mouseX: 0, mouseY: 0,
  });
  const [activeSpriteId, setActiveSpriteId] = useState<string | null>(null);
  const [bubbleMode, setBubbleMode] = useState<BubbleMode>(null);
  const [bubbleContent, setBubbleContent] = useState("");
  const [tipIndex, setTipIndex] = useState<Record<string, number>>({});
  const [rapidClicks, setRapidClicks] = useState(0);
  const [spellEffects, setSpellEffects] = useState<SpellEffect[]>([]);
  const [hitSprites, setHitSprites] = useState<Set<string>>(new Set());
  const rapidClickTimer = useRef<ReturnType<typeof setTimeout>>();
  const framebreakerTimer = useRef<ReturnType<typeof setTimeout>>();
  const spellTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const velocityRef = useRef(0);
  const clickCount = useRef(0);

  // Credit alert data
  const creditData = useMemo(() => {
    if (!credits) return null;
    const pct = credits.monthly_allowance > 0 ? (credits.credits_balance / credits.monthly_allowance) * 100 : 0;
    return { balance: credits.credits_balance, tier: credits.tier, isLow: pct < 20 };
  }, [credits]);

  // Get page tips
  const getPageTips = () => {
    const path = location.pathname;
    const match = PAGE_TIPS[path] || PAGE_TIPS[Object.keys(PAGE_TIPS).find(k => k !== "/" && path.startsWith(k)) || ""];
    return match;
  };

  // ─── SPELL COMBAT SYSTEM ───
  const castSpell = useCallback(() => {
    if (!spellsEnabled || !visible) return;

    const casterIdx = Math.floor(Math.random() * SPRITES.length);
    let targetIdx = Math.floor(Math.random() * SPRITES.length);
    while (targetIdx === casterIdx) targetIdx = Math.floor(Math.random() * SPRITES.length);

    const caster = SPRITES[casterIdx];
    const target = SPRITES[targetIdx];
    const spellType = SPELL_TYPES[Math.floor(Math.random() * SPELL_TYPES.length)];

    // Show taunt bubble on caster
    const tauntLines = SPELL_TAUNT_LINES[caster.id] || SPELL_TAUNT_LINES.mochi;
    setActiveSpriteId(caster.id);
    setBubbleMode("framebreaker");
    setBubbleContent(tauntLines[Math.floor(Math.random() * tauntLines.length)]);

    // Launch spell projectile after taunt
    setTimeout(() => {
      const fromX = (caster.baseX / 100) * window.innerWidth;
      const fromY = (caster.baseY / 100) * window.innerHeight;
      const toX = (target.baseX / 100) * window.innerWidth;
      const toY = (target.baseY / 100) * window.innerHeight;

      const effect: SpellEffect = {
        id: `spell-${Date.now()}`,
        fromX, fromY, toX, toY,
        type: spellType,
        startTime: Date.now(),
        duration: 1200 + Math.random() * 600,
      };

      setSpellEffects(prev => [...prev, effect]);

      // Hit reaction on target
      setTimeout(() => {
        setHitSprites(prev => new Set(prev).add(target.id));
        setTimeout(() => setHitSprites(prev => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        }), 500);

        // Target reacts with hit line
        const hitLines = SPELL_HIT_LINES[target.id] || SPELL_HIT_LINES.mochi;
        setActiveSpriteId(target.id);
        setBubbleMode("framebreaker");
        setBubbleContent(hitLines[Math.floor(Math.random() * hitLines.length)]);
      }, effect.duration * 0.75);
    }, 800);
  }, [spellsEnabled, visible]);

  // Schedule random spell combats
  useEffect(() => {
    if (!spellsEnabled || !visible) return;

    // Fire first spell quickly so user sees it
    const firstDelay = 3000 + Math.random() * 4000; // 3-7s for the first one
    const scheduleSpell = (delay: number) => {
      spellTimer.current = setTimeout(() => {
        castSpell();
        scheduleSpell(8000 + Math.random() * 20000); // 8-28s after that
      }, delay);
    };
    scheduleSpell(firstDelay);
    return () => clearTimeout(spellTimer.current);
  }, [spellsEnabled, visible, castSpell]);

  const handleSpellDone = useCallback((id: string) => {
    setSpellEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  // Handle sprite click
  const handleSpriteClick = (spriteId: string) => {
    if (activeSpriteId === spriteId && bubbleMode) {
      dismissBubble();
      return;
    }

    setRapidClicks(prev => {
      const next = prev + 1;
      clearTimeout(rapidClickTimer.current);
      rapidClickTimer.current = setTimeout(() => setRapidClicks(0), 1500);

      if (next >= 5) {
        setActiveSpriteId(spriteId);
        setBubbleMode("framebreaker");
        setBubbleContent(FRAMEBREAKER_MESSAGES[Math.floor(Math.random() * FRAMEBREAKER_MESSAGES.length)]);
        setRapidClicks(0);
        return 0;
      }
      return next;
    });

    if (spriteId === "mochi") {
      const pageTips = getPageTips();
      if (pageTips) {
        const key = location.pathname;
        const idx = tipIndex[key] || 0;
        setBubbleContent(pageTips.tips[idx % pageTips.tips.length]);
        setTipIndex(prev => ({ ...prev, [key]: idx + 1 }));
        setBubbleMode("tip");
      } else {
        setBubbleContent("I don't have specific tips for this page yet, but I'm always watching! 👀");
        setBubbleMode("tip");
      }
    } else if (spriteId === "ember") {
      if (bubbleMode === "nav" && activeSpriteId === "ember") {
        if (creditData) {
          const msg = creditData.isLow
            ? `⚠️ Only ${creditData.balance} credits left! Consider upgrading.`
            : `You have ${creditData.balance} credits. Looking good! ✨`;
          setBubbleContent(msg);
          setBubbleMode("credit");
        } else {
          setBubbleContent("Log in to see your credit balance!");
          setBubbleMode("tip");
        }
      } else {
        setBubbleContent("Where would you like to go?");
        setBubbleMode("nav");
      }
    } else if (spriteId === "wisp") {
      setBubbleContent("Need help? I can connect you to Forge AI — your code generation assistant! 🧙");
      setBubbleMode("ai-hint");
    }

    setActiveSpriteId(spriteId);
  };

  const dismissBubble = () => {
    setActiveSpriteId(null);
    setBubbleMode(null);
    setBubbleContent("");
  };

  const handleNavigate = (path: string) => {
    dismissBubble();
    navigate(path);
  };

  // Auto-dismiss after 8s
  useEffect(() => {
    if (bubbleMode) {
      const t = setTimeout(dismissBubble, 8000);
      return () => clearTimeout(t);
    }
  }, [bubbleMode, bubbleContent]);

  // Dismiss on route change
  useEffect(() => { dismissBubble(); }, [location.pathname]);

  // Framebreaker idle messages
  useEffect(() => {
    const scheduleFramebreaker = () => {
      clearTimeout(framebreakerTimer.current);
      framebreakerTimer.current = setTimeout(() => {
        if (!bubbleMode) {
          const sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
          setActiveSpriteId(sprite.id);
          setBubbleMode("framebreaker");
          setBubbleContent(FRAMEBREAKER_MESSAGES[Math.floor(Math.random() * FRAMEBREAKER_MESSAGES.length)]);
        }
      }, 45000 + Math.random() * 30000);
    };
    scheduleFramebreaker();
    return () => clearTimeout(framebreakerTimer.current);
  }, [location.pathname, bubbleMode]);

  // Credit low auto-alert
  const alertedPages = useRef(new Set<string>());
  useEffect(() => {
    if (creditData?.isLow && !alertedPages.current.has(location.pathname) && !bubbleMode) {
      alertedPages.current.add(location.pathname);
      const t = setTimeout(() => {
        setActiveSpriteId("ember");
        setBubbleMode("credit");
        setBubbleContent(`⚠️ Heads up — you're down to ${creditData.balance} credits. Might want to top up!`);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [location.pathname, creditData?.isLow]);

  // ─── Scroll / click / mouse tracking ───
  useEffect(() => {
    let raf: number;
    const decay = () => {
      velocityRef.current *= 0.92;
      setState(s => ({ ...s, scrollVelocity: velocityRef.current }));
      raf = requestAnimationFrame(decay);
    };
    raf = requestAnimationFrame(decay);

    const onScroll = () => {
      const now = Date.now();
      const dt = Math.max(1, now - lastScrollTime.current);
      const dy = window.scrollY - lastScrollY.current;
      velocityRef.current = (dy / dt) * 16;
      lastScrollY.current = window.scrollY;
      lastScrollTime.current = now;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const onClick = () => {
      clickCount.current++;
      const c = clickCount.current;
      setState(s => ({ ...s, clicked: true }));
      setTimeout(() => { if (clickCount.current === c) setState(s => ({ ...s, clicked: false })); }, 400);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setState(s => ({ ...s, mouseX: e.clientX, mouseY: e.clientY }));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!visible) return null;

  return (
    <>
      <SpellCanvas effects={spellEffects} onEffectDone={handleSpellDone} />
      {SPRITES.map((sprite) => (
        <CompanionSprite
          key={sprite.id}
          sprite={sprite}
          state={state}
          activeBubble={activeSpriteId === sprite.id ? bubbleMode : null}
          onSpriteClick={() => handleSpriteClick(sprite.id)}
          onNavigate={handleNavigate}
          onDismiss={dismissBubble}
          bubbleContent={activeSpriteId === sprite.id ? bubbleContent : ""}
          creditData={creditData}
          sizeMultiplier={sizeMultiplier}
          isHit={hitSprites.has(sprite.id)}
        />
      ))}
    </>
  );
}
