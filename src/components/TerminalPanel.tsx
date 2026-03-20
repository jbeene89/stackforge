import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronUp, ChevronDown, X, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TerminalLine {
  id: number;
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

const OLLAMA_COMMANDS: Record<string, { description: string; handler: (args: string[], addOutput: (content: string, type?: TerminalLine["type"]) => void) => Promise<void> }> = {
  help: {
    description: "Show available commands",
    handler: async (_args, addOutput) => {
      addOutput(`Available commands:
  help              Show this help message
  ollama list       List downloaded models
  ollama pull <m>   Pull a model
  ollama show <m>   Show model details
  ollama ps         Show running models
  ollama run <m>    Start a model
  ollama rm <m>     Remove a model
  untrain <m> [b]   Selective unlearning (run twice to confirm)
  call <m> <prompt> Call a model with a prompt
  scan              Scan for newest available models
  guardrails <m>    Test guardrails against NSFW scenarios
  clear             Clear terminal
  echo <text>       Print text
  whoami            Show current context
  status            Check Ollama connection status`, "output");
    },
  },
  clear: {
    description: "Clear terminal",
    handler: async () => { /* handled separately */ },
  },
  echo: {
    description: "Print text",
    handler: async (args, addOutput) => {
      addOutput(args.join(" "), "output");
    },
  },
  whoami: {
    description: "Show current context",
    handler: async (_args, addOutput) => {
      addOutput("stackforge-slm-lab @ local-device", "output");
    },
  },
  status: {
    description: "Check Ollama status",
    handler: async (_args, addOutput) => {
      addOutput("Checking Ollama connection...", "system");
      try {
        const resp = await fetch("http://localhost:11434/api/version");
        if (resp.ok) {
          const data = await resp.json();
          addOutput(`✓ Ollama is running (v${data.version})`, "output");
        } else {
          addOutput("✗ Ollama responded with an error", "error");
        }
      } catch {
        addOutput("✗ Ollama is not running at localhost:11434", "error");
        addOutput("  Start it with: ollama serve", "system");
      }
    },
  },
};

const OLLAMA_SUBCOMMANDS: Record<string, (args: string[], addOutput: (content: string, type?: TerminalLine["type"]) => void) => Promise<void>> = {
  list: async (_args, addOutput) => {
    addOutput("Querying local Ollama instance...", "system");
    try {
      const resp = await fetch("http://localhost:11434/api/tags");
      if (resp.ok) {
        const data = await resp.json();
        if (data.models?.length > 0) {
          const header = "NAME                          SIZE      MODIFIED";
          const rows = data.models.map((m: any) => {
            const name = m.name.padEnd(30);
            const size = `${(m.size / 1e9).toFixed(1)} GB`.padEnd(10);
            const mod = new Date(m.modified_at).toLocaleDateString();
            return `${name}${size}${mod}`;
          });
          addOutput([header, ...rows].join("\n"), "output");
        } else {
          addOutput("No models found. Pull one with: ollama pull <model>", "system");
        }
      } else {
        addOutput("Failed to query Ollama", "error");
      }
    } catch {
      addOutput("✗ Cannot reach Ollama at localhost:11434", "error");
    }
  },
  pull: async (args, addOutput) => {
    const model = args[0];
    if (!model) { addOutput("Usage: ollama pull <model-name>", "error"); return; }
    addOutput(`Pulling '${model}'...`, "system");
    try {
      const resp = await fetch("http://localhost:11434/api/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model, stream: false }),
      });
      if (resp.ok) {
        addOutput(`✓ Successfully pulled ${model}`, "output");
      } else {
        const err = await resp.text();
        addOutput(`✗ Pull failed: ${err}`, "error");
      }
    } catch {
      addOutput("✗ Cannot reach Ollama at localhost:11434", "error");
    }
  },
  show: async (args, addOutput) => {
    const model = args[0];
    if (!model) { addOutput("Usage: ollama show <model-name>", "error"); return; }
    try {
      const resp = await fetch("http://localhost:11434/api/show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const info = [
          `Model: ${model}`,
          `Format: ${data.details?.format || "unknown"}`,
          `Family: ${data.details?.family || "unknown"}`,
          `Parameters: ${data.details?.parameter_size || "unknown"}`,
          `Quantization: ${data.details?.quantization_level || "unknown"}`,
        ].join("\n");
        addOutput(info, "output");
      } else {
        addOutput(`✗ Model '${model}' not found`, "error");
      }
    } catch {
      addOutput("✗ Cannot reach Ollama", "error");
    }
  },
  ps: async (_args, addOutput) => {
    try {
      const resp = await fetch("http://localhost:11434/api/ps");
      if (resp.ok) {
        const data = await resp.json();
        if (data.models?.length > 0) {
          const lines = data.models.map((m: any) => `  ${m.name} (${(m.size / 1e9).toFixed(1)} GB) — expires ${m.expires_at}`);
          addOutput(`Running models:\n${lines.join("\n")}`, "output");
        } else {
          addOutput("No models currently loaded", "system");
        }
      }
    } catch {
      addOutput("✗ Cannot reach Ollama", "error");
    }
  },
  run: async (args, addOutput) => {
    const model = args[0];
    if (!model) { addOutput("Usage: ollama run <model-name>", "error"); return; }
    addOutput(`Loading ${model}... (use the Inference Playground for interactive chat)`, "system");
    try {
      const resp = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt: "Hello", stream: false }),
      });
      if (resp.ok) {
        addOutput(`✓ ${model} loaded and responding`, "output");
      } else {
        addOutput(`✗ Failed to load ${model}`, "error");
      }
    } catch {
      addOutput("✗ Cannot reach Ollama", "error");
    }
  },
  rm: async (args, addOutput) => {
    const model = args[0];
    if (!model) { addOutput("Usage: ollama rm <model-name>", "error"); return; }
    try {
      const resp = await fetch("http://localhost:11434/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: model }),
      });
      if (resp.ok) {
        addOutput(`✓ Deleted ${model}`, "output");
      } else {
        addOutput(`✗ Failed to delete ${model}`, "error");
      }
    } catch {
      addOutput("✗ Cannot reach Ollama", "error");
    }
  },
};

export function TerminalPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 0, type: "system", content: "StackForge Terminal v1.0 — type 'help' for commands", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [nextId, setNextId] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const addLine = useCallback((content: string, type: TerminalLine["type"] = "output") => {
    setNextId(prev => {
      const id = prev;
      setLines(l => [...l, { id, type, content, timestamp: new Date() }]);
      return prev + 1;
    });
  }, []);

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIndex(-1);
    addLine(`$ ${trimmed}`, "input");

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    if (command === "clear") {
      setLines([]);
      return;
    }

    if (command === "ollama" && parts[1]) {
      const sub = parts[1].toLowerCase();
      const handler = OLLAMA_SUBCOMMANDS[sub];
      if (handler) {
        await handler(parts.slice(2), addLine);
      } else {
        addLine(`Unknown ollama command: ${sub}. Try 'help'`, "error");
      }
      return;
    }

    const handler = OLLAMA_COMMANDS[command];
    if (handler) {
      await handler.handler(parts.slice(1), addLine);
    } else {
      addLine(`Command not found: ${command}. Type 'help' for available commands.`, "error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const copyAll = () => {
    const text = lines.map(l => l.content).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Terminal output copied");
  };

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input": return "text-forge-cyan";
      case "error": return "text-destructive";
      case "system": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        {/* Toggle bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-medium",
            "bg-background/95 backdrop-blur-sm border-t border-x border-border rounded-t-lg",
            "hover:bg-muted/50 transition-colors ml-16",
            isOpen && "border-b-0"
          )}
        >
          <Terminal className="h-3.5 w-3.5 text-forge-cyan" />
          <span>Terminal</span>
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        {/* Terminal body */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: isExpanded ? "60vh" : 220 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-background/95 backdrop-blur-sm border-t border-border"
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-forge-emerald animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground">local</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAll}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLines([])}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Output */}
              <div
                ref={scrollRef}
                className="overflow-auto font-mono text-xs leading-relaxed p-3"
                style={{ height: "calc(100% - 62px)" }}
                onClick={() => inputRef.current?.focus()}
              >
                {lines.map(line => (
                  <div key={line.id} className={cn("whitespace-pre-wrap", lineColor(line.type))}>
                    {line.content}
                  </div>
                ))}

                {/* Input line */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-forge-cyan select-none">$</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none text-foreground font-mono text-xs caret-forge-cyan"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
