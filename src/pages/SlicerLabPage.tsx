import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { streamAI } from "@/hooks/useSupabaseData";
import {
  Send, RotateCcw, Box, Layers, Thermometer, Gauge,
  Shield, Zap, ChevronDown, AlertTriangle, CheckCircle2, Clock,
  Loader2
} from "lucide-react";

// Simulated slicer output profiles
const slicerProfiles = [
  {
    trigger: "strong",
    config: {
      quality: { layerHeight: 0.2, lineWidth: 0.44, initialLayerHeight: 0.28 },
      shell: { wallCount: 4, topLayers: 5, bottomLayers: 4 },
      infill: { density: 60, pattern: "cubic", gradual: false },
      speed: { printSpeed: 45, wallSpeed: 35, infillSpeed: 55, travelSpeed: 150 },
      temperature: { nozzle: 215, bed: 60, nozzleInitial: 220, bedInitial: 65 },
      support: { enabled: false, type: "normal", angle: 50 },
      adhesion: { type: "brim", brimWidth: 8 },
      cooling: { fanSpeed: 100, minLayerTime: 10, liftHead: true },
    },
    rationale: [
      "Wall count 4 + 60% cubic infill for maximum structural integrity",
      "Slower wall speed (35 mm/s) for better layer adhesion",
      "Higher nozzle temp (215°C) for inter-layer bonding strength",
      "Brim adhesion to prevent warping on large footprint",
    ],
    warnings: [],
  },
  {
    trigger: "fast",
    config: {
      quality: { layerHeight: 0.28, lineWidth: 0.48, initialLayerHeight: 0.32 },
      shell: { wallCount: 2, topLayers: 3, bottomLayers: 3 },
      infill: { density: 15, pattern: "lines", gradual: true },
      speed: { printSpeed: 80, wallSpeed: 60, infillSpeed: 100, travelSpeed: 200 },
      temperature: { nozzle: 210, bed: 55, nozzleInitial: 215, bedInitial: 60 },
      support: { enabled: false, type: "normal", angle: 55 },
      adhesion: { type: "skirt", brimWidth: 0 },
      cooling: { fanSpeed: 100, minLayerTime: 5, liftHead: false },
    },
    rationale: [
      "0.28mm layer height for fewer layers = faster print",
      "Gradual infill reduces material while maintaining top surface",
      "High print speed (80 mm/s) with adequate cooling",
      "Skirt only — minimal adhesion for quick removal",
    ],
    warnings: ["Reduced strength — not for load-bearing parts"],
  },
  {
    trigger: "default",
    config: {
      quality: { layerHeight: 0.16, lineWidth: 0.4, initialLayerHeight: 0.2 },
      shell: { wallCount: 3, topLayers: 4, bottomLayers: 3 },
      infill: { density: 20, pattern: "gyroid", gradual: false },
      speed: { printSpeed: 50, wallSpeed: 40, infillSpeed: 60, travelSpeed: 150 },
      temperature: { nozzle: 200, bed: 60, nozzleInitial: 210, bedInitial: 65 },
      support: { enabled: true, type: "tree", angle: 45 },
      adhesion: { type: "brim", brimWidth: 5 },
      cooling: { fanSpeed: 100, minLayerTime: 8, liftHead: true },
    },
    rationale: [
      "0.16mm layers for good surface finish with reasonable speed",
      "Gyroid infill for balanced strength-to-weight ratio",
      "Tree supports for cleaner removal on organic shapes",
      "Standard PLA temperatures with initial layer boost",
    ],
    warnings: [],
  },
];

const exampleInputs = [
  "I need a strong mounting bracket for a CNC machine. PLA+, needs to handle vibration. 0.4mm nozzle.",
  "Quick prototype of a phone stand, doesn't need to be pretty. Fastest possible print, PLA.",
  "Detailed figurine, 28mm tabletop miniature. Maximum surface quality, I don't care about speed. PLA, 0.2mm nozzle.",
  "Waterproof enclosure for outdoor electronics. PETG, needs to be airtight. Will be exposed to sun and rain.",
];

// Default fallback profile if AI parsing fails
function matchProfile(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("strong") || lower.includes("structural") || lower.includes("bracket") || lower.includes("mount") || lower.includes("load"))
    return slicerProfiles[0];
  if (lower.includes("fast") || lower.includes("quick") || lower.includes("prototype") || lower.includes("draft"))
    return slicerProfiles[1];
  return slicerProfiles[2];
}

function parseAISlicerResponse(raw: string): typeof slicerProfiles[0] | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (parsed.config && parsed.rationale) {
      return {
        trigger: "ai",
        config: {
          quality: parsed.config.quality || slicerProfiles[2].config.quality,
          shell: parsed.config.shell || slicerProfiles[2].config.shell,
          infill: parsed.config.infill || slicerProfiles[2].config.infill,
          speed: parsed.config.speed || slicerProfiles[2].config.speed,
          temperature: parsed.config.temperature || slicerProfiles[2].config.temperature,
          support: parsed.config.support || slicerProfiles[2].config.support,
          adhesion: parsed.config.adhesion || slicerProfiles[2].config.adhesion,
          cooling: parsed.config.cooling || slicerProfiles[2].config.cooling,
        },
        rationale: Array.isArray(parsed.rationale) ? parsed.rationale : [],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

function ParamGroup({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {title}
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">{children}</div>
    </div>
  );
}

function ParamRow({ label, value, unit }: { label: string; value: string | number | boolean; unit?: string }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 transition-colors">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono font-medium text-foreground">
        {typeof value === "boolean" ? (value ? "ON" : "OFF") : value}{unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

export default function SlicerLabPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<typeof slicerProfiles[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState("visual");
  // SLM tuning controls
  const [temperature, setTemperature] = useState(0.15);
  const [deterministic, setDeterministic] = useState(true);

  const runSlice = () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    setResult(null);
    setTimeout(() => {
      setResult(matchProfile(input));
      setIsProcessing(false);
    }, 1800);
  };

  const c = result?.config;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Box className="h-5 w-5 text-forge-cyan" />
          <h1 className="text-lg font-bold">3D Slice Configurator</h1>
          <Badge className="bg-forge-cyan/15 text-forge-cyan border-forge-cyan/30 text-[10px]">SLM</Badge>
          <Badge variant="outline" className="text-[10px]">specialist</Badge>
          <span className="text-xs text-muted-foreground">v4</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Temp</span>
            <span className="font-mono font-medium text-foreground">{temperature}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <span>Deterministic</span>
            <Switch checked={deterministic} onCheckedChange={setDeterministic} className="scale-75" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Input panel */}
        <div className="w-[400px] border-r border-border flex flex-col">
          <div className="p-4 space-y-3 flex-shrink-0">
            <Label className="text-xs font-semibold">Describe your print</Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Strong mounting bracket for a CNC machine, PLA+, 0.4mm nozzle, needs to handle vibration..."
              rows={5}
              className="text-sm"
            />
            <Button
              onClick={runSlice}
              disabled={isProcessing || !input.trim()}
              size="sm"
              className="w-full gradient-primary text-primary-foreground"
            >
              {isProcessing ? (
                <><RotateCcw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating Profile...</>
              ) : (
                <><Send className="h-3.5 w-3.5 mr-1.5" /> Generate Slicer Config</>
              )}
            </Button>
          </div>

          <Separator />

          {/* Example inputs */}
          <div className="p-4 space-y-2 flex-shrink-0">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Example Inputs</Label>
            {exampleInputs.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setInput(ex); setResult(null); }}
                className="w-full text-left text-xs p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors line-clamp-2"
              >
                {ex}
              </button>
            ))}
          </div>

          <Separator />

          {/* SLM tuning */}
          <div className="p-4 space-y-3">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">SLM Tuning</Label>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Temperature</span>
                <span className="text-xs font-mono">{temperature}</span>
              </div>
              <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} max={1} step={0.05} />
            </div>
            <div className="flex items-center justify-between glass rounded-lg px-3 py-2">
              <span className="text-xs">Low Context Window</span>
              <Switch defaultChecked className="scale-75" />
            </div>
            <div className="flex items-center justify-between glass rounded-lg px-3 py-2">
              <span className="text-xs">Concise Output</span>
              <Switch defaultChecked className="scale-75" />
            </div>
          </div>
        </div>

        {/* Right: Output panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {!result && !isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Layers className="h-12 w-12 animate-glow-pulse" />
              <p className="text-sm font-medium">No slicer profile generated yet</p>
              <p className="text-xs">Describe your print or load an example</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <RotateCcw className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">Analyzing print requirements...</p>
              <p className="text-xs">SLM inferring optimal parameters</p>
            </div>
          )}

          {result && c && (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-forge-emerald" />
                  <span className="text-sm font-semibold">Slicer Profile Generated</span>
                  <Badge variant="outline" className="text-[10px]">
                    <Clock className="h-2.5 w-2.5 mr-1" /> 1.8s
                  </Badge>
                </div>
                <Tabs value={activeView} onValueChange={setActiveView}>
                  <TabsList className="glass h-7">
                    <TabsTrigger value="visual" className="text-[10px] h-5 px-2">Visual</TabsTrigger>
                    <TabsTrigger value="json" className="text-[10px] h-5 px-2">JSON</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <ScrollArea className="flex-1">
                {activeView === "visual" ? (
                  <div className="p-4 space-y-4">
                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <div className="space-y-1.5">
                        {result.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 bg-forge-amber/10 border border-forge-amber/20">
                            <AlertTriangle className="h-3.5 w-3.5 text-forge-amber shrink-0 mt-0.5" />
                            <span className="text-xs text-foreground">{w}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rationale */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Rationale</Label>
                      {result.rationale.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <ChevronDown className="h-3 w-3 text-forge-emerald shrink-0 mt-0.5 rotate-[-90deg]" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <ParamGroup title="Quality" icon={Layers}>
                      <ParamRow label="Layer Height" value={c.quality.layerHeight} unit="mm" />
                      <ParamRow label="Line Width" value={c.quality.lineWidth} unit="mm" />
                      <ParamRow label="Initial Layer" value={c.quality.initialLayerHeight} unit="mm" />
                    </ParamGroup>

                    <Separator />

                    <ParamGroup title="Shell" icon={Shield}>
                      <ParamRow label="Wall Count" value={c.shell.wallCount} />
                      <ParamRow label="Top Layers" value={c.shell.topLayers} />
                      <ParamRow label="Bottom Layers" value={c.shell.bottomLayers} />
                    </ParamGroup>

                    <Separator />

                    <ParamGroup title="Infill" icon={Box}>
                      <ParamRow label="Density" value={c.infill.density} unit="%" />
                      <ParamRow label="Pattern" value={c.infill.pattern} />
                      <ParamRow label="Gradual" value={c.infill.gradual} />
                    </ParamGroup>

                    <Separator />

                    <ParamGroup title="Speed" icon={Gauge}>
                      <ParamRow label="Print Speed" value={c.speed.printSpeed} unit="mm/s" />
                      <ParamRow label="Wall Speed" value={c.speed.wallSpeed} unit="mm/s" />
                      <ParamRow label="Infill Speed" value={c.speed.infillSpeed} unit="mm/s" />
                      <ParamRow label="Travel Speed" value={c.speed.travelSpeed} unit="mm/s" />
                    </ParamGroup>

                    <Separator />

                    <ParamGroup title="Temperature" icon={Thermometer}>
                      <ParamRow label="Nozzle" value={c.temperature.nozzle} unit="°C" />
                      <ParamRow label="Bed" value={c.temperature.bed} unit="°C" />
                      <ParamRow label="Nozzle Initial" value={c.temperature.nozzleInitial} unit="°C" />
                      <ParamRow label="Bed Initial" value={c.temperature.bedInitial} unit="°C" />
                    </ParamGroup>

                    <Separator />

                    <ParamGroup title="Support" icon={Layers}>
                      <ParamRow label="Enabled" value={c.support.enabled} />
                      <ParamRow label="Type" value={c.support.type} />
                      <ParamRow label="Overhang Angle" value={c.support.angle} unit="°" />
                    </ParamGroup>

                    <Separator />

                    <ParamGroup title="Adhesion" icon={Zap}>
                      <ParamRow label="Type" value={c.adhesion.type} />
                      <ParamRow label="Brim Width" value={c.adhesion.brimWidth} unit="mm" />
                    </ParamGroup>

                    <Separator />

                    <ParamGroup title="Cooling" icon={Gauge}>
                      <ParamRow label="Fan Speed" value={c.cooling.fanSpeed} unit="%" />
                      <ParamRow label="Min Layer Time" value={c.cooling.minLayerTime} unit="s" />
                      <ParamRow label="Lift Head" value={c.cooling.liftHead} />
                    </ParamGroup>
                  </div>
                ) : (
                  <div className="p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-foreground bg-card rounded-lg p-4 border border-border">
                      {JSON.stringify(c, null, 2)}
                    </pre>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
