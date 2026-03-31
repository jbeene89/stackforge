import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Hammer, Heart, Zap, ShieldAlert, Settings2,
  Loader2, Download, Copy, Image as ImageIcon, Database, Mic, MicOff,
  ChevronDown, ChevronUp, RotateCcw, Save, Users, MessageSquare, Wand2, GalleryHorizontalEnd,
} from "lucide-react";
import VisualChatroom from "@/components/VisualChatroom";
import ImageAnimator from "@/components/ImageAnimator";
import ForgeGallery from "@/components/ForgeGallery";
import { saveToGallery } from "@/lib/forgeGallery";

// ─── The 5 Perspective Characters ───
const CHARACTERS = [
  {
    id: "builder",
    name: "Axiom",
    role: "Builder",
    icon: Hammer,
    color: "hsl(var(--forge-cyan))",
    bgColor: "hsl(var(--forge-cyan) / 0.15)",
    borderColor: "hsl(var(--forge-cyan) / 0.3)",
    desc: "Structure & Composition",
    personality: "Precise, architectural, methodical",
    avatar: "\u2692\uFE0F",
  },
  {
    id: "empath",
    name: "Lyra",
    role: "Empath",
    icon: Heart,
    color: "hsl(var(--forge-rose))",
    bgColor: "hsl(var(--forge-rose) / 0.15)",
    borderColor: "hsl(var(--forge-rose) / 0.3)",
    desc: "Emotion & Atmosphere",
    personality: "Warm, intuitive, expressive",
    avatar: "\uD83C\uDF19",
  },
  {
    id: "frame_breaker",
    name: "Flux",
    role: "Frame Breaker",
    icon: Zap,
    color: "hsl(var(--forge-amber))",
    bgColor: "hsl(var(--forge-amber) / 0.15)",
    borderColor: "hsl(var(--forge-amber) / 0.3)",
    desc: "Creative Disruption",
    personality: "Wild, provocative, genre-bending",
    avatar: "\u26A1",
  },
  {
    id: "red_team",
    name: "Sentinel",
    role: "Red Team",
    icon: ShieldAlert,
    color: "hsl(var(--forge-emerald))",
    bgColor: "hsl(var(--forge-emerald) / 0.15)",
    borderColor: "hsl(var(--forge-emerald) / 0.3)",
    desc: "Quality Assurance",
    personality: "Critical, detail-obsessed, preventive",
    avatar: "\uD83D\uDEE1\uFE0F",
  },
  {
    id: "systems",
    name: "Prism",
    role: "Systems",
    icon: Settings2,
    color: "hsl(var(--forge-violet))",
    bgColor: "hsl(var(--forge-violet) / 0.15)",
    borderColor: "hsl(var(--forge-violet) / 0.3)",
    desc: "Rendering & Style",
    personality: "Technical, cinematic, precise",
    avatar: "\uD83D\uDD2E",
  },
];

const IMAGE_MODELS = [
  { id: "google/gemini-3.1-flash-image-preview", name: "Flash (Fast)", desc: "Quick, pro quality", provider: "gemini" },
  { id: "google/gemini-3-pro-image-preview", name: "Pro (Best)", desc: "Highest quality", provider: "gemini" },
  { id: "sd3-large-turbo", name: "SD3 Turbo", desc: "Fast Stable Diffusion", provider: "stability" },
  { id: "sd3-large", name: "SD3 Large", desc: "Best SD quality", provider: "stability" },
  { id: "stable-image-core", name: "SD Core", desc: "Balanced speed/quality", provider: "stability" },
  { id: "stable-image-ultra", name: "SD Ultra", desc: "Photorealistic", provider: "stability" },
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

type Stage = "idle" | "speaking" | "sketching" | "done";

export default function ImageForgePage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [stage, setStage] = useState<Stage>("idle");
  const [activeSpeaker, setActiveSpeaker] = useState<number>(-1);
  const [spokenResults, setSpokenResults] = useState<PerspectiveResult[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [savingToDataset, setSavingToDataset] = useState(false);
  const [showAnimator, setShowAnimator] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [spokenResults, stage, result]);

  const selectedModelInfo = IMAGE_MODELS.find(m => m.id === imageModel);
  const isStability = selectedModelInfo?.provider === "stability";

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Enter a vision first"); return; }
    setStage("speaking");
    setSpokenResults([]);
    setResult(null);
    setActiveSpeaker(0);

    try {
      // Step 1: Always run the council perspectives (text-based, uses Gemini)
      const { data: perspData, error: perspError } = await supabase.functions.invoke("perspective-image", {
        body: {
          prompt: prompt.trim(),
          selectedPerspectives: CHARACTERS.map(c => c.id),
          imageModel: isStability ? "__skip_image__" : imageModel,
        },
      });

      if (perspError) throw perspError;
      if (perspData?.error) throw new Error(perspData.error);

      const perspectives: PerspectiveResult[] = perspData.perspectives || [];
      for (let i = 0; i < perspectives.length; i++) {
        setActiveSpeaker(i);
        await new Promise(r => setTimeout(r, 800));
        setSpokenResults(prev => [...prev, perspectives[i]]);
        await new Promise(r => setTimeout(r, 400));
      }

      setActiveSpeaker(-1);
      setStage("sketching");
      await new Promise(r => setTimeout(r, 1200));

      let finalImage = perspData.image;
      let synthesizedPrompt = perspData.synthesizedPrompt;

      // Step 2: If Stability model selected, generate image via Stability API
      if (isStability) {
        const { data: sdData, error: sdError } = await supabase.functions.invoke("stability-generate", {
          body: {
            prompt: synthesizedPrompt,
            model: imageModel,
            negative_prompt: "blurry, low quality, distorted, deformed",
          },
        });

        if (sdError) throw sdError;
        if (sdData?.error) throw new Error(sdData.error);
        finalImage = sdData.image;
      }

      setResult({
        image: finalImage,
        synthesizedPrompt,
        perspectives,
      });
      setStage("done");
      toast.success("The council has forged your image!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      setStage("idle");
      setActiveSpeaker(-1);
    }
  };

  const reset = () => {
    setStage("idle");
    setActiveSpeaker(-1);
    setSpokenResults([]);
    setResult(null);
  };

  const saveToDataset = async () => {
    if (!result || !user) return;
    setSavingToDataset(true);
    try {
      // Create or find a dataset for image training data
      const { data: datasets } = await supabase
        .from("training_datasets")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Image Forge Outputs")
        .maybeSingle();

      let datasetId = datasets?.id;
      if (!datasetId) {
        const { data: newDs, error: dsErr } = await supabase
          .from("training_datasets")
          .insert({
            user_id: user.id,
            name: "Image Forge Outputs",
            description: "Multi-perspective image generation data for training",
            domain: "vision",
            format: "instruction",
          })
          .select("id")
          .single();
        if (dsErr) throw dsErr;
        datasetId = newDs.id;
      }

      // Save each perspective as a training sample
      const samples = result.perspectives.map(p => ({
        dataset_id: datasetId!,
        user_id: user.id,
        input: `[Image Prompt] ${prompt}`,
        output: `[${p.name} Perspective] ${p.enhancement}`,
        status: "approved" as const,
        quality_score: 4,
        builder: p.id === "builder" ? p.enhancement : "",
        empath: p.id === "empath" ? p.enhancement : "",
        frame_breaker: p.id === "frame_breaker" ? p.enhancement : "",
        red_team: p.id === "red_team" ? p.enhancement : "",
        systems: p.id === "systems" ? p.enhancement : "",
        synthesis: result.synthesizedPrompt,
      }));

      // Also save the synthesis as its own sample
      samples.push({
        dataset_id: datasetId!,
        user_id: user.id,
        input: `[Multi-Perspective Image Synthesis] ${prompt}\n\nPerspectives:\n${result.perspectives.map(p => `${p.name}: ${p.enhancement}`).join("\n")}`,
        output: result.synthesizedPrompt,
        status: "approved",
        quality_score: 5,
        builder: result.perspectives.find(p => p.id === "builder")?.enhancement || "",
        empath: result.perspectives.find(p => p.id === "empath")?.enhancement || "",
        frame_breaker: result.perspectives.find(p => p.id === "frame_breaker")?.enhancement || "",
        red_team: result.perspectives.find(p => p.id === "red_team")?.enhancement || "",
        systems: result.perspectives.find(p => p.id === "systems")?.enhancement || "",
        synthesis: result.synthesizedPrompt,
      });

      const { error: insertErr } = await supabase.from("dataset_samples").insert(samples as any);
      if (insertErr) throw insertErr;

      // Update sample count
      await supabase.from("training_datasets").update({
        sample_count: samples.length,
        status: "ready",
      } as any).eq("id", datasetId!);

      toast.success(`Saved ${samples.length} training samples to "Image Forge Outputs"`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSavingToDataset(false);
    }
  };

  const downloadImage = () => {
    if (!result?.image) return;
    const link = document.createElement("a");
    link.href = result.image;
    link.download = `forge-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary glow-primary flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          Image Forge
        </h1>
        <p className="text-muted-foreground mt-1">
          Five minds, one vision — council mode or unrestricted visual chatroom.
        </p>
      </div>

      {/* Mode Tabs */}
      <Tabs defaultValue="council" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="council" className="gap-2 font-display text-xs tracking-wider">
            <Users className="h-3.5 w-3.5" />
            Council Mode
          </TabsTrigger>
          <TabsTrigger value="chatroom" className="gap-2 font-display text-xs tracking-wider">
            <MessageSquare className="h-3.5 w-3.5" />
            Free Mode
            <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">NEW</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="council" className="space-y-6 mt-0">

      {/* ─── The Stage: 5 Characters Standing ─── */}
      <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          {/* Character Row */}
          <div className="relative bg-gradient-to-b from-background/80 to-muted/20 border-b border-border/30">
            <div className="flex justify-center items-end gap-1 sm:gap-3 px-4 pt-6 pb-4">
              {CHARACTERS.map((char, i) => {
                const Icon = char.icon;
                const isSpeaking = stage === "speaking" && activeSpeaker === i;
                const hasSpoken = spokenResults.some(r => r.id === char.id);
                const isActive = isSpeaking || hasSpoken;

                return (
                  <motion.div
                    key={char.id}
                    className="flex flex-col items-center gap-1.5"
                    animate={{
                      y: isSpeaking ? -8 : 0,
                      scale: isSpeaking ? 1.1 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Speech indicator */}
                    <AnimatePresence>
                      {isSpeaking && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="flex gap-0.5 mb-1"
                        >
                          {[0, 1, 2].map(j => (
                            <motion.div
                              key={j}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: char.color }}
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: j * 0.15 }}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Avatar */}
                    <div
                      className={`
                        relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl
                        transition-all duration-300 border-2
                        ${isSpeaking ? "shadow-lg" : ""}
                        ${isActive ? "" : "opacity-50 grayscale"}
                      `}
                      style={{
                        backgroundColor: isActive ? char.bgColor : "hsl(var(--muted) / 0.3)",
                        borderColor: isSpeaking ? char.color : isActive ? char.borderColor : "transparent",
                        boxShadow: isSpeaking ? `0 0 20px ${char.color}` : "none",
                      }}
                    >
                      <span className="select-none">{char.avatar}</span>
                      {hasSpoken && !isSpeaking && (
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                          style={{ backgroundColor: char.color, color: "white" }}
                        >
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="text-center">
                      <p className="text-xs font-bold font-display" style={{ color: isActive ? char.color : "hsl(var(--muted-foreground))" }}>
                        {char.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground hidden sm:block">{char.role}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Stage floor gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {/* ─── Conversation Area ─── */}
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 space-y-3">
            {stage === "idle" && spokenResults.length === 0 && !result && (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
                <div className="text-center space-y-2">
                  <p className="text-lg">The council awaits your vision</p>
                  <p className="text-xs">Enter a prompt below and each mind will contribute</p>
                </div>
              </div>
            )}

            {/* Spoken results as chat bubbles */}
            {spokenResults.map((sr, i) => {
              const char = CHARACTERS.find(c => c.id === sr.id)!;
              const Icon = char.icon;
              return (
                <motion.div
                  key={sr.id}
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
                    style={{ backgroundColor: char.bgColor, borderColor: char.borderColor }}
                  >
                    {char.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold font-display" style={{ color: char.color }}>{char.name}</span>
                      <span className="text-[10px] text-muted-foreground">{char.role}</span>
                    </div>
                    <div
                      className="rounded-xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed border"
                      style={{ backgroundColor: char.bgColor, borderColor: char.borderColor }}
                    >
                      {sr.enhancement}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Currently speaking indicator */}
            <AnimatePresence>
              {stage === "speaking" && activeSpeaker >= 0 && activeSpeaker < CHARACTERS.length && !spokenResults.find(r => r.id === CHARACTERS[activeSpeaker].id) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
                    style={{
                      backgroundColor: CHARACTERS[activeSpeaker].bgColor,
                      borderColor: CHARACTERS[activeSpeaker].borderColor,
                    }}
                  >
                    {CHARACTERS[activeSpeaker].avatar}
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2">
                    {[0, 1, 2].map(j => (
                      <motion.div
                        key={j}
                        className="w-2 h-2 rounded-full bg-muted-foreground/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: j * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sketching phase */}
            <AnimatePresence>
              {stage === "sketching" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-6"
                >
                  <div className="text-center space-y-3">
                    <div className="flex justify-center gap-2">
                      {CHARACTERS.map((c, i) => (
                        <motion.div
                          key={c.id}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: c.bgColor }}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        >
                          {c.avatar}
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      The council is sketching your vision...
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final synthesis message */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold font-display text-primary">Synthesis</span>
                    <span className="text-[10px] text-muted-foreground">All 5 minds merged</span>
                  </div>
                  <div className="rounded-xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed bg-primary/10 border border-primary/20">
                    {result.synthesizedPrompt}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* ─── Generated Image ─── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <Card className="border-border/50 overflow-hidden">
              <div className="relative group">
                <img
                  src={result.image}
                  alt="Council-forged image"
                  className="w-full object-contain max-h-[600px] bg-black/5 dark:bg-white/5"
                />
                {/* Overlay actions */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={downloadImage} className="backdrop-blur bg-background/80">
                    <Download className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(result.synthesizedPrompt);
                      toast.success("Prompt copied!");
                    }}
                    className="backdrop-blur bg-background/80"
                  >
                    <Copy className="h-4 w-4 mr-1" /> Prompt
                  </Button>
                </div>

                {/* Badge */}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Badge variant="secondary" className="backdrop-blur bg-background/80 text-xs">
                    {result.perspectives.length} perspectives merged
                  </Badge>
                </div>
              </div>

              {/* Action bar */}
              <div className="p-3 border-t border-border/30 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAnimator(true)}
                  className="text-xs gap-1"
                >
                  <Wand2 className="h-3 w-3" /> Animate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveToDataset}
                  disabled={savingToDataset}
                  className="text-xs"
                >
                  {savingToDataset ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Database className="h-3 w-3 mr-1" />}
                  Save to Training Data
                </Button>
                <Button size="sm" variant="outline" onClick={reset} className="text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" /> New Vision
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs ml-auto"
                >
                  {showDetails ? "Hide" : "Show"} Details
                  {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>

              {/* Expandable details */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-border/30"
                  >
                    <div className="p-4 space-y-3">
                      {result.perspectives.map(p => {
                        const char = CHARACTERS.find(c => c.id === p.id);
                        return (
                          <div key={p.id} className="flex gap-2 items-start">
                            <span className="text-sm">{char?.avatar}</span>
                            <div>
                              <span className="text-xs font-bold" style={{ color: char?.color }}>{char?.name}</span>
                              <p className="text-xs text-muted-foreground">{p.enhancement}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
       </AnimatePresence>

      {/* ─── Image Animator ─── */}
      <AnimatePresence>
        {showAnimator && result?.image && (
          <ImageAnimator
            imageSrc={result.image}
            onClose={() => setShowAnimator(false)}
          />
        )}
      </AnimatePresence>

      {/* ─── Prompt Input (bottom, like a chat input) ─── */}
      {(stage === "idle" || stage === "done") && (
        <Card className="border-border/50 bg-card/80 backdrop-blur sticky bottom-4">
          <CardContent className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Textarea
                  placeholder="Describe your vision... (e.g. 'A lone astronaut discovering ancient ruins on Mars')"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="min-h-[60px] max-h-[120px] text-sm bg-background/60 border-border/40 resize-none"
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      generate();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Select value={imageModel} onValueChange={setImageModel}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Gemini</div>
                    {IMAGE_MODELS.filter(m => m.provider === "gemini").map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="text-xs">{m.name}</span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1 border-t border-border/30 pt-2">Stable Diffusion</div>
                    {IMAGE_MODELS.filter(m => m.provider === "stability").map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="text-xs">{m.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={generate}
                  disabled={stage !== "idle" && stage !== "done" || !prompt.trim()}
                  className="h-8 gradient-primary glow-primary text-primary-foreground font-display text-xs tracking-wider"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Summon Council
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generating state - disabled input */}
      {(stage === "speaking" || stage === "sketching") && (
        <Card className="border-primary/20 bg-primary/5 sticky bottom-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {stage === "speaking" ? (
                <span>
                  {activeSpeaker >= 0 && activeSpeaker < CHARACTERS.length
                    ? `${CHARACTERS[activeSpeaker].name} is sharing their perspective...`
                    : "The council deliberates..."}
                </span>
              ) : (
                <span>Forging image from combined vision...</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="chatroom" className="mt-0">
          <VisualChatroom />
        </TabsContent>
      </Tabs>
    </div>
  );
}
