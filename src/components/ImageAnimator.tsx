import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Play, Pause, Download, X, MousePointerClick,
  Waves, Wind, Sparkles, RotateCcw, Circle,
  CloudRain, Flame, Zap, Crosshair, DollarSign, Bomb, Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import type { AnimationStyle, FocalPoint, ActionEffect, ActionParams, ActionType } from "./image-animator/types";
import { DEFAULT_ACTION_PARAMS } from "./image-animator/types";
import { renderDisplacementMotion, renderOverlayMotion } from "./image-animator/motionRenderers";
import { renderAction } from "./image-animator/actionRenderers";

const ANIMATION_STYLES: { id: AnimationStyle; name: string; icon: any; desc: string }[] = [
  { id: "breathe", name: "Breathe", icon: Wind, desc: "Gentle expand/contract" },
  { id: "ripple", name: "Ripple", icon: Waves, desc: "Water-like waves" },
  { id: "drift", name: "Drift", icon: Sparkles, desc: "Slow floating motion" },
  { id: "pulse", name: "Pulse", icon: Circle, desc: "Rhythmic glow pulse" },
  { id: "swirl", name: "Swirl", icon: RotateCcw, desc: "Subtle spiral motion" },
  { id: "rain", name: "Rain", icon: CloudRain, desc: "Falling rain streaks" },
  { id: "fire", name: "Fire", icon: Flame, desc: "Rising flame particles" },
  { id: "glitch", name: "Glitch", icon: Zap, desc: "Digital distortion" },
];

const ACTION_PRESETS: { type: Exclude<ActionType, "custom">; name: string; icon: any }[] = [
  { type: "laser", name: "Fire Laser", icon: Crosshair },
  { type: "money", name: "Throw Money", icon: DollarSign },
  { type: "explosion", name: "Explosion", icon: Bomb },
  { type: "lightning", name: "Lightning", icon: Zap },
];

const OVERLAY_STYLES = new Set<AnimationStyle>(["rain", "fire", "glitch"]);

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

  // Action state
  const [activeAction, setActiveAction] = useState<ActionEffect | null>(null);
  const [customActionPrompt, setCustomActionPrompt] = useState("");
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);

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

    const maxR = (radius / 100) * Math.min(canvas.width, canvas.height) * 0.4;
    const amp = (intensity / 100) * 20;
    const spd = (speed / 100) * 0.004 + 0.001;

    const animate = (now: number) => {
      const t = (now - startTimeRef.current) * spd;
      ctx.drawImage(img, 0, 0);

      if (OVERLAY_STYLES.has(animStyle)) {
        renderOverlayMotion(ctx, canvas, focalPoint, maxR, amp, t, animStyle as "rain" | "fire" | "glitch");
      } else {
        const origData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        renderDisplacementMotion(ctx, img, canvas, origData, focalPoint, maxR, amp, t, animStyle);
        ctx.putImageData(origData, 0, 0);
      }

      // Render active action on top
      if (activeAction) {
        const alive = renderAction(ctx, canvas, focalPoint, activeAction, now);
        if (!alive) {
          setActiveAction(null);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, focalPoint, animStyle, intensity, speed, radius, imageLoaded, activeAction]);

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
    if (!focalPoint) return;
    setIsPlaying(p => !p);
  };

  const triggerAction = (type: Exclude<ActionType, "custom">) => {
    if (!focalPoint) {
      toast.error("Set a focal point first by clicking the image");
      return;
    }
    setActiveAction({
      type,
      startTime: performance.now(),
      duration: 2,
      params: DEFAULT_ACTION_PARAMS[type],
    });
    setIsPlaying(true);
  };

  const triggerCustomAction = async () => {
    if (!focalPoint) {
      toast.error("Set a focal point first by clicking the image");
      return;
    }
    if (!customActionPrompt.trim()) return;

    setIsGeneratingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sign in to use AI actions");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            mode: "general",
            messages: [{
              role: "user",
              content: `You are a visual effects parameter generator. Given the user's effect description, return ONLY a JSON object with these fields:
- color: hex color string (primary)
- secondaryColor: hex color string
- particleCount: number 5-60
- speed: number 1-8
- spread: number (radians, e.g. 6.28 for full circle)
- shape: one of "circle", "line", "star", "rect"
- direction: one of "outward", "upward", "random"
- label: optional short emoji or symbol to render on particles

User's effect: "${customActionPrompt}"

Return ONLY valid JSON, no markdown.`,
            }],
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "AI error" }));
        toast.error(err.error || "Failed to generate action");
        return;
      }

      // Read streaming response
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) full += content;
          } catch {}
        }
      }

      // Extract JSON from response
      const jsonMatch = full.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        toast.error("Could not parse AI response");
        return;
      }

      const params: ActionParams = JSON.parse(jsonMatch[0]);
      // Clamp values
      params.particleCount = Math.max(5, Math.min(60, params.particleCount || 20));
      params.speed = Math.max(1, Math.min(8, params.speed || 3));

      setActiveAction({
        type: "custom",
        startTime: performance.now(),
        duration: 2.5,
        params,
      });
      setIsPlaying(true);
      toast.success("AI action generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI action");
    } finally {
      setIsGeneratingAction(false);
    }
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
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full cursor-crosshair block max-h-[500px] object-contain"
            style={{ imageRendering: "auto" }}
          />
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
          {isRecording && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" className="animate-pulse gap-1">
                <div className="w-2 h-2 rounded-full bg-white" />
                Recording...
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Motion Style picker */}
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
                    title={s.desc}
                  >
                    <Icon className="h-3 w-3" />
                    {s.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Actions section */}
          <div className="space-y-2">
            <label className="text-xs font-bold font-display text-muted-foreground uppercase tracking-wider">Actions</label>
            <div className="flex gap-1.5 flex-wrap">
              {ACTION_PRESETS.map(a => {
                const Icon = a.icon;
                return (
                  <Button
                    key={a.type}
                    size="sm"
                    variant="outline"
                    onClick={() => triggerAction(a.type)}
                    disabled={!focalPoint}
                    className="text-xs gap-1.5 h-8 hover:bg-destructive/10 hover:border-destructive/50"
                  >
                    <Icon className="h-3 w-3" />
                    {a.name}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Describe an effect… e.g. 'shoot rainbow beams'"
                value={customActionPrompt}
                onChange={e => setCustomActionPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && triggerCustomAction()}
                className="text-xs h-8"
                disabled={isGeneratingAction}
              />
              <Button
                size="sm"
                onClick={triggerCustomAction}
                disabled={!focalPoint || !customActionPrompt.trim() || isGeneratingAction}
                className="gap-1.5 h-8 text-xs whitespace-nowrap"
              >
                <Wand2 className="h-3 w-3" />
                {isGeneratingAction ? "Generating..." : "AI Action"}
              </Button>
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Intensity</label>
              <Slider value={[intensity]} onValueChange={([v]) => setIntensity(v)} min={10} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground text-center">{intensity}%</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Speed</label>
              <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={10} max={100} step={5} />
              <p className="text-[10px] text-muted-foreground text-center">{speed}%</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Radius</label>
              <Slider value={[radius]} onValueChange={([v]) => setRadius(v)} min={10} max={80} step={5} />
              <p className="text-[10px] text-muted-foreground text-center">{radius}%</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={togglePlay} disabled={!focalPoint} variant="outline" className="gap-1.5">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Preview"}
            </Button>
            <Button onClick={exportAnimation} disabled={!focalPoint || isRecording} className="gap-1.5 gradient-primary text-primary-foreground">
              <Download className="h-4 w-4" />
              {isRecording ? "Recording 4s..." : "Export .webm"}
            </Button>
            <Button variant="ghost" onClick={() => { setFocalPoint(null); setIsPlaying(false); setActiveAction(null); }} className="gap-1.5 ml-auto text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
