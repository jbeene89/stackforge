import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Download, X, MousePointerClick,
  Waves, Wind, Sparkles, RotateCcw, Circle,
} from "lucide-react";

type AnimationStyle = "breathe" | "ripple" | "drift" | "pulse" | "swirl";

const ANIMATION_STYLES: { id: AnimationStyle; name: string; icon: any; desc: string }[] = [
  { id: "breathe", name: "Breathe", icon: Wind, desc: "Gentle expand/contract" },
  { id: "ripple", name: "Ripple", icon: Waves, desc: "Water-like waves" },
  { id: "drift", name: "Drift", icon: Sparkles, desc: "Slow floating motion" },
  { id: "pulse", name: "Pulse", icon: Circle, desc: "Rhythmic glow pulse" },
  { id: "swirl", name: "Swirl", icon: RotateCcw, desc: "Subtle spiral motion" },
];

interface FocalPoint {
  x: number; // 0-1 normalized
  y: number;
}

interface ImageAnimatorProps {
  imageSrc: string;
  onClose: () => void;
}

export default function ImageAnimator({ imageSrc, onClose }: ImageAnimatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [focalPoint, setFocalPoint] = useState<FocalPoint | null>(null);
  const [animStyle, setAnimStyle] = useState<AnimationStyle>("breathe");
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [radius, setRadius] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      drawStatic();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    // Draw focal point indicator
    if (focalPoint) {
      const fx = focalPoint.x * canvas.width;
      const fy = focalPoint.y * canvas.height;
      const r = (radius / 100) * Math.min(canvas.width, canvas.height) * 0.4;

      ctx.save();
      ctx.strokeStyle = "rgba(255, 180, 50, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(255, 180, 50, 0.9)";
      ctx.lineWidth = 1.5;
      const cross = 10;
      ctx.beginPath();
      ctx.moveTo(fx - cross, fy);
      ctx.lineTo(fx + cross, fy);
      ctx.moveTo(fx, fy - cross);
      ctx.lineTo(fx, fy + cross);
      ctx.stroke();
      ctx.restore();
    }
  }, [focalPoint, radius]);

  useEffect(() => {
    if (!isPlaying) drawStatic();
  }, [focalPoint, radius, isPlaying, drawStatic]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !focalPoint || !imageLoaded) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    startTimeRef.current = performance.now();

    const fx = focalPoint.x * canvas.width;
    const fy = focalPoint.y * canvas.height;
    const maxR = (radius / 100) * Math.min(canvas.width, canvas.height) * 0.4;
    const amp = (intensity / 100) * 20;
    const spd = (speed / 100) * 0.004 + 0.001;

    const animate = (now: number) => {
      const t = (now - startTimeRef.current) * spd;
      ctx.drawImage(img, 0, 0);

      // Get image data for pixel manipulation in the focal region
      const regionX = Math.max(0, Math.floor(fx - maxR - amp));
      const regionY = Math.max(0, Math.floor(fy - maxR - amp));
      const regionW = Math.min(canvas.width - regionX, Math.ceil((maxR + amp) * 2));
      const regionH = Math.min(canvas.height - regionY, Math.ceil((maxR + amp) * 2));

      if (regionW <= 0 || regionH <= 0) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const imageData = ctx.getImageData(regionX, regionY, regionW, regionH);
      const pixels = imageData.data;
      const origData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Redraw base
      ctx.putImageData(origData, 0, 0);

      // Apply displacement based on animation style
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(img, 0, 0);

      // Clear focal area on main canvas then redraw with displacement
      for (let py = regionY; py < regionY + regionH; py++) {
        for (let px = regionX; px < regionX + regionW; px++) {
          const dx = px - fx;
          const dy = py - fy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxR) continue;

          const falloff = 1 - (dist / maxR);
          const smoothFalloff = falloff * falloff * (3 - 2 * falloff); // smoothstep
          let offsetX = 0;
          let offsetY = 0;

          switch (animStyle) {
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
              offsetX = (dx * cos - dy * sin) - dx;
              offsetY = (dx * sin + dy * cos) - dy;
              offsetX *= amp * 0.05;
              offsetY *= amp * 0.05;
              break;
            }
          }

          const srcX = Math.round(Math.max(0, Math.min(canvas.width - 1, px - offsetX)));
          const srcY = Math.round(Math.max(0, Math.min(canvas.height - 1, py - offsetY)));
          const srcIdx = (srcY * canvas.width + srcX) * 4;
          const dstIdx = (py * canvas.width + px) * 4;
          const src = tempCtx.getImageData(srcX, srcY, 1, 1).data;

          origData.data[dstIdx] = src[0];
          origData.data[dstIdx + 1] = src[1];
          origData.data[dstIdx + 2] = src[2];
          origData.data[dstIdx + 3] = src[3];
        }
      }

      ctx.putImageData(origData, 0, 0);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, focalPoint, animStyle, intensity, speed, radius, imageLoaded]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFocalPoint({ x, y });
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!focalPoint) {
      return;
    }
    setIsPlaying(p => !p);
  };

  const exportAnimation = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !focalPoint) return;

    setIsRecording(true);
    setIsPlaying(true);

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `forge-animate-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };

      recorder.start();
      // Record for 4 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsPlaying(false);
        }
      }, 4000);
    } catch {
      setIsRecording(false);
      setIsPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="border-border/50 overflow-hidden">
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Animate Region</h3>
              <p className="text-[10px] text-muted-foreground">Click on the image to set your animation focal point</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full cursor-crosshair block max-h-[500px] object-contain"
            style={{ imageRendering: "auto" }}
          />

          {/* Click prompt overlay */}
          {!focalPoint && imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-2 text-white"
              >
                <MousePointerClick className="h-8 w-8" />
                <p className="text-sm font-display font-bold">Click to set focal point</p>
                <p className="text-xs opacity-70">The animation will radiate from this point</p>
              </motion.div>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" className="animate-pulse gap-1">
                <div className="w-2 h-2 rounded-full bg-white" />
                Recording...
              </Badge>
            </div>
          )}
        </div>

        {/* Controls */}
        <CardContent className="p-4 space-y-4">
          {/* Animation style picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-display text-muted-foreground uppercase tracking-wider">Motion Style</label>
            <div className="flex gap-1.5 flex-wrap">
              {ANIMATION_STYLES.map(s => {
                const Icon = s.icon;
                const active = animStyle === s.id;
                return (
                  <Button
                    key={s.id}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => { setAnimStyle(s.id); setIsPlaying(false); }}
                    className={`text-xs gap-1.5 h-8 ${active ? "gradient-primary text-primary-foreground" : ""}`}
                  >
                    <Icon className="h-3 w-3" />
                    {s.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Intensity</label>
              <Slider
                value={[intensity]}
                onValueChange={([v]) => setIntensity(v)}
                min={10}
                max={100}
                step={5}
              />
              <p className="text-[10px] text-muted-foreground text-center">{intensity}%</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Speed</label>
              <Slider
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                min={10}
                max={100}
                step={5}
              />
              <p className="text-[10px] text-muted-foreground text-center">{speed}%</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Radius</label>
              <Slider
                value={[radius]}
                onValueChange={([v]) => setRadius(v)}
                min={10}
                max={80}
                step={5}
              />
              <p className="text-[10px] text-muted-foreground text-center">{radius}%</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={togglePlay}
              disabled={!focalPoint}
              variant="outline"
              className="gap-1.5"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Preview"}
            </Button>
            <Button
              onClick={exportAnimation}
              disabled={!focalPoint || isRecording}
              className="gap-1.5 gradient-primary text-primary-foreground"
            >
              <Download className="h-4 w-4" />
              {isRecording ? "Recording 4s..." : "Export .webm"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setFocalPoint(null); setIsPlaying(false); }}
              className="gap-1.5 ml-auto text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Point
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
