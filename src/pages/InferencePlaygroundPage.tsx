import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Terminal,
  Wifi,
  WifiOff,
  Send,
  Trash2,
  Settings,
  Zap,
  Clock,
  Cpu,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Globe,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  isWebGPUAvailable,
  loadModel,
  unloadModel,
  streamBrowserInference,
  BROWSER_MODELS,
  getLoadedModelId,
  type WebLLMModel,
} from "@/lib/webllm";
import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

// ─── Types ──────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface ConnectionState {
  status: "disconnected" | "connecting" | "connected" | "error";
  url: string;
  models: OllamaModel[];
  error?: string;
}

interface InferenceStats {
  tokens_per_second?: number;
  total_tokens?: number;
  eval_duration_ms?: number;
}

type InferenceMode = "ollama" | "browser";

// ─── Helpers ────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function StatusDot({ status }: { status: ConnectionState["status"] | "loading" }) {
  const colors: Record<string, string> = {
    disconnected: "bg-muted-foreground",
    connecting: "bg-[hsl(var(--forge-amber))] animate-pulse",
    connected: "bg-[hsl(var(--forge-emerald))]",
    error: "bg-destructive",
    loading: "bg-[hsl(var(--forge-amber))] animate-pulse",
  };
  return <span className={cn("inline-block h-2 w-2 rounded-full", colors[status])} />;
}

// ─── Main Page ──────────────────────────────────────────────
export default function InferencePlaygroundPage() {
  // Mode
  const [mode, setMode] = useState<InferenceMode>(
    isWebGPUAvailable() ? "browser" : "ollama"
  );
  const webGPUSupported = isWebGPUAvailable();

  // Ollama state
  const [connection, setConnection] = useState<ConnectionState>({
    status: "disconnected",
    url: localStorage.getItem("ollama-url") || "http://localhost:11434",
    models: [],
  });
  const [selectedOllamaModel, setSelectedOllamaModel] = useState("");

  // Browser (WebLLM) state
  const [browserModelId, setBrowserModelId] = useState(
    localStorage.getItem("webllm-model") || BROWSER_MODELS[0].model_id
  );
  const [browserEngine, setBrowserEngine] = useState<MLCEngineInterface | null>(null);
  const [browserLoadProgress, setBrowserLoadProgress] = useState<{ text: string; progress: number } | null>(null);
  const [browserReady, setBrowserReady] = useState(false);

  // Shared state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    localStorage.getItem("ollama-system-prompt") || ""
  );
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [streaming, setStreaming] = useState(false);
  const [stats, setStats] = useState<InferenceStats | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isReady = mode === "ollama" ? connection.status === "connected" : browserReady;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("ollama-url", connection.url);
  }, [connection.url]);
  useEffect(() => {
    localStorage.setItem("ollama-system-prompt", systemPrompt);
  }, [systemPrompt]);
  useEffect(() => {
    localStorage.setItem("webllm-model", browserModelId);
  }, [browserModelId]);

  // ── Ollama Connect ────────────────────────────────────────
  const connectOllama = useCallback(async () => {
    setConnection((c) => ({ ...c, status: "connecting", error: undefined }));
    try {
      const res = await fetch(`${connection.url}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models: OllamaModel[] = data.models || [];
      setConnection((c) => ({ ...c, status: "connected", models }));
      if (models.length > 0 && !selectedOllamaModel) {
        setSelectedOllamaModel(models[0].name);
      }
      toast.success(`Connected — ${models.length} model${models.length !== 1 ? "s" : ""} found`);
    } catch (e: any) {
      const msg =
        e.name === "TimeoutError"
          ? "Connection timed out"
          : e.message?.includes("Failed to fetch")
          ? "Cannot reach Ollama — is it running?"
          : e.message || "Connection failed";
      setConnection((c) => ({ ...c, status: "error", error: msg }));
      toast.error(msg);
    }
  }, [connection.url, selectedOllamaModel]);

  // ── Browser Model Load ────────────────────────────────────
  const loadBrowserModel = useCallback(async () => {
    if (!webGPUSupported) {
      toast.error("Your browser does not support WebGPU");
      return;
    }
    setBrowserReady(false);
    setBrowserLoadProgress({ text: "Initializing...", progress: 0 });

    try {
      const engine = await loadModel(browserModelId, (report: InitProgressReport) => {
        setBrowserLoadProgress({
          text: report.text,
          progress: Math.round(report.progress * 100),
        });
      });
      setBrowserEngine(engine);
      setBrowserReady(true);
      setBrowserLoadProgress(null);
      toast.success("Model loaded — ready for offline inference");
    } catch (e: any) {
      console.error("[WebLLM] Load error:", e);
      setBrowserLoadProgress(null);
      setBrowserReady(false);
      toast.error(e.message || "Failed to load model");
    }
  }, [browserModelId, webGPUSupported]);

  const unloadBrowserModel = useCallback(async () => {
    await unloadModel();
    setBrowserEngine(null);
    setBrowserReady(false);
    toast.info("Model unloaded");
  }, []);

  // ── Send message (unified) ────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming || !isReady) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setStats(null);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      if (mode === "browser" && browserEngine) {
        // ── Browser inference via WebLLM ──
        let accumulated = "";
        await streamBrowserInference(browserEngine, {
          messages: chatMessages,
          temperature,
          max_tokens: maxTokens,
          signal: controller.signal,
          onDelta: (text) => {
            accumulated += text;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: accumulated };
              return copy;
            });
          },
          onStats: (s) => {
            setStats({
              tokens_per_second: s.tokensPerSecond,
              total_tokens: s.totalTokens,
              eval_duration_ms: s.durationMs,
            });
          },
        });
      } else {
        // ── Ollama inference ──
        const res = await fetch(`${connection.url}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: selectedOllamaModel,
            messages: chatMessages,
            stream: true,
            options: { temperature, num_predict: maxTokens },
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                accumulated += json.message.content;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = { role: "assistant", content: accumulated };
                  return copy;
                });
              }
              if (json.done && json.eval_count) {
                setStats({
                  tokens_per_second: json.eval_count / (json.eval_duration / 1e9),
                  total_tokens: json.eval_count,
                  eval_duration_ms: json.eval_duration / 1e6,
                });
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        toast.info("Generation stopped");
      } else {
        toast.error(e.message || "Inference failed");
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ Error: ${e.message}` };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, isReady, mode, browserEngine, connection.url, selectedOllamaModel, systemPrompt, temperature, maxTokens]);

  const stopGeneration = () => abortRef.current?.abort();
  const clearChat = () => { setMessages([]); setStats(null); };

  const selectedBrowserModel = BROWSER_MODELS.find((m) => m.model_id === browserModelId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero — landing-ready context for cold visitors */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-7 w-7 text-[hsl(var(--forge-cyan))]" />
            <h1 className="text-3xl font-bold font-display tracking-tight">Run AI Models in Your Browser</h1>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            No servers. No API keys. No data leaves your device.{" "}
            <span className="text-foreground font-medium">Load an open-source model directly in your browser</span>{" "}
            and chat with it — even offline. Powered by WebGPU, everything runs 100% on your hardware.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--forge-emerald))]/10 text-[hsl(var(--forge-emerald))] px-2.5 py-1 font-medium">
            <WifiOff className="h-3 w-3" /> Works offline
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--forge-cyan))]/10 text-[hsl(var(--forge-cyan))] px-2.5 py-1 font-medium">
            <Cpu className="h-3 w-3" /> On-device inference
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--forge-amber))]/10 text-[hsl(var(--forge-amber))] px-2.5 py-1 font-medium">
            <Zap className="h-3 w-3" /> 7 models, 360M–3.5B
          </span>
        </div>
      </div>

      {/* Mode Selector */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as InferenceMode)} className="w-full">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="browser" className="gap-1.5 text-xs">
            <Globe className="h-3 w-3" />
            Browser (WebGPU)
          </TabsTrigger>
          <TabsTrigger value="ollama" className="gap-1.5 text-xs">
            <Smartphone className="h-3 w-3" />
            Ollama (LAN)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* WebGPU not supported banner */}
      {mode === "browser" && !webGPUSupported && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              WebGPU is not available in your browser
            </div>
            <p className="text-xs text-muted-foreground">
              Browser-based inference requires WebGPU, which is supported in <strong>Chrome 113+</strong>, <strong>Edge 113+</strong>, and <strong>Opera 99+</strong>.
              Firefox and Safari don't fully support it yet.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setMode("ollama")}>
                <Smartphone className="h-3 w-3" /> Switch to Ollama mode
              </Button>
              <span className="text-[10px] text-muted-foreground">— works with any browser via local server</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection / Model Loading Bar */}
      {mode === "ollama" ? (
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <StatusDot status={connection.status} />
                <span className="text-xs font-semibold capitalize">{connection.status}</span>
              </div>
              <Input
                value={connection.url}
                onChange={(e) =>
                  setConnection((c) => ({ ...c, url: e.target.value, status: "disconnected" }))
                }
                placeholder="http://localhost:11434"
                className="font-mono text-xs h-8 flex-1"
              />
              <Button
                size="sm"
                className="h-8 gap-1.5 shrink-0"
                onClick={connectOllama}
                disabled={connection.status === "connecting"}
              >
                {connection.status === "connecting" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : connection.status === "connected" ? (
                  <RotateCcw className="h-3 w-3" />
                ) : (
                  <Wifi className="h-3 w-3" />
                )}
                {connection.status === "connected" ? "Refresh" : "Connect"}
              </Button>
            </div>
            {connection.error && (
              <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" />
                <span>{connection.error}</span>
              </div>
            )}
            {connection.status === "disconnected" && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                💡 Run <code className="px-1 py-0.5 rounded bg-secondary text-foreground/70">ollama serve</code> on
                your phone (via Termux) or PC, then enter the IP address above.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-3 space-y-3">
            {!webGPUSupported ? null : (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusDot status={browserReady ? "connected" : browserLoadProgress ? "loading" : "disconnected"} />
                    <span className="text-xs font-semibold">
                      {browserReady ? "Ready" : browserLoadProgress ? "Loading…" : "Not loaded"}
                    </span>
                  </div>
                  <Select value={browserModelId} onValueChange={setBrowserModelId} disabled={!!browserLoadProgress}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BROWSER_MODELS.map((m) => (
                        <SelectItem key={m.model_id} value={m.model_id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{m.label}</span>
                            <Badge variant="outline" className="text-[8px] h-3.5">{m.size}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {browserReady ? (
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 shrink-0" onClick={unloadBrowserModel}>
                      <X className="h-3 w-3" /> Unload
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 shrink-0"
                      onClick={loadBrowserModel}
                      disabled={!!browserLoadProgress}
                    >
                      {browserLoadProgress ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      {browserLoadProgress ? "Loading…" : "Load Model"}
                    </Button>
                  )}
                </div>

                {/* Pre-download warning */}
                {!browserReady && !browserLoadProgress && selectedBrowserModel && (
                  <div className="rounded-lg border border-[hsl(var(--forge-amber))]/20 bg-[hsl(var(--forge-amber))]/5 p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--forge-amber))]">
                      <Download className="h-3.5 w-3.5" />
                      One-time download: {selectedBrowserModel.size}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      This model downloads <strong>{selectedBrowserModel.size}</strong> once and is permanently cached in your browser.
                      After loading, it runs <strong>100% offline forever</strong> — no server, no internet, no data leaves your device.
                      Requires a GPU with ~{selectedBrowserModel.vram} VRAM.
                    </p>
                  </div>
                )}

                {browserLoadProgress && (
                  <div className="space-y-1.5">
                    <Progress
                      value={browserLoadProgress.progress}
                      className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(var(--forge-cyan))] [&>div]:to-[hsl(var(--forge-emerald))]"
                    />
                    <p className="text-[10px] text-muted-foreground truncate">
                      {browserLoadProgress.text}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Chat area */}
        <Card className="flex flex-col min-h-[500px]">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Chat</CardTitle>
              {stats && (
                <Badge variant="outline" className="text-[9px] gap-1 font-mono">
                  <Zap className="h-2.5 w-2.5" />
                  {stats.tokens_per_second?.toFixed(1)} tok/s
                </Badge>
              )}
              {mode === "browser" && browserReady && (
                <Badge variant="outline" className="text-[9px] gap-1 border-[hsl(var(--forge-emerald))]/30 text-[hsl(var(--forge-emerald))]">
                  <WifiOff className="h-2.5 w-2.5" />
                  Offline
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                {mode === "browser" ? (
                  <Globe className="h-10 w-10 text-muted-foreground/30 mb-3" />
                ) : (
                  <Smartphone className="h-10 w-10 text-muted-foreground/30 mb-3" />
                )}
                <p className="text-sm text-muted-foreground font-medium">No messages yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                  {isReady
                    ? "Type a message below to start chatting with your SLM"
                    : mode === "browser"
                    ? "Load a model above to begin offline inference"
                    : "Connect to an Ollama instance above to begin"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 max-w-[85%] text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/60 border border-border/40"
                      )}
                    >
                      <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                        {msg.content}
                        {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                          <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder={isReady ? "Type a message…" : mode === "browser" ? "Load a model first" : "Connect to Ollama first"}
                disabled={!isReady}
                className="text-sm h-9"
              />
              {streaming ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-9 gap-1 shrink-0"
                  onClick={stopGeneration}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-9 gap-1 shrink-0"
                  onClick={sendMessage}
                  disabled={!input.trim() || !isReady}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {stats && (
              <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {stats.tokens_per_second?.toFixed(1)} tok/s
                </span>
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  {stats.total_tokens} tokens
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {((stats.eval_duration_ms || 0) / 1000).toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Settings panel */}
        <div className="space-y-4">
          {/* Model selector — Ollama only */}
          {mode === "ollama" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" /> Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {connection.models.length > 0 ? (
                  <Select value={selectedOllamaModel} onValueChange={setSelectedOllamaModel}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {connection.models.map((m) => (
                        <SelectItem key={m.name} value={m.name} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{m.name}</span>
                            <Badge variant="outline" className="text-[8px] h-3.5">
                              {formatSize(m.size)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    {connection.status === "connected"
                      ? "No models found — pull one with ollama pull"
                      : "Connect to see available models"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Parameters */}
          <Card>
            <CardHeader
              className="pb-2 cursor-pointer"
              onClick={() => setShowSettings(!showSettings)}
            >
              <CardTitle className="text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5" /> Parameters
                </span>
                {showSettings ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            {showSettings && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Temperature</span>
                    <span className="font-mono font-semibold">{temperature}</span>
                  </div>
                  <Slider
                    value={[temperature]}
                    onValueChange={([v]) => setTemperature(v)}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Max Tokens</span>
                    <span className="font-mono font-semibold">{maxTokens}</span>
                  </div>
                  <Slider
                    value={[maxTokens]}
                    onValueChange={([v]) => setMaxTokens(v)}
                    min={64}
                    max={4096}
                    step={64}
                    className="w-full"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* System prompt */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                System Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are the Builder perspective. Analyze the following capture..."
                className="text-xs min-h-[80px] resize-y"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Persisted locally — paste your SLM's system prompt from the template.
              </p>
            </CardContent>
          </Card>

          {/* Quick tips */}
          {mode === "ollama" ? (
            <div className="rounded-lg border border-[hsl(var(--forge-cyan))]/20 bg-[hsl(var(--forge-cyan))]/5 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-[hsl(var(--forge-cyan))]">
                💡 Quick Setup
              </p>
              <ul className="text-[10px] text-foreground/70 space-y-1 list-disc pl-3">
                <li>On phone: <code className="px-1 rounded bg-secondary">ollama serve</code> in Termux</li>
                <li>Find phone IP: <code className="px-1 rounded bg-secondary">ifconfig wlan0</code></li>
                <li>Enter <code className="px-1 rounded bg-secondary">http://PHONE_IP:11434</code> above</li>
                <li>Same Wi-Fi network required</li>
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-[hsl(var(--forge-emerald))]/20 bg-[hsl(var(--forge-emerald))]/5 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-[hsl(var(--forge-emerald))]">
                🧠 Browser Inference
              </p>
              <ul className="text-[10px] text-foreground/70 space-y-1 list-disc pl-3">
                <li>Models download once and are <strong>cached in your browser</strong></li>
                <li>All inference runs via WebGPU — <strong>no server, no internet</strong></li>
                <li>Works in Chrome 113+, Edge 113+, or any WebGPU-enabled browser</li>
                <li>Smaller models (360M–1.7B) work well on most devices</li>
                <li>Larger models (3B+) need a dedicated GPU with sufficient VRAM</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
