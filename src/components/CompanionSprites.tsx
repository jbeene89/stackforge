import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

// ─── Sprite definitions ───
const SPRITES = [
  {
    id: "mochi",
    baseX: 92, // % from left
    baseY: 60, // % from top
    size: 48,
    color: "hsl(var(--forge-cyan))",
    glowColor: "hsl(var(--forge-cyan) / 0.4)",
    personality: "curious", // reacts faster, tilts toward clicks
  },
  {
    id: "ember",
    baseX: 5,
    baseY: 45,
    size: 40,
    color: "hsl(var(--forge-gold))",
    glowColor: "hsl(var(--forge-gold) / 0.4)",
    personality: "lazy", // reacts slower, drifts more
  },
  {
    id: "wisp",
    baseX: 88,
    baseY: 25,
    size: 34,
    color: "hsl(var(--forge-violet))",
    glowColor: "hsl(var(--forge-violet) / 0.4)",
    personality: "nervous", // overreacts, jitters
  },
];

interface SpriteState {
  clicked: boolean;
  scrollVelocity: number;
  mouseX: number;
  mouseY: number;
}

function CompanionSprite({
  sprite,
  state,
}: {
  sprite: (typeof SPRITES)[0];
  state: SpriteState;
}) {
  const { scrollVelocity, clicked, mouseX, mouseY } = state;

  // Personality multipliers
  const reactionSpeed =
    sprite.personality === "curious" ? 0.08 : sprite.personality === "nervous" ? 0.12 : 0.04;
  const floatIntensity =
    sprite.personality === "nervous" ? 1.8 : sprite.personality === "lazy" ? 0.6 : 1;
  const clickReaction =
    sprite.personality === "curious" ? 25 : sprite.personality === "nervous" ? 40 : 12;

  // Scroll freefall effect - characters float UP when scrolling down fast
  const freefallY = useSpring(0, { stiffness: 60, damping: 12, mass: floatIntensity });
  // Horizontal wobble from scroll
  const wobbleX = useSpring(0, { stiffness: 80, damping: 14 });
  // Click bounce
  const bounceY = useSpring(0, { stiffness: 300, damping: 10 });
  // Rotation from velocity
  const rotation = useSpring(0, { stiffness: 50, damping: 8 });
  // Scale on click
  const scale = useSpring(1, { stiffness: 400, damping: 15 });
  // Eye tracking
  const eyeX = useSpring(0, { stiffness: 100, damping: 20 });
  const eyeY = useSpring(0, { stiffness: 100, damping: 20 });

  // Freefall: when scrolling down fast, sprite floats up (negative Y)
  useEffect(() => {
    const clampedVel = Math.max(-80, Math.min(80, scrollVelocity));
    freefallY.set(-clampedVel * 2 * floatIntensity);
    wobbleX.set(Math.sin(scrollVelocity * 0.1) * 15 * floatIntensity);
    rotation.set(clampedVel * 0.3);
  }, [scrollVelocity]);

  // Click reaction
  useEffect(() => {
    if (clicked) {
      bounceY.set(-clickReaction);
      scale.set(1.3);
      setTimeout(() => {
        bounceY.set(0);
        scale.set(1);
      }, 150);
    }
  }, [clicked]);

  // Eye tracking toward mouse
  useEffect(() => {
    const spriteScreenX = (sprite.baseX / 100) * window.innerWidth;
    const spriteScreenY = (sprite.baseY / 100) * window.innerHeight;
    const dx = mouseX - spriteScreenX;
    const dy = mouseY - spriteScreenY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxEye = 3;
    if (dist > 0) {
      eyeX.set((dx / dist) * maxEye);
      eyeY.set((dy / dist) * maxEye);
    }
  }, [mouseX, mouseY]);

  // Idle floating animation
  const [idleOffset, setIdleOffset] = useState(0);
  useEffect(() => {
    let frame: number;
    let t = Math.random() * 100;
    const tick = () => {
      t += 0.02;
      setIdleOffset(Math.sin(t) * 6);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, []);

  const s = sprite.size;

  return (
    <motion.div
      className="fixed pointer-events-none z-40"
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
      <motion.div
        style={{ y: bounceY }}
        className="relative"
      >
        {/* Glow aura */}
        <div
          className="absolute inset-[-50%] rounded-full animate-pulse-ring"
          style={{
            background: `radial-gradient(circle, ${sprite.glowColor}, transparent 70%)`,
          }}
        />

        {/* Body */}
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          className="relative drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 8px ${sprite.glowColor})`,
            transform: `translateY(${idleOffset}px)`,
            transition: "transform 0.3s ease",
          }}
        >
          {/* Main body - teardrop spirit shape */}
          <ellipse
            cx="24"
            cy="26"
            rx="12"
            ry="14"
            fill={sprite.color}
            opacity="0.9"
          />
          {/* Inner highlight */}
          <ellipse
            cx="22"
            cy="22"
            rx="6"
            ry="8"
            fill="white"
            opacity="0.15"
          />
          {/* Top wisp/flame */}
          <path
            d="M24 12 Q20 6 24 2 Q28 6 24 12"
            fill={sprite.color}
            opacity="0.7"
          />
          <path
            d="M22 14 Q18 9 21 5"
            stroke={sprite.color}
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />

          {/* Eyes */}
          <motion.g style={{ x: eyeX, y: eyeY }}>
            {/* Left eye */}
            <ellipse cx="19" cy="25" rx="3" ry="3.5" fill="white" opacity="0.95" />
            <circle cx="19.5" cy="25" r="1.8" fill="hsl(var(--background))" />
            <circle cx="20" cy="24.2" r="0.7" fill="white" />

            {/* Right eye */}
            <ellipse cx="29" cy="25" rx="3" ry="3.5" fill="white" opacity="0.95" />
            <circle cx="29.5" cy="25" r="1.8" fill="hsl(var(--background))" />
            <circle cx="30" cy="24.2" r="0.7" fill="white" />
          </motion.g>

          {/* Mouth - changes with scroll */}
          {Math.abs(scrollVelocity) > 15 ? (
            // Surprised/excited mouth
            <ellipse cx="24" cy="32" rx="2.5" ry="3" fill="hsl(var(--background))" opacity="0.6" />
          ) : (
            // Happy mouth
            <path d="M21 31 Q24 34 27 31" stroke="hsl(var(--background))" strokeWidth="1.2" fill="none" opacity="0.5" />
          )}

          {/* Tiny sparkles when clicked */}
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
              <circle cx="24" cy="6" r="1" fill={sprite.color} opacity="0.9">
                <animate attributeName="opacity" values="0.9;0" dur="0.3s" fill="freeze" />
                <animate attributeName="cy" values="6;-4" dur="0.3s" fill="freeze" />
              </circle>
            </>
          )}
        </svg>

        {/* Name tag on hover - visible subtly */}
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-display tracking-widest uppercase opacity-0 hover:opacity-60 transition-opacity"
          style={{ color: sprite.color }}
        >
          {sprite.id}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CompanionSprites() {
  const [state, setState] = useState<SpriteState>({
    clicked: false,
    scrollVelocity: 0,
    mouseX: 0,
    mouseY: 0,
  });

  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const velocityRef = useRef(0);
  const clickCount = useRef(0);

  // Track scroll velocity
  useEffect(() => {
    let raf: number;
    const decay = () => {
      velocityRef.current *= 0.92; // decay toward 0
      setState((s) => ({ ...s, scrollVelocity: velocityRef.current }));
      raf = requestAnimationFrame(decay);
    };
    raf = requestAnimationFrame(decay);

    const onScroll = () => {
      const now = Date.now();
      const dt = Math.max(1, now - lastScrollTime.current);
      const dy = window.scrollY - lastScrollY.current;
      const velocity = (dy / dt) * 16; // normalize to ~60fps
      velocityRef.current = velocity;
      lastScrollY.current = window.scrollY;
      lastScrollTime.current = now;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Track clicks
  useEffect(() => {
    const onClick = () => {
      clickCount.current++;
      const c = clickCount.current;
      setState((s) => ({ ...s, clicked: true }));
      setTimeout(() => {
        if (clickCount.current === c) {
          setState((s) => ({ ...s, clicked: false }));
        }
      }, 400);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  // Track mouse
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setState((s) => ({ ...s, mouseX: e.clientX, mouseY: e.clientY }));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      {SPRITES.map((sprite) => (
        <CompanionSprite key={sprite.id} sprite={sprite} state={state} />
      ))}
    </>
  );
}
