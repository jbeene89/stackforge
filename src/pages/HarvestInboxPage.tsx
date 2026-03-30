import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Trash2, Image, ExternalLink, Download, Zap, Brain } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { SEOHead } from "@/components/SEOHead";

interface HarvestCapture {
  id: string;
  imageUrl: string;
  altText: string;
  context: string;
  pageTitle: string;
  pageUrl: string;
  timestamp: string;
}

interface HarvestExport {
  version: string;
  source: string;
  exportedAt: string;
  captureCount: number;
  captures: HarvestCapture[];
}

const PERSPECTIVES = [
  { key: "builder", label: "Builder", icon: "🔨" },
  { key: "empath", label: "Empath", icon: "💜" },
  { key: "systems", label: "Systems", icon: "⚙️" },
  { key: "red_team", label: "Red Team", icon: "🔴" },
  { key: "frame_breaker", label: "Frame Breaker", icon: "💥" },
];

const HarvestInboxPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [captures, setCaptures] = useState<HarvestCapture[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [runPerspectives, setRunPerspectives] = useState(false);
  const [selectedPerspectives, setSelectedPerspectives] = useState<Set<string>>(new Set(["builder", "empath", "systems", "red_team", "frame_breaker"]));
  const [targetDataset, setTargetDataset] = useState<string>("");
  const [fileLoaded, setFileLoaded] = useState(false);

  const { data: datasets } = useSupabaseData("training_datasets");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as HarvestExport;
        if (data.source !== "soupylab-harvester") {
          toast({ title: "Invalid file", description: "This doesn't look like a SoupyLab Harvester export.", variant: "destructive" });
          return;
        }
        setCaptures(data.captures);
        setSelected(new Set(data.captures.map(c => c.id)));
        setFileLoaded(true);
        toast({ title: `Loaded ${data.captures.length} captures`, description: `Exported ${new Date(data.exportedAt).toLocaleDateString()}` });
      } catch {
        toast({ title: "Parse error", description: "Could not parse the JSON file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [toast]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(captures.map(c => c.id)));
  const selectNone = () => setSelected(new Set());

  const togglePerspective = (key: string) => {
    setSelectedPerspectives(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleImport = async () => {
    if (!user || !targetDataset || selected.size === 0) {
      toast({ title: "Missing info", description: "Select a dataset and at least one capture.", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const selectedCaptures = captures.filter(c => selected.has(c.id));
      const samples = selectedCaptures.map(c => ({
        user_id: user.id,
        dataset_id: targetDataset,
        input: c.altText || c.pageTitle || "Untitled image",
        output: c.imageUrl,
        source_url: c.pageUrl,
        status: "pending" as const,
        quality_score: 3,
        builder: "",
        empath: "",
        systems: "",
        red_team: "",
        frame_breaker: "",
        synthesis: "",
      }));

      const { error } = await supabase.from("dataset_samples").insert(samples);
      if (error) throw error;

      toast({
        title: `Imported ${selectedCaptures.length} captures`,
        description: runPerspectives
          ? "Perspective analysis will run on the next pipeline pass."
          : "Captures added to your dataset as raw samples.",
      });

      // Remove imported captures from local state
      setCaptures(prev => prev.filter(c => !selected.has(c.id)));
      setSelected(new Set());

      if (captures.length === selected.size) {
        setFileLoaded(false);
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const removeCapture = (id: string) => {
    setCaptures(prev => prev.filter(c => c.id !== id));
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <SEOHead title="Harvest Inbox — SoupyLab" description="Import captured images from the SoupyLab Harvester Chrome extension into your training datasets." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Harvest Inbox</h1>
          <p className="text-muted-foreground mt-1">
            Import images from the SoupyLab Harvester Chrome extension
          </p>
        </div>
        <a
          href="/soupylab-harvester.zip"
          onClick={(e) => {
            e.preventDefault();
            fetch("/soupylab-harvester.zip")
              .then(r => { if (!r.ok) throw new Error("Download failed"); return r.blob(); })
              .then(b => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(b);
                a.download = "soupylab-harvester.zip";
                a.click();
                URL.revokeObjectURL(a.href);
              })
              .catch(() => toast({ title: "Download failed", variant: "destructive" }));
          }}
        >
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Extension
          </Button>
        </a>
      </div>

      {/* Upload Zone */}
      {!fileLoaded && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop your harvest file here</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Export a JSON file from the Harvester extension popup, then upload it here to review and import into your datasets.
            </p>
            <label>
              <Button asChild variant="default">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>
      )}

      {/* Captures Review */}
      {fileLoaded && captures.length > 0 && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {selected.size} / {captures.length} selected
            </Badge>
            <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="ghost" size="sm" onClick={selectNone}>Select None</Button>
            <div className="flex-1" />
            <label>
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Load Another File
                </span>
              </Button>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {captures.map(c => (
              <Card key={c.id} className={`overflow-hidden transition-all ${selected.has(c.id) ? "ring-2 ring-primary" : "opacity-60"}`}>
                <div className="relative aspect-video bg-muted">
                  <img
                    src={c.imageUrl}
                    alt={c.altText}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute top-2 left-2">
                    <Checkbox
                      checked={selected.has(c.id)}
                      onCheckedChange={() => toggleSelect(c.id)}
                    />
                  </div>
                  <button
                    onClick={() => removeCapture(c.id)}
                    className="absolute top-2 right-2 p-1 rounded-md bg-destructive/80 text-destructive-foreground hover:bg-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs font-medium truncate">{c.altText || "Untitled"}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">{c.pageUrl}</p>
                  </div>
                  {c.context && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.context}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Import Config */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="w-5 h-5" />
                Import Settings
              </CardTitle>
              <CardDescription>Choose a dataset and optional processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Dataset</Label>
                <Select value={targetDataset} onValueChange={setTargetDataset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dataset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(datasets || []).map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!datasets || datasets.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    No datasets found.{" "}
                    <button onClick={() => navigate("/lab")} className="text-primary underline">
                      Create one in the Lab
                    </button>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch checked={runPerspectives} onCheckedChange={setRunPerspectives} id="perspectives" />
                <Label htmlFor="perspectives" className="flex items-center gap-2 cursor-pointer">
                  <Brain className="w-4 h-4 text-primary" />
                  Run Thinktank perspectives on import
                </Label>
              </div>

              {runPerspectives && (
                <div className="flex flex-wrap gap-2 pl-8">
                  {PERSPECTIVES.map(p => (
                    <Badge
                      key={p.key}
                      variant={selectedPerspectives.has(p.key) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePerspective(p.key)}
                    >
                      {p.icon} {p.label}
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={importing || selected.size === 0 || !targetDataset}
                className="w-full mt-4"
                size="lg"
              >
                {importing ? (
                  <>Importing...</>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Import {selected.size} Capture{selected.size !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* How It Works */}
      {!fileLoaded && (
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <Badge variant="outline" className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full">1</Badge>
                <span><strong className="text-foreground">Install the extension</strong> — Download the ZIP, unzip it, and load it unpacked in <code>chrome://extensions</code></span>
              </li>
              <li className="flex gap-3">
                <Badge variant="outline" className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full">2</Badge>
                <span><strong className="text-foreground">Capture images</strong> — Right-click any image → "Harvest for SoupyLab", or enable Harvest Mode for click-to-capture</span>
              </li>
              <li className="flex gap-3">
                <Badge variant="outline" className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full">3</Badge>
                <span><strong className="text-foreground">Export</strong> — Click "Export as JSON" in the extension popup. All data stays on your machine.</span>
              </li>
              <li className="flex gap-3">
                <Badge variant="outline" className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full">4</Badge>
                <span><strong className="text-foreground">Import here</strong> — Upload the JSON, review your captures, pick a dataset, and optionally run Thinktank perspectives</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HarvestInboxPage;
