import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Brain, Plus, Trash2, Globe, Download, Play,
  Star, Check, X, FileText, Sparkles, Database,
  Cpu, RotateCcw, ExternalLink, Code
} from "lucide-react";
import {
  useDatasets, useCreateDataset, useDeleteDataset,
  useSamples, useCreateSample, useUpdateSample, useDeleteSample,
  useScrapeForTraining, useTrainingJobs, useCreateTrainingJob,
  exportDatasetAsJsonl, generateTrainingScript,
  type TrainingDataset, type DatasetSample, type TrainingJob,
} from "@/hooks/useTrainingData";

// ── New Dataset Dialog ──
function NewDatasetDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("general");
  const create = useCreateDataset();

  const handleCreate = () => {
    if (!name.trim()) return;
    create.mutate({ name, domain }, {
      onSuccess: () => { setOpen(false); setName(""); onCreated(); }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> New Dataset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Training Dataset</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="My SLM Dataset" /></div>
          <div>
            <Label>Domain</Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="code">Code / Programming</SelectItem>
                <SelectItem value="science">Science / Research</SelectItem>
                <SelectItem value="support">Customer Support</SelectItem>
                <SelectItem value="creative">Creative Writing</SelectItem>
                <SelectItem value="legal">Legal / Compliance</SelectItem>
                <SelectItem value="medical">Medical / Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={create.isPending || !name.trim()} className="w-full">
            {create.isPending ? "Creating…" : "Create Dataset"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Scrape Panel ──
function ScrapePanel({ dataset }: { dataset: TrainingDataset }) {
  const [url, setUrl] = useState("");
  const scrape = useScrapeForTraining();

  const handleScrape = () => {
    if (!url.trim()) return;
    scrape.mutate({ url, dataset_id: dataset.id, domain_hint: dataset.domain });
    setUrl("");
  };

  return (
    <Card className="border-dashed border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Scrape Training Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Paste a URL and AI will extract instruction/response pairs from the content.
        </p>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://docs.example.com/guide"
            className="flex-1 text-sm"
          />
          <Button onClick={handleScrape} disabled={scrape.isPending || !url.trim()} size="sm">
            {scrape.isPending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          </Button>
        </div>
        {scrape.isPending && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground animate-pulse">Fetching & extracting training pairs…</p>
            <Progress value={45} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Add Manual Sample ──
function AddSamplePanel({ datasetId }: { datasetId: string }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const create = useCreateSample();

  const handleAdd = () => {
    if (!input.trim() || !output.trim()) return;
    create.mutate({ dataset_id: datasetId, input, output, quality_score: 4 }, {
      onSuccess: () => { setInput(""); setOutput(""); }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Manual Sample
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div><Label className="text-xs">Instruction (Input)</Label><Textarea value={input} onChange={e => setInput(e.target.value)} rows={2} className="text-sm" placeholder="What is…" /></div>
        <div><Label className="text-xs">Response (Output)</Label><Textarea value={output} onChange={e => setOutput(e.target.value)} rows={3} className="text-sm" placeholder="The answer is…" /></div>
        <Button onClick={handleAdd} disabled={create.isPending || !input.trim() || !output.trim()} size="sm" className="w-full">Add Sample</Button>
      </CardContent>
    </Card>
  );
}

// ── Sample Row ──
function SampleRow({ sample, datasetId }: { sample: DatasetSample; datasetId: string }) {
  const update = useUpdateSample();
  const remove = useDeleteSample();

  const statusColor = sample.status === "approved" ? "text-forge-emerald" : sample.status === "rejected" ? "text-forge-rose" : "text-muted-foreground";

  return (
    <div className="glass rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary truncate">Q: {sample.input}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">A: {sample.output}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className={`h-3 w-3 cursor-pointer ${n <= sample.quality_score ? "text-forge-amber fill-forge-amber" : "text-muted-foreground/30"}`}
              onClick={() => update.mutate({ id: sample.id, dataset_id: datasetId, quality_score: n })} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {sample.source_url && (
            <a href={sample.source_url} target="_blank" rel="noopener" className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-primary">
              <ExternalLink className="h-3 w-3" /> source
            </a>
          )}
          <span className={`text-[10px] font-medium ${statusColor}`}>{sample.status}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update.mutate({ id: sample.id, dataset_id: datasetId, status: "approved" })}>
            <Check className="h-3 w-3 text-forge-emerald" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update.mutate({ id: sample.id, dataset_id: datasetId, status: "rejected" })}>
            <X className="h-3 w-3 text-forge-rose" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove.mutate({ id: sample.id, dataset_id: datasetId })}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Training Job Creator ──
function NewTrainingJobDialog({ datasets }: { datasets: TrainingDataset[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [baseModel, setBaseModel] = useState("phi-3-mini");
  const [epochs, setEpochs] = useState(3);
  const [lr, setLr] = useState(0.0002);
  const [batchSize, setBatchSize] = useState(4);
  const [loraRank, setLoraRank] = useState(16);
  const create = useCreateTrainingJob();

  const handleCreate = () => {
    if (!name.trim() || !datasetId) return;
    create.mutate({
      dataset_id: datasetId, name, base_model: baseModel, method: "lora",
      hyperparameters: { epochs, learning_rate: lr, batch_size: batchSize, lora_rank: loraRank }
    }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Cpu className="h-4 w-4 mr-1" /> New Training Job</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Configure Training Job</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Job Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="my-slm-v1" className="text-sm" /></div>
          <div>
            <Label className="text-xs">Dataset</Label>
            <Select value={datasetId} onValueChange={setDatasetId}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Select dataset" /></SelectTrigger>
              <SelectContent>{datasets.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.sample_count} samples)</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Base Model</Label>
            <Select value={baseModel} onValueChange={setBaseModel}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phi-3-mini">Phi-3 Mini (3.8B)</SelectItem>
                <SelectItem value="phi-3.5-mini">Phi-3.5 Mini (3.8B)</SelectItem>
                <SelectItem value="llama-3.2-1b">Llama 3.2 (1B)</SelectItem>
                <SelectItem value="llama-3.2-3b">Llama 3.2 (3B)</SelectItem>
                <SelectItem value="mistral-7b">Mistral (7B)</SelectItem>
                <SelectItem value="gemma-2-2b">Gemma 2 (2B)</SelectItem>
                <SelectItem value="qwen2.5-1.5b">Qwen 2.5 (1.5B)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between"><Label className="text-xs">Epochs</Label><span className="text-xs font-mono text-muted-foreground">{epochs}</span></div>
            <Slider value={[epochs]} onValueChange={([v]) => setEpochs(v)} min={1} max={10} step={1} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><Label className="text-xs">Learning Rate</Label><span className="text-xs font-mono text-muted-foreground">{lr}</span></div>
            <Slider value={[lr]} onValueChange={([v]) => setLr(v)} min={0.00001} max={0.001} step={0.00001} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><Label className="text-xs">Batch Size</Label><span className="text-xs font-mono text-muted-foreground">{batchSize}</span></div>
            <Slider value={[batchSize]} onValueChange={([v]) => setBatchSize(v)} min={1} max={16} step={1} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><Label className="text-xs">LoRA Rank</Label><span className="text-xs font-mono text-muted-foreground">{loraRank}</span></div>
            <Slider value={[loraRank]} onValueChange={([v]) => setLoraRank(v)} min={4} max={64} step={4} />
          </div>
          <Button onClick={handleCreate} disabled={create.isPending || !name.trim() || !datasetId} className="w-full gradient-primary text-primary-foreground">
            Create Job & Generate Script
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function SLMLabPage() {
  const { data: datasets, isLoading: dsLoading } = useDatasets();
  const { data: jobs } = useTrainingJobs();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const { data: samples, isLoading: samplesLoading } = useSamples(selectedDatasetId || "");
  const deleteDataset = useDeleteDataset();

  const selectedDataset = datasets?.find(d => d.id === selectedDatasetId);
  const approvedCount = samples?.filter(s => s.status === "approved").length || 0;

  if (dsLoading) return <div className="p-6"><Skeleton className="h-12 w-64 mb-4" /><Skeleton className="h-[500px]" /></div>;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-forge-amber" />
          <h1 className="text-lg font-bold">SLM Lab</h1>
          <Badge variant="outline" className="text-[10px]">Local Training</Badge>
        </div>
        <div className="flex items-center gap-2">
          <NewTrainingJobDialog datasets={datasets || []} />
          <NewDatasetDialog onCreated={() => {}} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Dataset List */}
        <div className="w-72 border-r border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Database className="h-3.5 w-3.5" /> Datasets</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {(!datasets || datasets.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-8">No datasets yet. Create one to start.</p>
              )}
              {datasets?.map(ds => (
                <button
                  key={ds.id}
                  onClick={() => setSelectedDatasetId(ds.id)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${selectedDatasetId === ds.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
                >
                  <p className="text-sm font-medium truncate">{ds.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{ds.domain}</Badge>
                    <span className="text-[10px] text-muted-foreground">{ds.sample_count} samples</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Training Jobs */}
          <div className="border-t border-border">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Cpu className="h-3.5 w-3.5" /> Training Jobs</h2>
            </div>
            <ScrollArea className="max-h-48">
              <div className="p-2 space-y-1">
                {(!jobs || jobs.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">No jobs yet.</p>
                )}
                {jobs?.map(job => {
                  const ds = datasets?.find(d => d.id === job.dataset_id);
                  return (
                    <div key={job.id} className="glass rounded-lg px-3 py-2">
                      <p className="text-xs font-medium truncate">{job.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{job.base_model}</span>
                        <Button
                          variant="ghost" size="icon" className="h-5 w-5"
                          onClick={() => {
                            if (!ds) return;
                            const script = generateTrainingScript(job, ds);
                            const blob = new Blob([script], { type: "text/x-python" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url; a.download = `train-${job.name}.py`; a.click();
                            URL.revokeObjectURL(url);
                            toast.success("Training script downloaded");
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right: Dataset Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedDataset ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <Brain className="h-12 w-12 mx-auto animate-glow-pulse" />
                <p className="text-sm">Select or create a dataset to start building your SLM</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Scrape websites, add manual samples, review quality, then export for local training on your machine.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Dataset Header */}
              <div className="px-6 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">{selectedDataset.name}</h2>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedDataset.sample_count} total · {approvedCount} approved · {selectedDataset.domain}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => samples && exportDatasetAsJsonl(samples, selectedDataset.name)}
                    disabled={approvedCount === 0}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Export JSONL
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { deleteDataset.mutate(selectedDataset.id); setSelectedDatasetId(null); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-forge-rose" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Samples list */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-border">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Training Samples ({samples?.length || 0})
                    </h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                      {samplesLoading && <Skeleton className="h-24" />}
                      {samples?.length === 0 && !samplesLoading && (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No samples yet. Scrape a URL or add manually.
                        </p>
                      )}
                      {samples?.map(s => <SampleRow key={s.id} sample={s} datasetId={selectedDataset.id} />)}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right tools panel */}
                <div className="w-80 border-l border-border overflow-auto">
                  <div className="p-4 space-y-4">
                    <ScrapePanel dataset={selectedDataset} />
                    <AddSamplePanel datasetId={selectedDataset.id} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
