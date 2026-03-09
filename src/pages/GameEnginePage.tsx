import { useState, useRef } from "react";
import { ExportToDialog } from "@/components/ExportToDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Gamepad2, Play, Pause, RotateCcw, Plus, Trash2, Eye, EyeOff,
  Move, RotateCw, Maximize2, Box, Layers, Brain, ChevronRight,
  ChevronDown, Settings, Zap, Shield, Crosshair, Sun
} from "lucide-react";

// ── Scene Objects ───────────────────────────────────────────

interface SceneObject {
  id: string;
  name: string;
  type: "cube" | "sphere" | "cylinder" | "plane" | "light" | "camera";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  visible: boolean;
  physics: "none" | "static" | "dynamic" | "kinematic";
  mass: number;
  aiModule: string | null;
}

const defaultScene: SceneObject[] = [
  { id: "obj-1", name: "Ground Plane", type: "plane", position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [20, 1, 20], color: "hsl(var(--muted))", visible: true, physics: "static", mass: 0, aiModule: null },
  { id: "obj-2", name: "Player Cube", type: "cube", position: [0, 0.5, 0], rotation: [0, 45, 0], scale: [1, 1, 1], color: "hsl(var(--primary))", visible: true, physics: "dynamic", mass: 1, aiModule: null },
  { id: "obj-3", name: "Guard NPC", type: "sphere", position: [3, 0.5, 2], rotation: [0, 0, 0], scale: [0.8, 0.8, 0.8], color: "hsl(var(--forge-rose))", visible: true, physics: "kinematic", mass: 1, aiModule: "Patrol AI" },
  { id: "obj-4", name: "Collectible", type: "cylinder", position: [-2, 0.3, -1], rotation: [0, 0, 0], scale: [0.3, 0.6, 0.3], color: "hsl(var(--forge-amber))", visible: true, physics: "static", mass: 0, aiModule: null },
  { id: "obj-5", name: "Sun Light", type: "light", position: [5, 8, 3], rotation: [-45, 30, 0], scale: [1, 1, 1], color: "hsl(38 92% 50%)", visible: true, physics: "none", mass: 0, aiModule: null },
];

const objectTypeIcons: Record<string, typeof Box> = {
  cube: Box, sphere: Crosshair, cylinder: Layers, plane: Maximize2, light: Sun, camera: Eye,
};

const physicsColors: Record<string, string> = {
  none: "text-muted-foreground", static: "text-forge-cyan", dynamic: "text-forge-emerald", kinematic: "text-forge-amber",
};

type TransformMode = "translate" | "rotate" | "scale";

// ── 2D Canvas Renderer ──────────────────────────────────────

function SceneViewport({ objects, selectedId, onSelect, isPlaying }: {
  objects: SceneObject[]; selectedId: string | null; onSelect: (id: string) => void; isPlaying: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple top-down 2D rendering
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const cw = w / 2, ch = h / 2;

    // Background
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--bg") || "#0a0a1a";
    ctx.fillRect(0, 0, cw, ch);

    // Grid
    ctx.strokeStyle = "rgba(128,128,128,0.08)";
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < cw; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
    for (let y = 0; y < ch; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }

    // Axes
    const cx = cw / 2, cy = ch / 2;
    ctx.strokeStyle = "rgba(239,68,68,0.4)"; ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cw, cy); ctx.stroke();
    ctx.strokeStyle = "rgba(34,197,94,0.4)"; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, ch); ctx.stroke();

    // Objects
    const scale = 30;
    objects.filter((o) => o.visible && o.type !== "camera").forEach((obj) => {
      const x = cx + obj.position[0] * scale;
      const y = cy - obj.position[2] * scale;
      const isSelected = obj.id === selectedId;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((obj.rotation[1] * Math.PI) / 180);

      // Selection glow
      if (isSelected) {
        ctx.shadowColor = "hsl(250, 75%, 60%)";
        ctx.shadowBlur = 15;
      }

      // Playing animation
      if (isPlaying && obj.physics === "dynamic") {
        ctx.translate(Math.sin(Date.now() / 300 + obj.position[0]) * 2, 0);
      }
      if (isPlaying && obj.aiModule) {
        const t = Date.now() / 1000;
        ctx.translate(Math.sin(t * 2) * scale * 0.5, Math.cos(t * 2) * scale * 0.5);
      }

      ctx.fillStyle = obj.color;
      ctx.strokeStyle = isSelected ? "hsl(250, 75%, 60%)" : "rgba(255,255,255,0.15)";
      ctx.lineWidth = isSelected ? 2 : 1;

      switch (obj.type) {
        case "cube":
          const s = obj.scale[0] * scale * 0.4;
          ctx.fillRect(-s, -s, s * 2, s * 2);
          ctx.strokeRect(-s, -s, s * 2, s * 2);
          break;
        case "sphere":
          const r = obj.scale[0] * scale * 0.4;
          ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          break;
        case "cylinder":
          const cr = obj.scale[0] * scale * 0.35;
          ctx.beginPath(); ctx.arc(0, 0, cr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, cr * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.stroke();
          break;
        case "plane":
          ctx.globalAlpha = 0.15;
          ctx.fillRect(-obj.scale[0] * scale * 0.4, -obj.scale[2] * scale * 0.4, obj.scale[0] * scale * 0.8, obj.scale[2] * scale * 0.8);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "rgba(128,128,128,0.2)";
          ctx.strokeRect(-obj.scale[0] * scale * 0.4, -obj.scale[2] * scale * 0.4, obj.scale[0] * scale * 0.8, obj.scale[2] * scale * 0.8);
          break;
        case "light":
          ctx.fillStyle = "rgba(255,200,50,0.3)";
          ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(255,200,50,0.8)";
          ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
          break;
      }

      // AI indicator
      if (obj.aiModule) {
        ctx.fillStyle = "hsl(250, 75%, 60%)";
        ctx.beginPath(); ctx.arc(obj.scale[0] * scale * 0.4, -obj.scale[0] * scale * 0.4, 4, 0, Math.PI * 2); ctx.fill();
      }

      // Label
      ctx.fillStyle = isSelected ? "white" : "rgba(255,255,255,0.6)";
      ctx.font = `${isSelected ? "bold " : ""}9px system-ui`;
      ctx.textAlign = "center";
      ctx.fillText(obj.name, 0, obj.scale[0] * scale * 0.4 + 14);

      ctx.restore();
    });
  };

  // Animation loop
  useState(() => {
    let raf: number;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  });

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ ["--bg" as any]: "transparent" }}
      onClick={(e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = rect.width / 2, cy = rect.height / 2;
        const scale = 30;
        let closest: SceneObject | null = null;
        let closestDist = Infinity;
        objects.filter((o) => o.visible && o.type !== "camera").forEach((obj) => {
          const ox = cx + obj.position[0] * scale;
          const oy = cy - obj.position[2] * scale;
          const d = Math.hypot(mx - ox, my - oy);
          if (d < 30 && d < closestDist) { closest = obj; closestDist = d; }
        });
        if (closest) onSelect((closest as SceneObject).id);
      }}
    />
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function GameEnginePage() {
  const [objects, setObjects] = useState<SceneObject[]>(defaultScene);
  const [selectedId, setSelectedId] = useState<string | null>("obj-2");
  const [isPlaying, setIsPlaying] = useState(false);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const [expandedHierarchy, setExpandedHierarchy] = useState(true);

  const selected = objects.find((o) => o.id === selectedId) || null;

  const updateObject = (id: string, updates: Partial<SceneObject>) => {
    setObjects((prev) => prev.map((o) => o.id === id ? { ...o, ...updates } : o));
  };

  const addObject = (type: SceneObject["type"]) => {
    const obj: SceneObject = {
      id: `obj-${Date.now()}`, name: `New ${type}`, type,
      position: [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2],
      rotation: [0, 0, 0], scale: [1, 1, 1],
      color: "hsl(var(--foreground))", visible: true,
      physics: "none", mass: 0, aiModule: null,
    };
    setObjects((prev) => [...prev, obj]);
    setSelectedId(obj.id);
  };

  const deleteObject = (id: string) => {
    setObjects((prev) => prev.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-5 w-5 text-forge-rose" />
          <h1 className="text-lg font-bold">Game Engine</h1>
          <Badge variant="outline" className="text-[10px]">{objects.length} objects</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Transform mode */}
          <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
            {([["translate", Move], ["rotate", RotateCw], ["scale", Maximize2]] as const).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => setTransformMode(mode)}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  transformMode === mode ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-6" />
          <ExportToDialog context="game-engine" projectName="Game Scene" />
          <Button
            variant={isPlaying ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className={cn(!isPlaying && "gradient-primary text-primary-foreground")}
          >
            {isPlaying ? <><Pause className="h-4 w-4 mr-1" /> Stop</> : <><Play className="h-4 w-4 mr-1" /> Play</>}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Hierarchy */}
        <div className="w-56 border-r border-border flex flex-col">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <button
              onClick={() => setExpandedHierarchy(!expandedHierarchy)}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1"
            >
              {expandedHierarchy ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Scene
            </button>
            <Select onValueChange={(v) => addObject(v as SceneObject["type"])}>
              <SelectTrigger className="h-6 w-6 p-0 border-0">
                <Plus className="h-3.5 w-3.5" />
              </SelectTrigger>
              <SelectContent>
                {(["cube", "sphere", "cylinder", "plane", "light"] as const).map((t) => (
                  <SelectItem key={t} value={t} className="capitalize text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1">
            <AnimatePresence>
              {expandedHierarchy && objects.map((obj) => {
                const Icon = objectTypeIcons[obj.type] || Box;
                const isSelected = selectedId === obj.id;
                return (
                  <motion.button
                    key={obj.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedId(obj.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { visible: !obj.visible }); }}
                      className="shrink-0"
                    >
                      {obj.visible ? <Eye className="h-3 w-3 text-muted-foreground" /> : <EyeOff className="h-3 w-3 text-muted-foreground/40" />}
                    </button>
                    <Icon className="h-3 w-3 shrink-0" />
                    <span className={cn("truncate", !obj.visible && "opacity-40")}>{obj.name}</span>
                    {obj.aiModule && <Brain className="h-3 w-3 text-primary shrink-0 ml-auto" />}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </ScrollArea>
        </div>

        {/* Center: Viewport */}
        <div className="flex-1 relative bg-background overflow-hidden">
          <SceneViewport
            objects={objects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isPlaying={isPlaying}
          />

          {/* Playing overlay */}
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-3 left-3 flex items-center gap-2 glass rounded-lg px-3 py-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-forge-emerald animate-glow-pulse" />
              <span className="text-xs font-medium">Simulating</span>
            </motion.div>
          )}

          {/* Viewport info */}
          <div className="absolute bottom-3 left-3 text-[10px] text-muted-foreground/50 font-mono">
            Top-Down View · {objects.filter((o) => o.visible).length} visible
          </div>
        </div>

        {/* Right: Inspector */}
        <div className="w-72 border-l border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="h-3 w-3" /> Inspector
            </h3>
          </div>

          <ScrollArea className="flex-1">
            {selected ? (
              <div className="p-4 space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Name</Label>
                  <Input
                    value={selected.name}
                    onChange={(e) => updateObject(selected.id, { name: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>

                {/* Type */}
                <div className="glass rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Type</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{selected.type}</Badge>
                </div>

                <Separator />

                {/* Transform */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Move className="h-3 w-3" /> Transform
                  </h4>
                  {(["position", "rotation", "scale"] as const).map((prop) => (
                    <div key={prop} className="space-y-1">
                      <Label className="text-[10px] capitalize">{prop}</Label>
                      <div className="grid grid-cols-3 gap-1">
                        {["X", "Y", "Z"].map((axis, i) => (
                          <div key={axis} className="relative">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-mono">{axis}</span>
                            <Input
                              type="number"
                              value={selected[prop][i]}
                              onChange={(e) => {
                                const arr = [...selected[prop]] as [number, number, number];
                                arr[i] = parseFloat(e.target.value) || 0;
                                updateObject(selected.id, { [prop]: arr });
                              }}
                              className="h-6 text-[10px] font-mono pl-5 pr-1"
                              step={prop === "rotation" ? 15 : 0.1}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Physics */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Physics
                  </h4>
                  <Select value={selected.physics} onValueChange={(v) => updateObject(selected.id, { physics: v as SceneObject["physics"] })}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["none", "static", "dynamic", "kinematic"] as const).map((p) => (
                        <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selected.physics === "dynamic" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <Label className="text-[10px]">Mass</Label>
                        <span className="text-[10px] font-mono text-muted-foreground">{selected.mass} kg</span>
                      </div>
                      <Slider
                        value={[selected.mass]}
                        onValueChange={([v]) => updateObject(selected.id, { mass: v })}
                        min={0.1} max={100} step={0.1}
                      />
                    </div>
                  )}
                </div>

                <Separator />

                {/* AI Module */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Brain className="h-3 w-3" /> AI Module
                  </h4>
                  <Select
                    value={selected.aiModule || "none"}
                    onValueChange={(v) => updateObject(selected.id, { aiModule: v === "none" ? null : v })}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">None</SelectItem>
                      <SelectItem value="Patrol AI" className="text-xs">Patrol AI</SelectItem>
                      <SelectItem value="Chase AI" className="text-xs">Chase AI</SelectItem>
                      <SelectItem value="Dialogue AI" className="text-xs">Dialogue AI</SelectItem>
                      <SelectItem value="Loot Generator" className="text-xs">Loot Generator</SelectItem>
                    </SelectContent>
                  </Select>
                  {selected.aiModule && (
                    <div className="glass rounded-lg p-2 text-[10px] text-muted-foreground">
                      <Brain className="h-3 w-3 text-primary inline mr-1" />
                      <span className="font-medium text-foreground">{selected.aiModule}</span> is attached. It will execute during Play mode.
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => {
                    const clone: SceneObject = {
                      ...selected,
                      id: `obj-${Date.now()}`,
                      name: `${selected.name} (Copy)`,
                      position: [selected.position[0] + 1, selected.position[1], selected.position[2]] as [number, number, number],
                    };
                    setObjects((prev) => [...prev, clone]);
                    setSelectedId(clone.id);
                  }}>
                    Duplicate
                  </Button>
                  <Button variant="destructive" size="sm" className="text-[10px] h-7" onClick={() => deleteObject(selected.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Crosshair className="h-8 w-8 mb-3 animate-glow-pulse" />
                <p className="text-xs">Select an object to inspect</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
