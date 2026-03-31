import type { AnimationStyle, FocalPoint } from "./types";

/**
 * Renders displacement-based motion effects (breathe, ripple, drift, pulse, swirl).
 * Mutates origData pixels in-place.
 */
export function renderDisplacementMotion(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  origData: ImageData,
  focalPoint: FocalPoint,
  maxR: number,
  amp: number,
  t: number,
  style: AnimationStyle
) {
  const fx = focalPoint.x * canvas.width;
  const fy = focalPoint.y * canvas.height;
  const regionX = Math.max(0, Math.floor(fx - maxR - amp));
  const regionY = Math.max(0, Math.floor(fy - maxR - amp));
  const regionW = Math.min(canvas.width - regionX, Math.ceil((maxR + amp) * 2));
  const regionH = Math.min(canvas.height - regionY, Math.ceil((maxR + amp) * 2));

  if (regionW <= 0 || regionH <= 0) return;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.drawImage(img, 0, 0);

  for (let py = regionY; py < regionY + regionH; py++) {
    for (let px = regionX; px < regionX + regionW; px++) {
      const dx = px - fx;
      const dy = py - fy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxR) continue;

      const falloff = 1 - dist / maxR;
      const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
      let offsetX = 0;
      let offsetY = 0;

      switch (style) {
        case "breathe": {
          const scale = Math.sin(t) * amp * smoothFalloff;
          offsetX = (dx / (dist || 1)) * scale * 0.3;
          offsetY = (dy / (dist || 1)) * scale * 0.3;
          break;
        }
        case "ripple": {
          const wave = Math.sin(dist * 0.05 - t * 3) * amp * smoothFalloff * 0.5;
          offsetX = (dx / (dist || 1)) * wave;
          offsetY = (dy / (dist || 1)) * wave;
          break;
        }
        case "drift": {
          offsetX = Math.sin(t + py * 0.01) * amp * smoothFalloff * 0.4;
          offsetY = Math.cos(t * 0.7 + px * 0.01) * amp * smoothFalloff * 0.3;
          break;
        }
        case "pulse": {
          const p = (Math.sin(t * 2) * 0.5 + 0.5) * amp * smoothFalloff * 0.15;
          offsetX = (dx / (dist || 1)) * p;
          offsetY = (dy / (dist || 1)) * p;
          break;
        }
        case "swirl": {
          const angle = smoothFalloff * Math.sin(t) * 0.3;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          offsetX = (dx * cos - dy * sin - dx) * amp * 0.05;
          offsetY = (dx * sin + dy * cos - dy) * amp * 0.05;
          break;
        }
      }

      const srcX = Math.round(Math.max(0, Math.min(canvas.width - 1, px - offsetX)));
      const srcY = Math.round(Math.max(0, Math.min(canvas.height - 1, py - offsetY)));
      const src = tempCtx.getImageData(srcX, srcY, 1, 1).data;
      const dstIdx = (py * canvas.width + px) * 4;
      origData.data[dstIdx] = src[0];
      origData.data[dstIdx + 1] = src[1];
      origData.data[dstIdx + 2] = src[2];
      origData.data[dstIdx + 3] = src[3];
    }
  }
}

/**
 * Renders overlay-based motion effects (rain, fire, glitch) drawn on top of the image.
 */
export function renderOverlayMotion(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  focalPoint: FocalPoint,
  maxR: number,
  amp: number,
  t: number,
  style: "rain" | "fire" | "glitch"
) {
  const fx = focalPoint.x * canvas.width;
  const fy = focalPoint.y * canvas.height;

  ctx.save();
  // Clip to focal circle
  ctx.beginPath();
  ctx.arc(fx, fy, maxR, 0, Math.PI * 2);
  ctx.clip();

  switch (style) {
    case "rain":
      renderRain(ctx, fx, fy, maxR, amp, t);
      break;
    case "fire":
      renderFire(ctx, fx, fy, maxR, amp, t);
      break;
    case "glitch":
      renderGlitch(ctx, canvas, fx, fy, maxR, amp, t);
      break;
  }
  ctx.restore();
}

function renderRain(
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number,
  maxR: number, amp: number, t: number
) {
  const count = Math.floor(amp * 3);
  ctx.strokeStyle = "rgba(180, 210, 255, 0.35)";
  ctx.lineWidth = 1.5;

  for (let i = 0; i < count; i++) {
    const seed = i * 137.508;
    const rx = Math.sin(seed) * maxR * 0.9;
    const speed = 1.5 + (Math.sin(seed * 2.3) * 0.5 + 0.5) * 2;
    const length = 8 + amp * 0.6;
    const yOff = ((t * speed * 60 + seed * 30) % (maxR * 2)) - maxR;

    const x = fx + rx;
    const y = fy + yOff;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1.5, y + length);
    ctx.stroke();
  }
}

function renderFire(
  ctx: CanvasRenderingContext2D,
  fx: number, fy: number,
  maxR: number, amp: number, t: number
) {
  const count = Math.floor(amp * 2.5);

  for (let i = 0; i < count; i++) {
    const seed = i * 97.135;
    const life = ((t * 1.5 + seed) % 2) / 2; // 0→1 lifecycle
    const rx = Math.sin(seed * 3.7) * maxR * 0.5 * (1 - life * 0.3);
    const ry = -life * maxR * 0.8;
    const size = (1 - life) * (3 + amp * 0.15);
    const alpha = (1 - life) * 0.7;

    const hue = 20 + life * 40;
    ctx.fillStyle = `hsla(${hue}, 100%, ${50 + life * 20}%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(fx + rx + Math.sin(t * 3 + seed) * 3, fy + ry, Math.max(1, size), 0, Math.PI * 2);
    ctx.fill();
  }

  // Core glow
  const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, maxR * 0.3);
  grad.addColorStop(0, `rgba(255, 120, 0, ${0.15 + Math.sin(t * 4) * 0.05})`);
  grad.addColorStop(1, "rgba(255, 60, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(fx - maxR, fy - maxR, maxR * 2, maxR * 2);
}

function renderGlitch(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  fx: number, fy: number,
  maxR: number, amp: number, t: number
) {
  const glitchFrame = Math.floor(t * 8);
  const bands = 4 + Math.floor(amp * 0.1);

  for (let i = 0; i < bands; i++) {
    const seed = (glitchFrame * 31 + i * 71) % 1000;
    if (seed > 600) continue; // Only glitch sometimes

    const bandY = fy - maxR + (i / bands) * maxR * 2;
    const bandH = (maxR * 2) / bands;
    const offsetX = ((seed % 100) - 50) * amp * 0.08;

    // Slice and shift
    try {
      const sliceData = ctx.getImageData(
        Math.max(0, Math.floor(fx - maxR)),
        Math.max(0, Math.floor(bandY)),
        Math.min(canvas.width, Math.ceil(maxR * 2)),
        Math.min(canvas.height - Math.max(0, Math.floor(bandY)), Math.ceil(bandH))
      );
      ctx.putImageData(sliceData, Math.floor(fx - maxR + offsetX), Math.floor(bandY));
    } catch {}

    // RGB split overlay
    if (seed < 200) {
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = `rgba(255, 0, 0, 0.15)`;
      ctx.fillRect(fx - maxR + offsetX + 2, bandY, maxR * 2, bandH);
      ctx.fillStyle = `rgba(0, 255, 255, 0.1)`;
      ctx.fillRect(fx - maxR + offsetX - 2, bandY, maxR * 2, bandH);
      ctx.globalCompositeOperation = "source-over";
    }
  }
}
