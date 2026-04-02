import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, ArrowLeft, Upload,
  Sparkles, CheckCircle2, Brain, Package, Zap
} from "lucide-react";

const PRESET_DATASETS = [
  { id: "customer-support", name: "Customer Support Bot", description: "Train your AI to handle support tickets, FAQs, and customer inquiries with empathy.", icon: "💬", samples: 50 },
  { id: "creative-writing", name: "Creative Writing Assistant", description: "Build an AI that helps with storytelling, copywriting, and content creation.", icon: "✍️", samples: 40 },
  { id: "code-assistant", name: "Code Assistant", description: "Create an AI coding helper that explains, debugs, and writes code snippets.", icon: "💻", samples: 45 },
  { id: "qa-expert", name: "Q&A Expert", description: "Train a knowledgeable AI that answers questions accurately in your domain.", icon: "🎓", samples: 35 },
  { id: "sales-coach", name: "Sales & Outreach Coach", description: "Build an AI that helps craft outreach messages, follow-ups, and sales strategies.", icon: "📈", samples: 30 },
];

interface ExistingDataset {
  id: string;
  name: string;
  sample_count: number;
  domain: string;
  status: string;
}

interface EasyModeWizardProps {
  onCreateDataset: (name: string, domain: string, description: string) => void;
  onStartInterview: () => void;
  onUsePreset: (presetId: string) => void;
  onSwitchToExpert: () => void;
  onSelectExisting?: (id: string) => void;
  existingDatasets?: ExistingDataset[];
}

type WizardStep = "welcome" | "data-choice" | "name-model" | "preset-pick" | "ready";

export function EasyModeWizard({ onCreateDataset, onStartInterview, onUsePreset, onSwitchToExpert, onSelectExisting, existingDatasets }: EasyModeWizardProps) {
  const [wizStep, setWizStep] = useState<WizardStep>("welcome");
  const [dataChoice, setDataChoice] = useState<"own" | "preset" | null>(null);
  const [modelName, setModelName] = useState("");
  const [modelDescription, setModelDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const steps: WizardStep[] = ["welcome", "data-choice", dataChoice === "preset" ? "preset-pick" : "name-model", "ready"];
  const currentIndex = steps.indexOf(wizStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const goNext = () => {
    const idx = steps.indexOf(wizStep);
    if (idx < steps.length - 1) setWizStep(steps[idx + 1]);
  };
  const goBack = () => {
    const idx = steps.indexOf(wizStep);
    if (idx > 0) setWizStep(steps[idx - 1]);
  };

  const handleFinish = () => {
    if (dataChoice === "preset" && selectedPreset) {
      onUsePreset(selectedPreset);
    } else if (dataChoice === "own") {
      onCreateDataset(modelName || "My Model", "general", modelDescription);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-4 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Easy Mode</span>
          </div>
          <Button variant="ghost" size="sm" className="text-[11px] text-muted-foreground" onClick={onSwitchToExpert}>
            Switch to Expert →
          </Button>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={wizStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="max-w-lg w-full"
          >
            {/* STEP: Welcome */}
            {wizStep === "welcome" && (
              <div className="space-y-6 text-center">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Brain className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Let's build your AI model</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We'll walk you through creating your own AI model step by step. 
                  It only takes a few minutes to get started.
                </p>
                <Button size="lg" className="gradient-primary text-primary-foreground" onClick={goNext}>
                  Let's Go <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                {existingDatasets && existingDatasets.length > 0 && onSelectExisting && (
                  <div className="pt-4 space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or continue where you left off</span></div>
                    </div>
                    <div className="grid gap-2 max-w-sm mx-auto text-left">
                      {existingDatasets.slice(0, 3).map(ds => (
                        <button
                          key={ds.id}
                          onClick={() => onSelectExisting(ds.id)}
                          className="rounded-lg px-4 py-2.5 border border-border hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-3 group"
                        >
                          <Package className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ds.name}</p>
                            <p className="text-[10px] text-muted-foreground">{ds.sample_count} samples</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP: Data Choice */}
            {wizStep === "data-choice" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold">Do you have training data?</h2>
                  <p className="text-sm text-muted-foreground">
                    Training data is what teaches your AI how to respond. Don't worry if you don't have any — we've got presets!
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Card
                    className={`cursor-pointer border-2 transition-all ${dataChoice === "own" ? "border-primary bg-primary/5" : "border-transparent hover:border-border"}`}
                    onClick={() => setDataChoice("own")}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Yes, I have my own data</h3>
                        <p className="text-xs text-muted-foreground">Upload conversations, scrape websites, or let us interview you to extract your knowledge.</p>
                      </div>
                      {dataChoice === "own" && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer border-2 transition-all ${dataChoice === "preset" ? "border-forge-emerald bg-forge-emerald/5" : "border-transparent hover:border-border"}`}
                    onClick={() => setDataChoice("preset")}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-forge-emerald/10 flex items-center justify-center shrink-0">
                        <Package className="h-6 w-6 text-forge-emerald" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">No, use a preset dataset</h3>
                        <p className="text-xs text-muted-foreground">Pick from ready-made datasets to see the full training flow in action.</p>
                      </div>
                      {dataChoice === "preset" && <CheckCircle2 className="h-5 w-5 text-forge-emerald shrink-0" />}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={goNext} disabled={!dataChoice} className="gradient-primary text-primary-foreground">
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: Name your model (own data path) */}
            {wizStep === "name-model" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold">Name your model</h2>
                  <p className="text-sm text-muted-foreground">Give it a name so you can find it later. You can always change this.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Model Name</Label>
                    <Input
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="e.g. My Support Bot, Writing Assistant..."
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Description <span className="text-muted-foreground">(optional)</span></Label>
                    <Textarea
                      value={modelDescription}
                      onChange={(e) => setModelDescription(e.target.value)}
                      placeholder="What should this model be good at?"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={goNext} disabled={!modelName.trim()} className="gradient-primary text-primary-foreground">
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: Preset Pick */}
            {wizStep === "preset-pick" && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold">Pick a preset dataset</h2>
                  <p className="text-sm text-muted-foreground">These come pre-loaded with sample training pairs so you can explore the full flow.</p>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {PRESET_DATASETS.map((p) => (
                    <Card
                      key={p.id}
                      className={`cursor-pointer border-2 transition-all ${selectedPreset === p.id ? "border-forge-emerald bg-forge-emerald/5" : "border-transparent hover:border-border"}`}
                      onClick={() => setSelectedPreset(p.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold">{p.name}</h4>
                          <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">{p.samples} pairs</Badge>
                        {selectedPreset === p.id && <CheckCircle2 className="h-4 w-4 text-forge-emerald shrink-0" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button onClick={goNext} disabled={!selectedPreset} className="gradient-primary text-primary-foreground">
                    Continue <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP: Ready */}
            {wizStep === "ready" && (
              <div className="space-y-6 text-center">
                <div className="h-20 w-20 rounded-2xl bg-forge-emerald/10 flex items-center justify-center mx-auto">
                  <Zap className="h-10 w-10 text-forge-emerald" />
                </div>
                <h2 className="text-2xl font-bold">You're all set!</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {dataChoice === "preset"
                    ? `We'll create your "${PRESET_DATASETS.find(p => p.id === selectedPreset)?.name}" dataset and walk you through the next steps.`
                    : `We'll create "${modelName}" and help you add training data — you can scrape websites, upload conversations, or let our AI interview you.`
                  }
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                  <Button size="lg" className="gradient-primary text-primary-foreground" onClick={handleFinish}>
                    Build My Model <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
