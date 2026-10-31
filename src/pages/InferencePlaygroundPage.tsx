import { useState, useRef, useEffect, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Terminal, Send, Trash2, Settings, Zap, Clock, Cpu, RotateCcw, Loader2, ChevronDown, ChevronUp,
  Download, X, Home, MonitorSmartphone, FileBox, Cloud, Upload, Shuffle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { checkWebGPU, resolveBrowserModelId, loadModel, unloadModel, BROWSER_MODELS, getLoadedModelId } from "@/lib/webllm";
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";
import { planRoute, canRunFileInBrowser, ENGINE_LABELS, CLOUD_COST, type EngineKind } from "@/lib/engine/router";
import { runWithFallback, type EngineAdapter, type GenerateStats, type ChatMessage } from "@/lib/engine/run";
import { ollamaAdapter, webgpuAdapter, cloudAdapter } from "@/lib/engine/adapters";
import { loadFileModel, unloadFileModel, generateWithFile, getLoadedFileModel } from "@/lib/engine/fileEngine";
import { parseModelLabel, modelSlug, type SoupyModelLabel } from "@/lib/engine/label";
import { isModelStoreAvailable, listSavedModels, saveModel, readSavedModel, deleteSavedModel, type SavedModel } from "@/lib/engine/modelStore";

interface Message { role: "user" | "assistant"; content: string; engine?: EngineKind }
interface OllamaModel { name: string; size: number }
type Status = "off" | "checking" | "ready" | "error";

const ENGINE_ICONS: Record<EngineKind, React.ElementType> = { ollama: Home, webgpu: MonitorSmartphone, file: FileBox, cloud: Cloud };

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function Dot({ status }: { status: Status }) {
  return <span className={cn("inline-block h-2 w-2 rounded-full shrink-0",
    status === "ready" ? "bg-[hsl(var(--forge-emerald))]" : status === "checking" ? "bg-[hsl(var(--forge-amber))] animate-pulse" : status === "error" ? "bg-destructive" : "bg-muted-foreground/50")} />;
}

function EngineRow({ kind, status, detail, children }: { kind: EngineKind; status: Status; detail: string; children?: React.ReactNode }) {
  const Icon = ENGINE_ICONS[kind];
  return (
    <div className="py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold">{ENGINE_LABELS[kind]}</span>
        <Dot status={status} />
        <span className="text-[11px] text-muted-foreground truncate">{detail}</span>
      </div>
      {children && <div className="pl-6 space-y-2">{children}</div>}
    </div>
  );
}

export default function InferencePlaygroundPage() {
  const { user } = useAuth();

  // Home computer (Ollama)
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem("ollama-url") || "http://localhost:11434");
  const [ollamaStatus, setOllamaStatus] = useState<Status>("off");
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaModel, setOllamaModel] = useState("");

  // Device graphics chip (WebLLM)
  const [gpuSupported, setGpuSupported] = useState<boolean | null>(null);
  const [browserModelId, setBrowserModelId] = useState(resolveBrowserModelId(localStorage.getItem("webllm-model")));
  const [browserEngine, setBrowserEngine] = useState<MLCEngineInterface | null>(null);
  const [gpuProgress, setGpuProgress] = useState<{ text: string; progress: number } | null>(null);

  // Own model file (wllama)
  const [fileModel, setFileModel] = useState<string | null>(getLoadedFileModel());
  const [fileBusy, setFileBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedModel[]>([]);

  // Cloud
  const [offlineOnly, setOfflineOnly] = useState(localStorage.getItem("soupy-offline-only") === "1");

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(localStorage.getItem("ollama-system-prompt") || "");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [streaming, setStreaming] = useState(false);
  const [activeEngine, setActiveEngine] = useState<EngineKind | null>(null);
  const [failed, setFailed] = useState<EngineKind[]>([]);
  const [stats, setStats] = useState<GenerateStats | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ready = {
    ollama: ollamaStatus === "ready" && !!ollamaModel,
    webgpu: !!browserEngine && getLoadedModelId() === browserModelId,
    file: !!fileModel,
  };
  const route = planRoute({ ready, offlineOnly, signedIn: !!user, preferOwnModel: true, failed });
  const next = route[0] ?? null;

  useEffect(() => { localStorage.setItem("ollama-url", ollamaUrl); }, [ollamaUrl]);
  useEffect(() => { localStorage.setItem("ollama-system-prompt", systemPrompt); }, [systemPrompt]);
  useEffect(() => { localStorage.setItem("webllm-model", browserModelId); }, [browserModelId]);
  useEffect(() => { localStorage.setItem("soupy-offline-only", offlineOnly ? "1" : "0"); }, [offlineOnly]);
  useEffect(() => { scrollRef.current?.scrollTo?.({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const refreshSaved = useCallback(() => { listSavedModels().then(setSaved).catch(() => setSaved([])); }, []);

  const checkOllama = useCallback(async (quiet = false) => {
    setOllamaStatus("checking");
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(quiet ? 1500 : 5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const models: OllamaModel[] = (await res.json()).models || [];
      setOllamaModels(models);
      setOllamaModel(m => (m && models.some(x => x.name === m) ? m : models[0]?.name || ""));
      setOllamaStatus("ready");
      setFailed(f => f.filter(e => e !== "ollama"));
      if (!quiet) toast.success(`Home computer found — ${models.length} model${models.length === 1 ? "" : "s"}`);
    } catch {
      setOllamaStatus(quiet ? "off" : "error");
      if (!quiet) toast.error("Can't reach Ollama on your computer. Is it running?");
    }
  }, [ollamaUrl]);

  // Quietly look for every place on open.
  useEffect(() => {
    void checkWebGPU().then(setGpuSupported);
    void checkOllama(true);
    refreshSaved();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGpuModel = async () => {
    setGpuProgress({ text: "Starting…", progress: 0 });
    try {
      const engine = await loadModel(browserModelId, (r: InitProgressReport) => setGpuProgress({ text: r.text, progress: Math.round(r.progress * 100) }));
      setBrowserEngine(engine);
      setFailed(f => f.filter(e => e !== "webgpu"));
      toast.success("Model ready on this device");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load the model");
    } finally { setGpuProgress(null); }
  };

  const unloadGpuModel = async () => { await unloadModel(); setBrowserEngine(null); };

  const startFileModel = async (name: string, parts: File[], label?: SoupyModelLabel | null) => {
    setFileBusy(`Loading ${name}…`);
    try {
      await loadFileModel(name, parts);
      setFileModel(name);
      setFailed(f => f.filter(e => e !== "file"));
      if (label?.systemPrompt && !systemPrompt) setSystemPrompt(label.systemPrompt);
      if (label?.temperature !== undefined) setTemperature(label.temperature);
      toast.success(`${name} is ready`);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open this model file");
      return false;
    } finally { setFileBusy(null); }
  };

  const onPickFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const all = Array.from(list);
    const parts = all.filter(f => f.name.toLowerCase().endsWith(".gguf"));
    const labelFile = all.find(f => f.name.toLowerCase().endsWith(".json"));
    const label = labelFile ? parseModelLabel(await labelFile.text()) : null;
    if (labelFile && !label) toast.warning("That label card wasn't a SoupyLab model label, so it was skipped.");
    if (!parts.length) { toast.error("Pick a .gguf model file."); return; }
    const total = parts.reduce((s, f) => s + f.size, 0);
    const largest = Math.max(...parts.map(f => f.size));
    if (!canRunFileInBrowser(total, largest)) {
      toast.error("This file is too big for the browser. Use the Home computer option with Ollama instead.");
      return;
    }
    const name = label?.name || parts[0].name.replace(/(-\d{5}-of-\d{5})?\.gguf$/i, "");
    const ok = await startFileModel(name, parts, label);
    if (ok && isModelStoreAvailable()) {
      try { await saveModel(modelSlug(name), parts, label ?? undefined); refreshSaved(); toast.success("Saved on this device for next time"); }
      catch { toast.warning("Running now, but this device didn't have room to keep a copy."); }
    }
  };

  const openSaved = async (m: SavedModel) => {
    try { await startFileModel(m.name, await readSavedModel(m), m.label); }
    catch { toast.error("Couldn't open the saved copy. Try loading the file again."); }
  };

  const removeSaved = async (m: SavedModel) => {
    if (fileModel === m.name) { await unloadFileModel(); setFileModel(null); }
    await deleteSavedModel(m.id).catch(() => toast.error("Couldn't remove it"));
    refreshSaved();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming || !next) return;
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput(""); setStreaming(true); setStats(null);
    const controller = new AbortController();
    abortRef.current = controller;

    const chat: ChatMessage[] = [
      ...(systemPrompt.trim() ? [{ role: "system" as const, content: systemPrompt.trim() }] : []),
      ...history.map(m => ({ role: m.role, content: m.content })),
    ];
    const adapters: Partial<Record<EngineKind, EngineAdapter>> = {
      ...(ready.ollama && { ollama: ollamaAdapter(ollamaUrl, ollamaModel) }),
      ...(ready.webgpu && browserEngine && { webgpu: webgpuAdapter(browserEngine) }),
      ...(ready.file && { file: generateWithFile }),
      cloud: cloudAdapter,
    };
    let acc = "";
    let engineNow: EngineKind | undefined;
    const paint = () => setMessages(prev => { const c = [...prev]; c[c.length - 1] = { role: "assistant", content: acc, engine: engineNow }; return c; });

    const result = await runWithFallback(route, adapters, {
      messages: chat, temperature, maxTokens, signal: controller.signal,
      onDelta: t => { acc += t; paint(); },
    }, e => {
      if (e.type === "start") { engineNow = e.engine; setActiveEngine(e.engine); paint(); }
      if (e.type === "switch") {
        acc += `${acc ? "\n\n" : ""}— ${ENGINE_LABELS[e.from]} stopped, continuing on ${ENGINE_LABELS[e.to]} —\n\n`;
        paint();
        toast.info(`Switched to ${ENGINE_LABELS[e.to]}`);
      }
    });

    setFailed(f => Array.from(new Set([...f, ...result.failed])));
    if (result.aborted) toast.info("Stopped");
    else if (!result.engine) { acc += `${acc ? "\n\n" : ""}⚠️ Nowhere could answer. Check the options above.`; paint(); }
    if (result.stats) setStats(result.stats);
    setStreaming(false); setActiveEngine(null); abortRef.current = null;
  };

  const shownEngine = activeEngine ?? next;
  const ShownIcon = shownEngine ? ENGINE_ICONS[shownEngine] : Shuffle;
  const selectedGpuModel = BROWSER_MODELS.find(m => m.model_id === browserModelId);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <SEOHead
        title="Run AI Anywhere — SoupyLab Smart Switch"
        description="Chat with AI on your home computer, right in your browser, or in the cloud. SoupyLab picks the best place automatically and runs your own trained model file."
        ogTitle="Run AI Anywhere — SoupyLab Smart Switch"
        ogDescription="One Run button: home computer, browser, or cloud. Load your own trained model file and run it offline."
        canonicalPath="/inference"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Terminal className="h-7 w-7 text-primary shrink-0" />
        <h1 className="text-3xl font-bold font-display">Local AI</h1>
        <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary" aria-live="polite">
          <ShownIcon className="h-3 w-3" />
          {shownEngine ? `${activeEngine ? "Running on" : "Will run on"}: ${ENGINE_LABELS[shownEngine]}${shownEngine === "cloud" ? ` · ${CLOUD_COST} credit` : ""}` : "Nothing ready yet"}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm flex items-center gap-2"><Shuffle className="h-4 w-4 text-primary" /> Smart Switch</CardTitle>
          <p className="text-xs text-muted-foreground">SoupyLab uses the first ready place below. If one stops mid-answer, it moves to the next.</p>
        </CardHeader>
        <CardContent className="divide-y divide-border/50">
          <EngineRow kind="ollama" status={ollamaStatus === "ready" && !ollamaModel ? "error" : ollamaStatus}
            detail={ollamaStatus === "ready" ? (ollamaModel ? `Ready · ${ollamaModel}` : "No models installed") : ollamaStatus === "checking" ? "Looking…" : "Not found"}>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={ollamaUrl} onChange={e => { setOllamaUrl(e.target.value); setOllamaStatus("off"); }} className="font-mono text-xs h-8 flex-1" aria-label="Ollama address" />
              <Button size="sm" className="h-8 gap-1.5" onClick={() => checkOllama(false)} disabled={ollamaStatus === "checking"}>
                {ollamaStatus === "checking" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Check
              </Button>
            </div>
            {ollamaModels.length > 0 && (
              <Select value={ollamaModel} onValueChange={setOllamaModel} disabled={streaming}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick a model" /></SelectTrigger>
                <SelectContent>
                  {ollamaModels.map(m => <SelectItem key={m.name} value={m.name} className="text-xs">{m.name} · {formatSize(m.size)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </EngineRow>

          <EngineRow kind="webgpu" status={ready.webgpu ? "ready" : gpuProgress ? "checking" : "off"}
            detail={gpuSupported === false ? "Not available on this device" : ready.webgpu ? `Ready · ${selectedGpuModel?.label}` : gpuProgress ? "Loading…" : "Not loaded"}>
            {gpuSupported && (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={browserModelId} onValueChange={setBrowserModelId} disabled={!!gpuProgress || !!browserEngine || streaming}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BROWSER_MODELS.map(m => <SelectItem key={m.model_id} value={m.model_id} className="text-xs">{m.label} · {m.size}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {browserEngine ? (
                    <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={unloadGpuModel} disabled={streaming}><X className="h-3 w-3" /> Unload</Button>
                  ) : (
                    <Button size="sm" className="h-8 gap-1.5" onClick={loadGpuModel} disabled={!!gpuProgress}>
                      {gpuProgress ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Load
                    </Button>
                  )}
                </div>
                {gpuProgress ? (
                  <div className="space-y-1">
                    <Progress value={gpuProgress.progress} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground truncate">{gpuProgress.text}</p>
                  </div>
                ) : !browserEngine && selectedGpuModel && (
                  <p className="text-[10px] text-muted-foreground">One-time download {selectedGpuModel.size}, kept for offline use.</p>
                )}
              </>
            )}
          </EngineRow>

          <EngineRow kind="file" status={fileModel ? "ready" : fileBusy ? "checking" : "off"}
            detail={fileBusy ?? (fileModel ? `Ready · ${fileModel}` : "Runs first when loaded")}>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant={fileModel ? "outline" : "default"} className="h-8 gap-1.5" disabled={!!fileBusy || streaming}>
                <label className={cn("cursor-pointer", (fileBusy || streaming) && "pointer-events-none opacity-50")}>
                  <Upload className="h-3 w-3" /> Load my model file
                  <input type="file" className="hidden" multiple accept=".gguf,.json"
                    onChange={e => { void onPickFiles(e.target.files); e.target.value = ""; }} />
                </label>
              </Button>
              {fileModel && (
                <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={streaming}
                  onClick={async () => { await unloadFileModel(); setFileModel(null); }}><X className="h-3 w-3" /> Unload</Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Pick your .gguf file (and its .soupy.json label card if you have one). Best for models up to about 2B; files over 2 GB need the Home computer option.</p>
            {saved.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Saved on this device</p>
                {saved.map(m => (
                  <div key={m.id} className="flex items-center gap-2 rounded-md border border-border/50 px-2 py-1.5">
                    <FileBox className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs flex-1 truncate">{m.name} · {formatSize(m.bytes)}</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openSaved(m)} disabled={!!fileBusy || streaming || fileModel === m.name}>
                      {fileModel === m.name ? "Running" : "Open"}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSaved(m)} disabled={streaming} aria-label={`Remove ${m.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </EngineRow>

          <EngineRow kind="cloud" status={offlineOnly ? "off" : user ? "ready" : "off"}
            detail={offlineOnly ? "Off — staying offline" : user ? `Backup only · ${CLOUD_COST} credit per reply` : "Sign in to use as backup"}>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch checked={offlineOnly} onCheckedChange={setOfflineOnly} aria-label="Stay offline" />
              Stay offline (never use the cloud)
            </label>
          </EngineRow>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <Card className="flex flex-col min-h-[460px]">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Chat</CardTitle>
              {stats?.tokensPerSecond && (
                <Badge variant="outline" className="text-[9px] gap-1 font-mono"><Zap className="h-2.5 w-2.5" />{stats.tokensPerSecond.toFixed(1)} tok/s</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMessages([]); setStats(null); }} disabled={streaming} aria-label="Clear chat" title="Clear chat">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <ShownIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No messages yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                  {next ? `Type below — it will run on ${ENGINE_LABELS[next]}.` : "Turn on one of the places above to start."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex flex-col gap-1", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn("rounded-xl px-3.5 py-2.5 max-w-[85%] text-sm",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/60 border border-border/40")}>
                      <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed">
                        {msg.content}
                        {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                          <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </pre>
                    </div>
                    {msg.engine && <span className="text-[10px] text-muted-foreground px-1">via {ENGINE_LABELS[msg.engine]}</span>}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="p-3">
            <div className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={next ? "Type a message…" : "Turn on a place above first"} disabled={!next || streaming} className="text-sm h-9" />
              {streaming ? (
                <Button size="sm" variant="destructive" className="h-9 shrink-0" onClick={() => abortRef.current?.abort()}>Stop</Button>
              ) : (
                <Button size="sm" className="h-9 shrink-0" aria-label="Send message" onClick={sendMessage} disabled={!input.trim() || !next}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {stats && (
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                {stats.tokensPerSecond !== undefined && <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{stats.tokensPerSecond.toFixed(1)} tok/s</span>}
                {stats.totalTokens !== undefined && <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{stats.totalTokens} tokens</span>}
                {stats.durationMs !== undefined && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{(stats.durationMs / 1000).toFixed(1)}s</span>}
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <Button variant="ghost" className="h-8 w-full justify-between text-xs px-0" onClick={() => setShowSettings(!showSettings)} aria-expanded={showSettings}>
                <span className="flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" /> Parameters</span>
                {showSettings ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CardHeader>
            {showSettings && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Temperature</span><span className="font-mono font-semibold">{temperature}</span></div>
                  <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={2} step={0.1} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Max Tokens</span><span className="font-mono font-semibold">{maxTokens}</span></div>
                  <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} min={64} max={4096} step={64} />
                </div>
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs">System Prompt</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                placeholder="Filled in automatically from your model's label card" className="text-xs min-h-[80px] resize-y" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
