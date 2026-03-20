import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Hammer, Heart, Zap, ShieldAlert, Settings2,
  Loader2, Download, Copy, ChevronDown, ChevronUp, Image as ImageIcon,
} from "lucide-react";

const PERSPECTIVES = [
  { id: "builder", name: "Builder", icon: Hammer, color: "hsl(var(--forge-cyan))", desc: "Structural composition & lighting" },
  { id: "empath", name: "Empath", icon: Heart, color: "hsl(var(--forge-rose))", desc: "Emotional atmosphere & mood" },
  { id: "frame_breaker", name: "Frame Breaker", icon: Zap, color: "hsl(var(--forge-amber))", desc: "Creative disruption & surrealism" },
  { id: "red_team", name: "Red Team", icon: ShieldAlert, color: "hsl(var(--forge-emerald))", desc: "Quality assurance & artifact prevention" },
  { id: "systems", name: "Systems", icon: Settings2, color: "hsl(var(--forge-violet))", desc: "Rendering style & technical specs" },
];

const IMAGE_MODELS = [
  { id: "google/gemini-3.1-flash-image-preview", name: "Flash Image (Fast)", desc: "Quick generation, pro quality" },
  { id: "google/gemini-3-pro-image-preview", name: "Pro Image (Best)", desc: "Highest quality, slower" },
];

interface PerspectiveResult {
  id: string;
  name: string;
  enhancement: string;
}

interface GenerationResult {
  image: string;
  synthesizedPrompt: string;
  perspectives: PerspectiveResult[];
}

export default function ImageForgePage() {
  const [prompt, setPrompt] = useState("");
  const [activePerspectives, setActivePerspectives] = useState<string[]>(PERSPECTIVES.map(p => p.id));
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [showPerspectives, setShowPerspectives] = useState(false);
  const [showSynthesis, setShowSynthesis] = useState(false);

  const togglePerspective = (id: string) => {
    setActivePerspectives(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter(p => p !== id);
      }
      return [...prev, id];
    });
  };

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    setIsGenerating(true);
    setResult(null);
    setCurrentStep("Analyzing through " + activePerspectives.length + " perspectives...");

    try {
      const { data, error } = await supabase.functions.invoke("perspective-image", {
        body: { prompt: prompt.trim(), selectedPerspectives: activePerspectives, imageModel },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
      setCurrentStep("");
      toast.success("Image forged through " + (data.perspectives?.length || 0) + " perspectives!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setCurrentStep("");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `forge-${Date.now()}.png`;
    link.click();
  };

  const copyPrompt = () => {
    if (!result?.synthesizedPrompt) return;
    navigator.clipboard.writeText(result.synthesizedPrompt);
    toast.success("Synthesized prompt copied!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary glow-primary flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          Image Forge
        </h1>
        <p className="text-muted-foreground mt-1">
          Multi-perspective AI image generation — every prompt analyzed through {PERSPECTIVES.length} cognitive lenses before synthesis.
        </p>
      </div>

      {/* Prompt Input */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-5 space-y-4">
          <Textarea
            placeholder="Describe what you want to create... (e.g. 'A lone astronaut discovering ancient ruins on Mars')"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="min-h-[100px] text-base bg-background/60 border-border/40 resize-none"
            disabled={isGenerating}
          />

          {/* Perspective Toggles */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Active Perspectives</span>
            <div className="flex flex-wrap gap-2">
              {PERSPECTIVES.map(p => {
                const active = activePerspectives.includes(p.id);
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePerspective(p.id)}
                    disabled={isGenerating}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                      transition-all duration-200 border
                      ${active
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                      }
                    `}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection + Generate */}
          <div className="flex items-center gap-3">
            <Select value={imageModel} onValueChange={setImageModel} disabled={isGenerating}>
              <SelectTrigger className="w-[220px] bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_MODELS.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={generate}
              disabled={isGenerating || !prompt.trim()}
              className="flex-1 h-10 gradient-primary glow-primary text-primary-foreground font-display tracking-wider"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {currentStep || "Forging..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Forge Image
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Animation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-primary/10 animate-ping" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Multi-Perspective Analysis</p>
                    <p className="text-sm text-muted-foreground">{currentStep}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {activePerspectives.map((id, i) => {
                    const p = PERSPECTIVES.find(pp => pp.id === id)!;
                    const Icon = p.icon;
                    return (
                      <motion.div
                        key={id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.15 }}
                        className="h-8 w-8 rounded-lg bg-card border border-border/50 flex items-center justify-center"
                        style={{ color: p.color }}
                      >
                        <Icon className="h-4 w-4 animate-pulse" />
                      </motion.div>
                    );
                  })}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: activePerspectives.length * 0.15 }}
                    className="h-8 px-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-primary font-medium"
                  >
                    → Synthesis → Image
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Generated Image */}
            <Card className="border-border/50 overflow-hidden">
              <div className="relative group">
                <img
                  src={result.image}
                  alt="Generated image"
                  className="w-full object-contain max-h-[600px] bg-black/5 dark:bg-white/5"
                />
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={downloadImage} className="backdrop-blur bg-background/80">
                    <Download className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="secondary" onClick={copyPrompt} className="backdrop-blur bg-background/80">
                    <Copy className="h-4 w-4 mr-1" /> Prompt
                  </Button>
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge variant="secondary" className="backdrop-blur bg-background/80 text-xs">
                    {result.perspectives.length} perspectives merged
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Synthesized Prompt */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <button
                  onClick={() => setShowSynthesis(!showSynthesis)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Synthesized Mega-Prompt</span>
                  </div>
                  {showSynthesis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {showSynthesis && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                        {result.synthesizedPrompt}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Individual Perspectives */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <button
                  onClick={() => setShowPerspectives(!showPerspectives)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-forge-amber" />
                    <span className="font-medium text-sm">Individual Perspective Analyses</span>
                  </div>
                  {showPerspectives ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                  {showPerspectives && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-3">
                        {result.perspectives.map(p => {
                          const meta = PERSPECTIVES.find(pp => pp.id === p.id);
                          const Icon = meta?.icon || Sparkles;
                          return (
                            <div key={p.id} className="bg-muted/30 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className="h-3.5 w-3.5" style={{ color: meta?.color }} />
                                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta?.color }}>
                                  {p.name}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">{p.enhancement}</p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
