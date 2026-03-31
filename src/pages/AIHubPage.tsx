import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadialActionRing, type RadialAction } from "@/components/RadialActionRing";
import {
  Brain, Database, Cpu, Rocket, Wand2, Play, Download,
  Search, Sparkles, BarChart3, Image, Terminal, Layers,
  Wrench, FlaskConical, Send, Eye, Activity, Plus,
} from "lucide-react";
import { useDatasets, useTrainingJobs, type TrainingDataset, type TrainingJob } from "@/hooks/useTrainingData";
import { useProjects, useModules, useStacks } from "@/hooks/useSupabaseData";

// ── Unified AI Entity ────────────────────────────────────────────────────────
interface AIEntity {
  id: string;
  name: string;
  type: "dataset" | "project" | "module" | "stack";
  status: string;
  sampleCount?: number;
  trainingJobs: TrainingJob[];
  datasetId?: string;
  projectId?: string;
  updatedAt: string;
  domain?: string;
  description?: string;
  baseModel?: string;
}

// ── Status Indicators ────────────────────────────────────────────────────────
const statusStyles: Record<string, string> = {
  deployed: "bg-[hsl(var(--forge-emerald))]/15 text-[hsl(var(--forge-emerald))] border-[hsl(var(--forge-emerald))]/30",
  completed: "bg-[hsl(var(--forge-emerald))]/15 text-[hsl(var(--forge-emerald))] border-[hsl(var(--forge-emerald))]/30",
  running: "bg-[hsl(var(--forge-cyan))]/15 text-[hsl(var(--forge-cyan))] border-[hsl(var(--forge-cyan))]/30",
  draft: "bg-muted text-muted-foreground",
  building: "bg-[hsl(var(--forge-amber))]/15 text-[hsl(var(--forge-amber))] border-[hsl(var(--forge-amber))]/30",
};

const typeIcons: Record<string, typeof Brain> = {
  dataset: Database,
  project: Layers,
  module: Brain,
  stack: Layers,
};

export default function AIHubPage() {
  const navigate = useNavigate();
  const { data: datasets } = useDatasets();
  const { data: trainingJobs } = useTrainingJobs();
  const { data: projects } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();

  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<AIEntity | null>(null);

  // Build unified AI entities
  const entities: AIEntity[] = useMemo(() => {
    const result: AIEntity[] = [];
    const jobsByDataset = new Map<string, TrainingJob[]>();
    (trainingJobs || []).forEach((j) => {
      const arr = jobsByDataset.get(j.dataset_id) || [];
      arr.push(j);
      jobsByDataset.set(j.dataset_id, arr);
    });

    // Datasets with their training jobs
    (datasets || []).forEach((d: TrainingDataset) => {
      const jobs = jobsByDataset.get(d.id) || [];
      const latestJob = jobs.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
      const bestStatus = latestJob?.status === "completed" ? "completed" : latestJob?.status === "running" ? "running" : d.status;

      result.push({
        id: d.id,
        name: d.name,
        type: "dataset",
        status: bestStatus,
        sampleCount: d.sample_count,
        trainingJobs: jobs,
        datasetId: d.id,
        updatedAt: d.updated_at,
        domain: d.domain,
        description: d.description,
        baseModel: latestJob?.base_model,
      });
    });

    // Projects
    (projects || []).forEach((p: any) => {
      result.push({
        id: p.id,
        name: p.name,
        type: p.type === "module" ? "module" : p.type === "stack" ? "stack" : "project",
        status: p.status,
        trainingJobs: [],
        projectId: p.id,
        updatedAt: p.updated_at,
        description: p.description,
      });
    });

    // Deduplicate by name (merge datasets + projects with same name)
    const merged = new Map<string, AIEntity>();
    result.forEach((e) => {
      const key = e.name.toLowerCase().trim();
      const existing = merged.get(key);
      if (existing) {
        // Merge: prefer entity with more data
        if (e.sampleCount && !existing.sampleCount) merged.set(key, { ...existing, ...e, trainingJobs: [...existing.trainingJobs, ...e.trainingJobs] });
        else if (!e.sampleCount && existing.sampleCount) merged.set(key, { ...e, ...existing, trainingJobs: [...existing.trainingJobs, ...e.trainingJobs] });
        else merged.set(key + e.id, e);
      } else {
        merged.set(key, e);
      }
    });

    return Array.from(merged.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [datasets, trainingJobs, projects]);

  const filtered = search
    ? entities.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : entities;

  // Build radial actions for selected entity
  const radialActions: RadialAction[] = useMemo(() => {
    if (!selectedEntity) return [];
    const actions: RadialAction[] = [];

    if (selectedEntity.datasetId) {
      actions.push(
        { label: "Train", description: "Fine-tune a model on this dataset using SLM Lab", icon: Cpu, color: "text-[hsl(var(--forge-cyan))]", onClick: () => navigate(`/slm-lab?dataset=${selectedEntity.datasetId}`) },
        { label: "Review Data", description: "Inspect and curate dataset samples for quality", icon: Eye, color: "text-[hsl(var(--forge-amber))]", onClick: () => navigate(`/slm-lab?dataset=${selectedEntity.datasetId}&step=3`) },
        { label: "Export Kit", description: "Package model weights and config for deployment", icon: Download, color: "text-[hsl(var(--forge-emerald))]", onClick: () => navigate(`/slm-lab?dataset=${selectedEntity.datasetId}&step=4`) },
        { label: "Deploy", description: "Push your trained model to a device or cloud endpoint", icon: Rocket, color: "text-primary", onClick: () => navigate(`/deploy?dataset=${selectedEntity.datasetId}`) },
        { label: "Track Progress", description: "Monitor active training runs and metrics", icon: Activity, color: "text-[hsl(var(--forge-cyan))]", onClick: () => navigate("/training") },
      );
    }

    if (selectedEntity.projectId) {
      actions.push(
        { label: "Open Project", description: "View project details, settings, and history", icon: Layers, color: "text-primary", onClick: () => navigate(`/projects/${selectedEntity.projectId}`) },
        { label: "Run", description: "Execute the project pipeline and view results", icon: Play, color: "text-[hsl(var(--forge-emerald))]", onClick: () => navigate("/runs") },
      );
    }

    // Universal actions
    actions.push(
      { label: "Image Forge", description: "Generate and transform images with AI models", icon: Image, color: "text-purple-400", onClick: () => navigate("/image-forge") },
      { label: "Inference", description: "Test prompts against your models in real time", icon: Terminal, color: "text-[hsl(var(--forge-amber))]", onClick: () => navigate("/inference") },
      { label: "Marketplace", description: "Browse and share community templates and models", icon: Sparkles, color: "text-pink-400", onClick: () => navigate("/marketplace") },
    );

    return actions;
  }, [selectedEntity, navigate]);

  // Stats
  const totalEntities = entities.length;
  const trainedCount = entities.filter((e) => e.trainingJobs.some((j) => j.status === "completed")).length;
  const activeCount = entities.filter((e) => e.trainingJobs.some((j) => j.status === "running")).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-[hsl(var(--forge-cyan))]" />
            <h1 className="text-2xl font-bold font-display">AI Hub</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            All your AIs in one place. Click any card to see everything you can do with it.
          </p>
        </div>
        <Button onClick={() => navigate("/build-ai")} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> New AI
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total AIs", value: totalEntities, icon: Brain },
          { label: "Trained", value: trainedCount, icon: Cpu },
          { label: "Active", value: activeCount, icon: Activity },
        ].map((s) => (
          <Card key={s.label} className="bg-card/50">
            <CardContent className="p-3 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-[hsl(var(--forge-cyan))]" />
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your AIs…"
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <Brain className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "No AIs match your search" : "No AIs yet — create your first one!"}
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate("/build-ai")}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create AI
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((entity, i) => {
              const TypeIcon = typeIcons[entity.type] || Brain;
              const completedJobs = entity.trainingJobs.filter((j) => j.status === "completed").length;

              return (
                <motion.div
                  key={entity.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className="cursor-pointer hover:border-[hsl(var(--forge-cyan))]/40 transition-all hover:shadow-lg hover:shadow-[hsl(var(--forge-cyan))]/5 group"
                    onClick={() => setSelectedEntity(entity)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                            <TypeIcon className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{entity.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{entity.type}{entity.domain && entity.domain !== "general" ? ` · ${entity.domain}` : ""}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyles[entity.status] || statusStyles.draft}`}>
                          {entity.status}
                        </Badge>
                      </div>

                      {/* Description */}
                      {entity.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{entity.description}</p>
                      )}

                      {/* Meta chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {entity.sampleCount != null && entity.sampleCount > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Database className="h-2.5 w-2.5 mr-1" />
                            {entity.sampleCount} samples
                          </Badge>
                        )}
                        {completedJobs > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Cpu className="h-2.5 w-2.5 mr-1" />
                            {completedJobs} trained
                          </Badge>
                        )}
                        {entity.baseModel && (
                          <Badge variant="secondary" className="text-[10px]">
                            {entity.baseModel}
                          </Badge>
                        )}
                      </div>

                      {/* Click hint */}
                      <p className="text-[10px] text-muted-foreground/50 text-center pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to open actions
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Radial Action Ring */}
      <RadialActionRing
        actions={radialActions}
        isOpen={!!selectedEntity}
        onClose={() => setSelectedEntity(null)}
      />

      {/* Selected entity name overlay */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div
            className="fixed inset-x-0 bottom-8 z-[72] flex justify-center pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="bg-card/90 backdrop-blur-md border border-border rounded-full px-6 py-2.5 shadow-xl">
              <p className="text-sm font-semibold text-center">{selectedEntity.name}</p>
              <p className="text-[10px] text-muted-foreground text-center">Select an action</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
