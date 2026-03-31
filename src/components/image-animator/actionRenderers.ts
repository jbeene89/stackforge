import type { ActionEffect, FocalPoint } from "./types";

/**
 * Renders one-shot action effects (laser, money, explosion, lightning, custom)
 * Returns false when the effect has expired.
 */
export function renderAction(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  focalPoint: FocalPoint,
  action: ActionEffect,
  now: number
): boolean {
  const elapsed = (now - action.startTime) / 1000;
  if (elapsed > action.duration) return false;
  const progress = elapsed / action.duration; // 0→1

  const fx = focalPoint.x * canvas.width;
  const fy = focalPoint.y * canvas.height;
  const p = action.params;

  ctx.save();

  switch (action.type) {
    case "laser":
      renderLaser(ctx, canvas, fx, fy, progress, p.color, p.secondaryColor || "#ff8800");
      break;
    case "money":
      renderMoney(ctx, fx, fy, progress, p);
      break;
    case "explosion":
      renderExplosion(ctx, fx, fy, progress, p);
      break;
    case "lightning":
      renderLightning(ctx, fx, fy, progress, p);
      break;
    case "custom":
      renderCustom(ctx, fx, fy, progress, p);
      break;
  }

  ctx.restore();
  return true;
}

function renderLaser(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  fx: number, fy: number,
  progress: number,
  color: string, secondary: string
) {
  const beamLength = Math.min(progress * 4, 1) * canvas.width;
  const fade = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 30 * fade;

  // Main beam
  ctx.strokeStyle = color;
  ctx.lineWidth = 4 * fade;
  ctx.globalAlpha = fade;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + beamLength, fy + (Math.sin(progress * 10) * 20));
  ctx.stroke();

  // Inner bright core
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2 * fade;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + beamLength, fy + (Math.sin(progress * 10) * 20));
  ctx.stroke();

  // Impact sparks at tip
  if (progress < 0.8) {
    const tipX = fx + beamLength;
    const tipY = fy + (Math.sin(progress * 10) * 20);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + progress * 5;
      const len = 10 + Math.random() * 15;
      ctx.strokeStyle = `rgba(255, 200, 50, ${fade * 0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX + Math.cos(angle) * len, tipY + Math.sin(angle) * len);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function renderMoney(
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number,
  progress: number,
  params: ActionEffect["params"]
) {
  const fade = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;

  for (let i = 0; i < params.particleCount; i++) {
    const seed = i * 137.5;
    const angle = (seed % (Math.PI * 2));
    const dist = progress * params.speed * 60 * (0.5 + (seed % 100) / 200);
    const x = fx + Math.cos(angle) * dist;
    const y = fy + Math.sin(angle) * dist - progress * 40 + Math.sin(progress * 5 + seed) * 10;
    const rotation = progress * 3 + seed;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = fade * (0.6 + (seed % 40) / 100);

    // Draw dollar sign
    ctx.fillStyle = params.color;
    ctx.font = `bold ${14 + (seed % 8)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 0);

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function renderExplosion(
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number,
  progress: number,
  params: ActionEffect["params"]
) {
  const fade = progress > 0.4 ? 1 - (progress - 0.4) / 0.6 : 1;

  // Shockwave ring
  const ringR = progress * 200;
  ctx.strokeStyle = `rgba(255, 200, 50, ${fade * 0.6})`;
  ctx.lineWidth = 3 * (1 - progress);
  ctx.beginPath();
  ctx.arc(fx, fy, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary ring
  if (progress > 0.1) {
    const r2 = (progress - 0.1) * 180;
    ctx.strokeStyle = `rgba(255, 100, 0, ${fade * 0.4})`;
    ctx.lineWidth = 2 * (1 - progress);
    ctx.beginPath();
    ctx.arc(fx, fy, r2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Particles
  for (let i = 0; i < params.particleCount; i++) {
    const seed = i * 67.3;
    const angle = (seed / params.particleCount) * Math.PI * 2;
    const speed = 0.5 + (seed % 100) / 100;
    const dist = progress * speed * 150;
    const x = fx + Math.cos(angle) * dist;
    const y = fy + Math.sin(angle) * dist + progress * progress * 30;
    const size = (1 - progress) * (2 + (seed % 4));

    const hue = 30 + (seed % 30);
    ctx.fillStyle = `hsla(${hue}, 100%, 55%, ${fade * 0.8})`;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
    ctx.fill();
  }

  // Core flash
  if (progress < 0.15) {
    const flashAlpha = (1 - progress / 0.15) * 0.5;
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 50);
    grad.addColorStop(0, `rgba(255, 255, 200, ${flashAlpha})`);
    grad.addColorStop(1, `rgba(255, 100, 0, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(fx - 60, fy - 60, 120, 120);
  }
}

function renderLightning(
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number,
  progress: number,
  params: ActionEffect["params"]
) {
  const fade = progress > 0.5 ? 1 - (progress - 0.5) / 0.5 : 1;
  // Flicker
  if (Math.random() > 0.3) {
    ctx.globalAlpha = fade;
    ctx.shadowColor = params.color;
    ctx.shadowBlur = 20;

    for (let b = 0; b < params.particleCount; b++) {
      const angle = (b / params.particleCount) * params.spread - params.spread / 2 - Math.PI / 2;
      drawBolt(ctx, fx, fy, angle, 80 + progress * 120, params.color, params.secondaryColor || "#fff");
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

function drawBolt(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number, length: number,
  color: string, core: string
) {
  const segments = 8;
  const segLen = length / segments;
  let cx = x, cy = y;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);

  for (let i = 0; i < segments; i++) {
    const jitter = (Math.random() - 0.5) * 20;
    cx += Math.cos(angle) * segLen + Math.cos(angle + Math.PI / 2) * jitter;
    cy += Math.sin(angle) * segLen + Math.sin(angle + Math.PI / 2) * jitter;
    ctx.lineTo(cx, cy);

    // Branch
    if (Math.random() > 0.65 && i > 1) {
      const branchAngle = angle + (Math.random() - 0.5) * 1.2;
      let bx = cx, by = cy;
      ctx.moveTo(bx, by);
      for (let j = 0; j < 3; j++) {
        bx += Math.cos(branchAngle) * segLen * 0.5 + (Math.random() - 0.5) * 8;
        by += Math.sin(branchAngle) * segLen * 0.5 + (Math.random() - 0.5) * 8;
        ctx.lineTo(bx, by);
      }
      ctx.moveTo(cx, cy);
    }
  }
  ctx.stroke();

  // Core glow
  ctx.strokeStyle = core;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function renderCustom(
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number,
  progress: number,
  params: ActionEffect["params"]
) {
  const fade = progress > 0.5 ? 1 - (progress - 0.5) / 0.5 : 1;
  ctx.globalAlpha = fade;

  for (let i = 0; i < params.particleCount; i++) {
    const seed = i * 97.1;
    const angle = params.direction === "upward"
      ? -Math.PI / 2 + (Math.random() - 0.5) * params.spread
      : params.direction === "outward"
        ? (seed / params.particleCount) * Math.PI * 2
        : Math.random() * Math.PI * 2;

    const dist = progress * params.speed * 50 * (0.4 + (seed % 100) / 160);
    const x = fx + Math.cos(angle) * dist;
    const y = fy + Math.sin(angle) * dist;
    const size = (1 - progress * 0.5) * (2 + (seed % 5));

    ctx.fillStyle = i % 3 === 0 ? (params.secondaryColor || params.color) : params.color;

    if (params.shape === "circle") {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
    } else if (params.shape === "star") {
      drawStar(ctx, x, y, size);
    } else if (params.shape === "rect") {
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    } else {
      ctx.strokeStyle = params.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    if (params.label) {
      ctx.font = `bold ${10 + (seed % 6)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(params.label, x, y);
    }
  }
  ctx.globalAlpha = 1;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? "moveTo" : "lineTo";
    ctx[method](x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}
