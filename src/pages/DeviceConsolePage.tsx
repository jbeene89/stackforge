import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Terminal,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  List,
  Play,
  HardDrive,
  Activity,
  RotateCcw,
  Sparkles,
  Copy,
  Server,
  Smartphone,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────
interface LogEntry {
  id: string;
  timestamp: Date;
  type: "info" | "success" | "error" | "command" | "output" | "system";
  content: string;
}

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: { parameter_size?: string; quantization_level?: string; family?: string };
}

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

// ─── Helpers ────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function uid() {
  return crypto.randomUUID();
}

const LOG_COLORS: Record<LogEntry["type"], string> = {
  info: "text-muted-foreground",
  success: "text-[hsl(var(--forge-emerald))]",
  error: "text-destructive",
  command: "text-[hsl(var(--forge-cyan))]",
  output: "text-foreground/80",
  system: "text-[hsl(var(--forge-violet))]",
};

const LOG_PREFIX: Record<LogEntry["type"], string> = {
  info: "i",
  success: "OK",
  error: "!!",
  command: ">>",
  output: "  ",
  system: "**",
};

// ─── Action definitions ─────────────────────────────────────
interface ActionCard {
  id: string;
  label: string;
  description: string;
  icon: typeof Download;
  color: string;
  needsModel?: boolean;
  needsInput?: boolean;
  inputPlaceholder?: string;
  inputLabel?: string;
}

const ACTIONS: ActionCard[] = [
  {
    id: "list",
    label: "See My Models",
    description: "Check which models are loaded on your device",
    icon: List,
    color: "var(--forge-cyan)",
  },
  {
    id: "pull",
    label: "Download a Model",
    description: "Pull a model from the Ollama library to your device",
    icon: Download,
    color: "var(--forge-emerald)",
    needsInput: true,
    inputPlaceholder: "e.g. llama3.2:1b, qwen2.5:0.5b",
    inputLabel: "Model name",
  },
  {
    id: "run",
    label: "Quick Prompt",
    description: "Send a single prompt to a model and see the response",
    icon: Play,
    color: "var(--forge-gold)",
    needsModel: true,
    needsInput: true,
    inputPlaceholder: "What would you like to ask?",
    inputLabel: "Your prompt",
  },
  {
    id: "info",
    label: "Model Details",
    description: "See architecture, size, and quantization info for a model",
    icon: HardDrive,
    color: "var(--forge-violet)",
    needsModel: true,
  },
  {
    id: "health",
    label: "Health Check",
    description: "Verify Ollama is responsive and check server version",
    icon: Activity,
    color: "var(--forge-amber)",
  },
  {
    id: "delete",
    label: "Remove a Model",
    description: "Delete a model from your device to free up space",
    icon: Trash2,
    color: "var(--forge-rose)",
    needsModel: true,
  },
];

// ─── Main Component ─────────────────────────────────────────
export default function DeviceConsolePage() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [url, setUrl] = useState(localStorage.getItem("ollama-url") || "http://localhost:11434");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [actionInputs, setActionInputs] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("ollama-url", url);
  }, [url]);

  const log = useCallback((type: LogEntry["type"], content: string) => {
    setLogs((prev) => [...prev, { id: uid(), timestamp: new Date(), type, content }]);
  }, []);

  // ── Connection ────────────────────────────────────────────
  const connect = useCallback(async () => {
    setStatus("connecting");
    log("system", "Connecting to device...");
    try {
      const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const m: OllamaModel[] = data.models || [];
      setModels(m);
      if (m.length > 0 && !selectedModel) setSelectedModel(m[0].name);
      setStatus("connected");
      log("success", `Connected! Found ${m.length} model${m.length !== 1 ? "s" : ""} on device.`);
    } catch (e: any) {
      setStatus("error");
      const msg = e.name === "TimeoutError"
        ? "Timed out - is Ollama running on the device?"
        : e.message?.includes("Failed to fetch")
        ? "Cannot reach device - check the address and make sure you're on the same Wi-Fi"
        : e.message || "Connection failed";
      log("error", msg);
      toast.error(msg);
    }
  }, [url, selectedModel, log]);

  // ── Refresh models ────────────────────────────────────────
  const refreshModels = useCallback(async () => {
    try {
      const res = await fetch(`${url}/api/tags`);
      const data = await res.json();
      setModels(data.models || []);
    } catch { /* silent */ }
  }, [url]);

  // ── Execute action ────────────────────────────────────────
  const executeAction = useCallback(async (action: ActionCard) => {
    if (runningAction) return;
    setRunningAction(action.id);

    try {
      switch (action.id) {
        case "list": {
          log("command", "Listing models on device...");
          const res = await fetch(`${url}/api/tags`);
          const data = await res.json();
          const m: OllamaModel[] = data.models || [];
          setModels(m);
          if (m.length === 0) {
            log("info", "No models found. Use 'Download a Model' to get started.");
          } else {
            m.forEach((model) => {
              log("output", `  ${model.name}  (${formatSize(model.size)})`);
            });
            log("success", `${m.length} model${m.length !== 1 ? "s" : ""} available.`);
          }
          break;
        }

        case "pull": {
          const modelName = actionInputs.pull?.trim();
          if (!modelName) { log("error", "Enter a model name first."); break; }
          log("command", `Downloading ${modelName}...`);
          log("info", "This may take a few minutes depending on model size and connection speed.");

          const res = await fetch(`${url}/api/pull`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: modelName, stream: true }),
          });

          if (!res.ok) throw new Error(await res.text());
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response");

          const decoder = new TextDecoder();
          let lastStatus = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.status && json.status !== lastStatus) {
                  lastStatus = json.status;
                  if (json.total && json.completed) {
                    const pct = Math.round((json.completed / json.total) * 100);
                    log("output", `  ${json.status} ${pct}%`);
                  } else {
                    log("output", `  ${json.status}`);
                  }
                }
              } catch { /* skip */ }
            }
          }

          log("success", `${modelName} downloaded successfully!`);
          toast.success(`${modelName} is ready`);
          setActionInputs((p) => ({ ...p, pull: "" }));
          await refreshModels();
          break;
        }

        case "run": {
          if (!selectedModel) { log("error", "Select a model first."); break; }
          const prompt = actionInputs.run?.trim();
          if (!prompt) { log("error", "Enter a prompt first."); break; }

          log("command", `Asking ${selectedModel}...`);
          const res = await fetch(`${url}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: selectedModel, prompt, stream: true }),
          });

          if (!res.ok) throw new Error(await res.text());
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response");

          const decoder = new TextDecoder();
          let fullResponse = "";
          let tokenCount = 0;
          const startTime = Date.now();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.response) {
                  fullResponse += json.response;
                  tokenCount++;
                }
              } catch { /* skip */ }
            }
          }

          const elapsed = (Date.now() - startTime) / 1000;
          const tokPerSec = tokenCount / elapsed;

          log("output", fullResponse.trim());
          log("success", `Done - ${tokenCount} tokens in ${elapsed.toFixed(1)}s (${tokPerSec.toFixed(1)} tok/s)`);
          setActionInputs((p) => ({ ...p, run: "" }));
          break;
        }

        case "info": {
          if (!selectedModel) { log("error", "Select a model first."); break; }
          log("command", `Checking ${selectedModel} details...`);
          const res = await fetch(`${url}/api/show`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: selectedModel }),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          log("output", `  Model:    ${selectedModel}`);
          if (data.details?.parameter_size) log("output", `  Params:   ${data.details.parameter_size}`);
          if (data.details?.quantization_level) log("output", `  Quant:    ${data.details.quantization_level}`);
          if (data.details?.family) log("output", `  Family:   ${data.details.family}`);
          if (data.modelfile) {
            const sysMatch = data.modelfile.match(/SYSTEM\s+"([^"]+)"/);
            if (sysMatch) log("output", `  System:   "${sysMatch[1].substring(0, 80)}..."`);
          }
          log("success", "Details retrieved.");
          break;
        }

        case "health": {
          log("command", "Running health check...");
          const start = Date.now();
          const res = await fetch(`${url}/api/version`);
          const latency = Date.now() - start;
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          log("output", `  Version:  ${data.version || "unknown"}`);
          log("output", `  Latency:  ${latency}ms`);
          log("output", `  Models:   ${models.length} loaded`);
          log("success", "Device is healthy and responsive.");
          break;
        }

        case "delete": {
          if (!selectedModel) { log("error", "Select a model first."); break; }
          log("command", `Removing ${selectedModel}...`);
          const res = await fetch(`${url}/api/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: selectedModel }),
          });
          if (!res.ok) throw new Error(await res.text());
          log("success", `${selectedModel} removed from device.`);
          toast.success(`${selectedModel} deleted`);
          setSelectedModel("");
          await refreshModels();
          break;
        }
      }
    } catch (e: any) {
      log("error", e.message || "Something went wrong.");
    } finally {
      setRunningAction(null);
    }
  }, [url, models, selectedModel, actionInputs, runningAction, log, refreshModels]);

  const clearLogs = () => setLogs([]);

  const statusLabel: Record<ConnectionStatus, string> = {
    disconnected: "Not Connected",
    connecting: "Connecting...",
    connected: "Device Online",
    error: "Connection Failed",
  };

  const statusColor: Record<ConnectionStatus, string> = {
    disconnected: "text-muted-foreground",
    connecting: "text-[hsl(var(--forge-amber))]",
    connected: "text-[hsl(var(--forge-emerald))]",
    error: "text-destructive",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-[hsl(var(--forge-cyan))]" />
          <h1 className="text-2xl font-bold font-display">Device Console</h1>
          <Badge
            variant="outline"
            className={cn("text-[9px] h-4 gap-1", statusColor[status])}
          >
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "connected" && "bg-[hsl(var(--forge-emerald))]",
              status === "connecting" && "bg-[hsl(var(--forge-amber))] animate-pulse",
              status === "error" && "bg-destructive",
              status === "disconnected" && "bg-muted-foreground"
            )} />
            {statusLabel[status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Control your phone's AI engine from here. Connect to Ollama on your device,
          manage models, and run prompts — no command line needed.
        </p>
      </div>

      {/* Connection card */}
      <Card className="border-[hsl(var(--forge-cyan))]/20 bg-gradient-to-r from-[hsl(var(--forge-cyan))]/[0.03] to-transparent">
        <CardContent className="py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Server className="h-4 w-4 text-[hsl(var(--forge-cyan))]" />
              <span className="text-xs font-semibold">Device Address</span>
            </div>
            <Input
              value={url}
              onChange={(e) => { setUrl(e.target.value); setStatus("disconnected"); }}
              placeholder="http://192.168.1.42:11434"
              className="font-mono text-xs h-8 flex-1"
            />
            <Button
              size="sm"
              className="h-8 gap-1.5 shrink-0"
              onClick={connect}
              disabled={status === "connecting"}
            >
              {status === "connecting" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : status === "connected" ? (
                <RotateCcw className="h-3 w-3" />
              ) : (
                <Wifi className="h-3 w-3" />
              )}
              {status === "connected" ? "Reconnect" : "Connect"}
            </Button>
          </div>
          {status === "disconnected" && (
            <div className="mt-2 rounded-md bg-secondary/30 border border-border/30 p-2.5">
              <p className="text-[10px] text-muted-foreground">
                <Sparkles className="h-3 w-3 inline mr-1 text-[hsl(var(--forge-gold))]" />
                <strong>Quick start:</strong> On your phone, open Termux and type{" "}
                <code className="px-1 py-0.5 rounded bg-secondary text-foreground/70 font-mono">ollama serve</code>,
                then find your phone's IP with{" "}
                <code className="px-1 py-0.5 rounded bg-secondary text-foreground/70 font-mono">ifconfig wlan0</code>.
                Enter <code className="px-1 py-0.5 rounded bg-secondary text-foreground/70 font-mono">http://YOUR_IP:11434</code> above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model selector (when connected) */}
      {status === "connected" && models.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">Active Model:</span>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-8 text-xs w-[260px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.name} value={m.name} className="text-xs">
                  <span className="flex items-center gap-2">
                    {m.name}
                    <Badge variant="outline" className="text-[8px] h-3.5 font-mono">
                      {formatSize(m.size)}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Action cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {ACTIONS.map((action) => {
                const Icon = action.icon;
                const isRunning = runningAction === action.id;
                const disabled = status !== "connected" || (runningAction !== null && !isRunning);

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={cn(
                        "transition-all group",
                        disabled && "opacity-50",
                        !disabled && "hover:border-[hsl(var(--forge-cyan))]/30 hover:shadow-[0_0_12px_hsl(var(--forge-cyan)/0.06)]",
                        isRunning && "border-[hsl(var(--forge-cyan))]/40"
                      )}
                    >
                      <CardContent className="py-3 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2.5">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: `hsl(${action.color} / 0.1)`,
                                border: `1px solid hsl(${action.color} / 0.2)`,
                              }}
                            >
                              {isRunning ? (
                                <Loader2 className="h-4 w-4 animate-spin" style={{ color: `hsl(${action.color})` }} />
                              ) : (
                                <Icon className="h-4 w-4" style={{ color: `hsl(${action.color})` }} />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{action.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Input field */}
                        {action.needsInput && (
                          <div className="space-y-1">
                            <label className="text-[9px] text-muted-foreground font-semibold uppercase">
                              {action.inputLabel}
                            </label>
                            <Input
                              value={actionInputs[action.id] || ""}
                              onChange={(e) =>
                                setActionInputs((p) => ({ ...p, [action.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !disabled) executeAction(action);
                              }}
                              placeholder={action.inputPlaceholder}
                              className="h-7 text-xs"
                              disabled={disabled}
                            />
                          </div>
                        )}

                        {/* Needs model warning */}
                        {action.needsModel && !selectedModel && status === "connected" && (
                          <p className="text-[9px] text-[hsl(var(--forge-amber))] flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Select a model above first
                          </p>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-full text-[10px] gap-1.5"
                          disabled={disabled || (action.needsModel && !selectedModel)}
                          onClick={() => executeAction(action)}
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Working...
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3" /> {action.label}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Output log */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Output Log
            </h2>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const text = logs.map((l) => `[${LOG_PREFIX[l.type]}] ${l.content}`).join("\n");
                      navigator.clipboard.writeText(text);
                      toast.success("Log copied");
                    }}
                    disabled={logs.length === 0}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Copy log</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={clearLogs}
                    disabled={logs.length === 0}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>Clear log</p></TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Card className="border-border/40 bg-[hsl(var(--background))]/80 backdrop-blur-sm">
            <ScrollArea
              className="h-[500px] font-mono text-[11px] leading-relaxed p-3"
              ref={scrollRef}
            >
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Terminal className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {status === "connected"
                      ? "Pick an action to get started"
                      : "Connect to your device to begin"}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {logs.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn("flex gap-2", LOG_COLORS[entry.type])}
                    >
                      <span className="shrink-0 opacity-40 select-none w-4 text-right">
                        {LOG_PREFIX[entry.type]}
                      </span>
                      <span className="whitespace-pre-wrap break-all">{entry.content}</span>
                    </motion.div>
                  ))}
                  {runningAction && (
                    <div className="flex gap-2 text-[hsl(var(--forge-cyan))] animate-pulse">
                      <span className="shrink-0 opacity-40 w-4 text-right">..</span>
                      <span>working...</span>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Connection hint */}
          {status !== "connected" && (
            <div className="rounded-lg border border-[hsl(var(--forge-amber))]/20 bg-[hsl(var(--forge-amber))]/5 p-2.5">
              <p className="text-[10px] text-[hsl(var(--forge-amber))] font-semibold flex items-center gap-1">
                <Smartphone className="h-3 w-3" /> Not connected
              </p>
              <p className="text-[10px] text-foreground/60 mt-0.5">
                Connect to your device above to unlock all actions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
