import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDatasets } from "@/hooks/useTrainingData";
import { toast } from "sonner";
import {
  onDeviceSLMTemplates,
  categoryLabels,
  categoryDescriptions,
  type OnDeviceSLMTemplate,
} from "@/data/on-device-slm-templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Smartphone,
  HardDrive,
  Cpu,
  Zap,
  ChevronRight,
  Download,
  Layers,
  Star,
  Rocket,
} from "lucide-react";

const difficultyColor: Record<string, string> = {
  beginner: "bg-[hsl(var(--forge-emerald))]/15 text-[hsl(var(--forge-emerald))] border-[hsl(var(--forge-emerald))]/30",
  intermediate: "bg-[hsl(var(--forge-amber))]/15 text-[hsl(var(--forge-amber))] border-[hsl(var(--forge-amber))]/30",
  advanced: "bg-[hsl(var(--forge-rose))]/15 text-[hsl(var(--forge-rose))] border-[hsl(var(--forge-rose))]/30",
};

export default function OnDeviceTemplatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<OnDeviceSLMTemplate | null>(null);
  const { data: datasets } = useDatasets();

  // Find existing dataset matching a template slug
  const getMatchingDatasetId = (template: OnDeviceSLMTemplate): string | null => {
    const match = datasets?.find(
      (d) => d.domain === template.slug || d.name.toLowerCase().includes(template.slug)
    );
    return match?.id ?? null;
  };

  const handleDeployTemplate = (template: OnDeviceSLMTemplate) => {
    const datasetId = getMatchingDatasetId(template);
    if (datasetId) {
      navigate(`/deploy?dataset=${datasetId}`);
    } else {
      toast.error("Create a dataset from this template first, then deploy.");
    }
  };

  const createDataset = useMutation({
    mutationFn: async (template: OnDeviceSLMTemplate) => {
      const { data, error } = await supabase
        .from("training_datasets")
        .insert({
          user_id: user!.id,
          name: `${template.name} — On-Device SLM`,
          description: `${template.longDescription}\n\n---\nSystem Prompt: ${template.systemPrompt}\nTarget: ${template.targetModel} · ${template.estimatedSize}\nRecommended samples: ${template.recommendedSamples}+`,
          domain: template.slug,
          format: "instruction",
          status: "draft",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["training_datasets"] });
      toast.success("Dataset created! Head to SLM Lab to start populating it.");
      setSelected(null);
      navigate("/slm-lab");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const categories = ["perspective", "advanced-tool", "utility"] as const;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-[hsl(var(--forge-cyan))]" />
          <h1 className="text-2xl font-bold font-display">On-Device SLM Templates</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Purpose-built micro-models that live on your phone. Train them offline on your computer,
          upload the GGUF file, and they process your mobile captures locally — no internet needed.
        </p>

        {/* How it works */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          {[
            { icon: Layers, label: "1. Pick Template", desc: "Choose a pipeline function" },
            { icon: Star, label: "2. Build Dataset", desc: "Populate in SLM Lab" },
            { icon: Cpu, label: "3. Train Offline", desc: "Run on your computer" },
            { icon: Smartphone, label: "4. Deploy to Phone", desc: "Upload GGUF, run locally" },
          ].map((step) => (
            <div
              key={step.label}
              className="rounded-lg border border-border/60 bg-card/50 p-3 text-center space-y-1"
            >
              <step.icon className="h-5 w-5 mx-auto text-[hsl(var(--forge-cyan))]" />
              <p className="text-xs font-semibold">{step.label}</p>
              <p className="text-[10px] text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat) => {
        const templates = onDeviceSLMTemplates.filter((t) => t.category === cat);
        return (
          <section key={cat} className="space-y-3">
            <div>
              <h2 className="text-lg font-bold font-display">{categoryLabels[cat]}</h2>
              <p className="text-sm text-muted-foreground">{categoryDescriptions[cat]}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <Card
                  key={t.id}
                  className="group cursor-pointer hover:border-[hsl(var(--forge-cyan))]/40 transition-colors"
                  onClick={() => setSelected(t)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{t.icon}</span>
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {t.name}
                        </CardTitle>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-[hsl(var(--forge-cyan))] transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${difficultyColor[t.difficulty]}`}>
                        {t.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        <HardDrive className="h-2.5 w-2.5 mr-1" />
                        {t.estimatedSize}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {t.recommendedSamples}+ samples
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <p className="text-[10px] text-muted-foreground/70 italic flex-1">
                        📱 {t.onDeviceCapability}
                      </p>
                      {getMatchingDatasetId(t) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] px-2 shrink-0 border-[hsl(var(--forge-cyan))]/40 text-[hsl(var(--forge-cyan))] hover:bg-[hsl(var(--forge-cyan))]/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeployTemplate(t);
                          }}
                        >
                          <Rocket className="h-2.5 w-2.5 mr-1" />
                          Deploy
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

            </div>
          </section>
        );
      })}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">{selected.icon}</span>
                  {selected.name}
                </DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <p className="leading-relaxed text-foreground/80">{selected.longDescription}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Target Model</p>
                    <p className="text-xs font-medium">{selected.targetModel}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Size on Phone</p>
                    <p className="text-xs font-medium">{selected.estimatedSize}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Min Samples</p>
                    <p className="text-xs font-medium">{selected.minSamples}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Recommended</p>
                    <p className="text-xs font-medium">{selected.recommendedSamples}+ samples</p>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">System Prompt (pre-configured)</p>
                  <p className="text-xs text-foreground/80 leading-relaxed font-mono bg-secondary/30 rounded p-2">
                    {selected.systemPrompt}
                  </p>
                </div>

                <div className="rounded-lg border border-[hsl(var(--forge-cyan))]/20 bg-[hsl(var(--forge-cyan))]/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--forge-cyan))] font-semibold mb-1">
                    📱 On-Device Use Case
                  </p>
                  <p className="text-xs">{selected.useCase}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => createDataset.mutate(selected)}
                    disabled={createDataset.isPending}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {createDataset.isPending ? "Creating…" : "Use This Template"}
                  </Button>
                  {getMatchingDatasetId(selected) && (
                    <Button
                      variant="outline"
                      className="border-[hsl(var(--forge-cyan))]/40 text-[hsl(var(--forge-cyan))] hover:bg-[hsl(var(--forge-cyan))]/10"
                      onClick={() => handleDeployTemplate(selected)}
                    >
                      <Rocket className="h-4 w-4 mr-1" />
                      Deploy
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
