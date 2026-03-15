import { useEffect, useRef } from "react";

interface SpellEffect {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: "fire" | "ice" | "lightning" | "arcane" | "heal";
  startTime: number;
  duration: number;
}

const SPELL_COLORS: Record<string, { core: string; glow: string; particles: string }> = {
  fire: { core: "#ff6b35", glow: "rgba(255,107,53,0.4)", particles: "#ffb347" },
  ice: { core: "#4fc3f7", glow: "rgba(79,195,247,0.4)", particles: "#b3e5fc" },
  lightning: { core: "#fff176", glow: "rgba(255,241,118,0.5)", particles: "#ffffff" },
  arcane: { core: "#ce93d8", glow: "rgba(206,147,216,0.4)", particles: "#e1bee7" },
  heal: { core: "#69f0ae", glow: "rgba(105,240,174,0.4)", particles: "#b9f6ca" },
};

export function SpellCanvas({
  effects,
  onEffectDone,
}: {
  effects: SpellEffect[];
  onEffectDone: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsRef = useRef(effects);
  effectsRef.current = effects;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; life: number; maxLife: number;
      color: string; effectId: string;
    }> = [];

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const now = Date.now();

      for (const fx of effectsRef.current) {
        const elapsed = now - fx.startTime;
        const progress = Math.min(1, elapsed / fx.duration);
        const colors = SPELL_COLORS[fx.type];

        if (progress >= 1) {
          onEffectDone(fx.id);
          continue;
        }

        // Projectile position along bezier
        const midX = (fx.fromX + fx.toX) / 2;
        const midY = Math.min(fx.fromY, fx.toY) - 80 - Math.random() * 20;
        const t = Math.min(progress * 1.3, 1); // projectile arrives early

        const px = (1-t)*(1-t)*fx.fromX + 2*(1-t)*t*midX + t*t*fx.toX;
        const py = (1-t)*(1-t)*fx.fromY + 2*(1-t)*t*midY + t*t*fx.toY;

        if (t < 1) {
          // Draw projectile trail
          const trailLen = fx.type === "lightning" ? 8 : 5;
          for (let i = 0; i < trailLen; i++) {
            const tt = Math.max(0, t - i * 0.02);
            const tx = (1-tt)*(1-tt)*fx.fromX + 2*(1-tt)*tt*midX + tt*tt*fx.toX;
            const ty = (1-tt)*(1-tt)*fx.fromY + 2*(1-tt)*tt*midY + tt*tt*fx.toY;
            const alpha = (1 - i / trailLen) * 0.6;
            const size = (1 - i / trailLen) * (fx.type === "fire" ? 8 : fx.type === "lightning" ? 4 : 6);

            ctx.beginPath();
            ctx.arc(tx, ty, size, 0, Math.PI * 2);
            ctx.fillStyle = colors.core.replace(")", `,${alpha})`).replace("rgb", "rgba");
            // Simple approach: use the color directly with global alpha
            ctx.globalAlpha = alpha;
            ctx.fillStyle = colors.core;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Glow
            const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, size * 3);
            grd.addColorStop(0, colors.glow);
            grd.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.arc(tx, ty, size * 3, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Lightning bolts
          if (fx.type === "lightning" && Math.random() > 0.5) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            let bx = px, by = py;
            for (let j = 0; j < 4; j++) {
              bx += (Math.random() - 0.5) * 30;
              by += (Math.random() - 0.5) * 30;
              ctx.lineTo(bx, by);
            }
            ctx.strokeStyle = colors.particles;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          // Spawn trail particles
          if (Math.random() > 0.4) {
            particles.push({
              x: px + (Math.random() - 0.5) * 6,
              y: py + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2 - 0.5,
              size: 1 + Math.random() * 2.5,
              life: 0,
              maxLife: 20 + Math.random() * 20,
              color: Math.random() > 0.5 ? colors.core : colors.particles,
              effectId: fx.id,
            });
          }
        }

        // Impact explosion at target
        if (progress > 0.7) {
          const impactProgress = (progress - 0.7) / 0.3;
          const impactSize = 30 * Math.sin(impactProgress * Math.PI);
          const impactAlpha = (1 - impactProgress) * 0.6;

          // Shockwave ring
          ctx.beginPath();
          ctx.arc(fx.toX, fx.toY, impactSize, 0, Math.PI * 2);
          ctx.strokeStyle = colors.core;
          ctx.lineWidth = 2;
          ctx.globalAlpha = impactAlpha;
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Inner flash
          const flashGrd = ctx.createRadialGradient(fx.toX, fx.toY, 0, fx.toX, fx.toY, impactSize * 0.6);
          flashGrd.addColorStop(0, colors.glow);
          flashGrd.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(fx.toX, fx.toY, impactSize * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = flashGrd;
          ctx.globalAlpha = impactAlpha * 0.8;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Burst particles on first impact frame
          if (progress > 0.7 && progress < 0.75) {
            for (let k = 0; k < 12; k++) {
              const angle = (k / 12) * Math.PI * 2 + Math.random() * 0.3;
              const speed = 2 + Math.random() * 4;
              particles.push({
                x: fx.toX,
                y: fx.toY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 3,
                life: 0,
                maxLife: 30 + Math.random() * 20,
                color: Math.random() > 0.3 ? colors.core : colors.particles,
                effectId: fx.id,
              });
            }
          }
        }
      }

      // Draw & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // tiny gravity
        p.vx *= 0.98;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (effects.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

export type { SpellEffect };
