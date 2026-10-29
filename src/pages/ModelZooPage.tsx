import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Cpu, Eye, ExternalLink, Check, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/SEOHead";
import { LOCAL_MODELS } from "@/lib/localModels";
import { useModelContext } from "@/hooks/useModelContext";
import { toast } from "sonner";

export default function ModelZooPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { selectedBaseModel, setSelectedBaseModel } = useModelContext();
  const models = LOCAL_MODELS.filter(model =>
    (category === "all" || model.kind === category) &&
    `${model.label} ${model.description} ${model.family}`.toLowerCase().includes(search.toLowerCase())
  );
  async function copyCommand(tag: string) {
    try { await navigator.clipboard.writeText(`ollama pull ${tag}`); toast.success("Download command copied"); }
    catch { toast.error("Clipboard unavailable in this browser"); }
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <SEOHead title="Small AI Models" description="Compare compact text and vision models for local inference and SoupyLab training." canonicalPath="/models" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-display font-bold">Model library</h1>
        <Button variant="outline" asChild><Link to="/inference"><Cpu className="mr-2 h-4 w-4" />Local AI<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </header>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search models" placeholder="Search models…" value={search} onChange={event => setSearch(event.target.value)} className="pl-9" />
      </div>
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList><TabsTrigger value="all">All models</TabsTrigger><TabsTrigger value="text">Text</TabsTrigger><TabsTrigger value="vision">Text + vision</TabsTrigger></TabsList>
      </Tabs>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map(model => (
          <article key={model.id} className="border border-border rounded-lg p-4 space-y-4 bg-card">
            <div className="flex items-start gap-3">
              {model.kind === "vision" ? <Eye className="h-5 w-5 text-forge-amber shrink-0 mt-1" /> : <Cpu className="h-5 w-5 text-primary shrink-0 mt-1" />}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{model.label}</h2>
                <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">{model.params}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{model.kind === "vision" ? "Text + images · Ollama" : "Text"}</Badge>
              {model.downloadGB && <span>~{model.downloadGB} GB download</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {model.trainable && <Button size="sm" variant={selectedBaseModel === model.id ? "secondary" : "default"} onClick={() => { setSelectedBaseModel(model.id); toast.success(`${model.label} selected for training`); }}>
                {selectedBaseModel === model.id && <Check className="mr-1.5 h-3.5 w-3.5" />}{selectedBaseModel === model.id ? "Selected" : "Use for training"}
              </Button>}
              <Button variant="outline" size="sm" asChild><a href={`https://huggingface.co/${model.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Model card</a></Button>
              {model.ollama && <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Copy Ollama command for ${model.label}`} title="Copy Ollama download command" onClick={() => { if (model.ollama) void copyCommand(model.ollama); }}><Copy className="h-3.5 w-3.5" /></Button>}
            </div>
          </article>
        ))}
      </div>
      {models.length === 0 && <p className="py-10 text-center text-muted-foreground">No matching models.</p>}
    </div>
  );
}
