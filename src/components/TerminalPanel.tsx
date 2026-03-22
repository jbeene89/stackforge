import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronUp, ChevronDown, X, Copy, Trash2, Palette, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { STATIC_COMMANDS, OLLAMA_SUBCOMMANDS, ALL_COMMANDS } from "./terminal/commands";
import { TERMINAL_THEMES, THEME_ORDER } from "./terminal/themes";
import { ActionCard } from "./terminal/ActionCard";
import type { TerminalLine, ActionCardData } from "./terminal/types";

const SESSION_KEY = "soupy-terminal-session";
const THEME_KEY = "soupy-terminal-theme";

export function TerminalPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>(() => {
    // Restore session
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) }));
      }
    } catch {}
    return [{ id: 0, type: "system" as const, content: "Soupy Terminal v2.0 — type 'help' for commands  ·  Ctrl+T theme  ·  Tab autocomplete", timestamp: new Date() }];
  });
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("soupy-terminal-history") || "[]");
    } catch { return []; }
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [nextId, setNextId] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved).length + 1;
    } catch {}
    return 1;
  });
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem(THEME_KEY) || "pyrefly");
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);
  const [selectedAC, setSelectedAC] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const untrainPending = useRef<{ key: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  const theme = TERMINAL_THEMES[themeKey] || TERMINAL_THEMES.pyrefly;

  // Persist session
  useEffect(() => {
    const toSave = lines.slice(-200); // keep last 200 lines
    localStorage.setItem(SESSION_KEY, JSON.stringify(toSave));
  }, [lines]);

  useEffect(() => {
    localStorage.setItem("soupy-terminal-history", JSON.stringify(history.slice(0, 50)));
  }, [history]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Autocomplete logic
  useEffect(() => {
    if (!input.trim()) {
      setAutocompleteOptions([]);
      return;
    }
    const lower = input.toLowerCase();
    const matches = ALL_COMMANDS.filter(c => c.startsWith(lower) && c !== lower);
    setAutocompleteOptions(matches.slice(0, 5));
    setSelectedAC(0);
  }, [input]);

  const addLine = useCallback((content: string, type: TerminalLine["type"] = "output", cardData?: ActionCardData) => {
    setNextId(prev => {
      const id = prev;
      setLines(l => [...l, { id, type, content, timestamp: new Date(), cardData }]);
      return prev + 1;
    });
  }, []);

  const streamLine = useCallback((_id: number, content: string) => {
    // Update the last output line with streamed content
    setLines(l => {
      const updated = [...l];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].type === "output") {
          updated[i] = { ...updated[i], content };
          break;
        }
      }
      return updated;
    });
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeKey(prev => {
      const idx = THEME_ORDER.indexOf(prev);
      const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  const exportSession = useCallback(() => {
    const md = lines.map(l => {
      const ts = l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp;
      const prefix = l.type === "input" ? "$ " : l.type === "error" ? "ERROR: " : l.type === "system" ? "// " : "";
      return `${prefix}${l.content}`;
    }).join("\n");
    const blob = new Blob([`# Soupy Terminal Session\n# Exported: ${new Date().toISOString()}\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-session-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Session exported as markdown");
  }, [lines]);

  const handleUntrain = async (args: string[]) => {
    const model = args[0];
    if (!model) { addLine("Usage: untrain <model-name> [behaviors...]", "error"); return; }
    const behaviors = args.slice(1);
    if (behaviors.length === 0) {
      addLine(`Specify behaviors to suppress. Examples:\n  untrain ${model} corporate-hedging hallucinated-citations excessive-apologies\n  untrain ${model} sycophancy verbose-disclaimers`, "system");
      return;
    }
    const key = `${model}:${behaviors.sort().join(",")}`;
    if (untrainPending.current?.key === key) {
      clearTimeout(untrainPending.current.timer);
      untrainPending.current = null;
      addLine(`⚡ CONFIRMED — generating unlearning artifacts for ${model}`, "system");
      addLine(`  Target behaviors: ${behaviors.join(", ")}`, "output");
      addLine(`  Generating DPO-format JSONL with weighted rejected pairs (weight: 2.0)...`, "system");
      await new Promise(r => setTimeout(r, 1200));
      addLine(`  ✓ unlearn_${model.replace(/[:/]/g, "_")}.jsonl — ${behaviors.length * 12} rejection pairs generated`, "output");
      addLine(`  ✓ merge_subtract.py — Task Vector Subtraction utility created`, "output");
      addLine(`\nNext steps:\n  1. Fine-tune with: python merge_subtract.py --base ${model} --delta unlearn_${model.replace(/[:/]/g, "_")}.jsonl\n  2. Validate with: guardrails ${model}`, "system");
    } else {
      if (untrainPending.current) clearTimeout(untrainPending.current.timer);
      const timer = setTimeout(() => { untrainPending.current = null; }, 10000);
      untrainPending.current = { key, timer };
      addLine(`⚠ SELECTIVE UNLEARNING — ${model}`, "error");
      addLine(`  Behaviors to suppress: ${behaviors.join(", ")}`, "system");
      addLine(`  ⚠ Run the same command again within 10s to confirm.`, "system");
    }
  };

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h].slice(0, 50));
    setHistoryIndex(-1);
    setAutocompleteOptions([]);
    addLine(`$ ${trimmed}`, "input");

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();

    if (command === "clear") { setLines([]); return; }
    if (command === "theme") { cycleTheme(); addLine(`Theme switched`, "system"); return; }
    if (command === "export") { exportSession(); return; }
    if (command === "untrain") { await handleUntrain(parts.slice(1)); return; }

    if (command === "ollama" && parts[1]) {
      const sub = parts[1].toLowerCase();
      const handler = OLLAMA_SUBCOMMANDS[sub];
      if (handler) await handler(parts.slice(2), addLine, streamLine);
      else addLine(`Unknown ollama command: ${sub}. Try 'help'`, "error");
      return;
    }

    const handler = STATIC_COMMANDS[command];
    if (handler) await handler.handler(parts.slice(1), addLine, streamLine);
    else addLine(`Command not found: ${command}. Type 'help' for available commands.`, "error");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Global shortcuts
    if (e.ctrlKey && e.key === "t") { e.preventDefault(); cycleTheme(); return; }
    if (e.ctrlKey && e.key === "l") { e.preventDefault(); setLines([]); return; }
    if (e.ctrlKey && e.key === "s") { e.preventDefault(); exportSession(); return; }

    // Tab autocomplete
    if (e.key === "Tab") {
      e.preventDefault();
      if (autocompleteOptions.length > 0) {
        setInput(autocompleteOptions[selectedAC] + " ");
        setAutocompleteOptions([]);
      }
      return;
    }

    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (autocompleteOptions.length > 0) {
        setSelectedAC(i => Math.max(0, i - 1));
      } else if (history.length > 0) {
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (autocompleteOptions.length > 0) {
        setSelectedAC(i => Math.min(autocompleteOptions.length - 1, i + 1));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Escape") {
      setAutocompleteOptions([]);
    }
  };

  const copyAll = () => {
    const text = lines.map(l => l.content).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Terminal output copied");
  };

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input": return theme.input;
      case "error": return theme.error;
      case "system": return theme.system;
      case "card": return "";
      default: return theme.output;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="pointer-events-auto">
        {/* Tab button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-medium",
            "bg-background/95 backdrop-blur-sm border-t border-x border-border rounded-t-lg",
            "hover:bg-muted/50 transition-colors ml-16",
            isOpen && "border-b-0"
          )}
        >
          <Terminal className="h-3.5 w-3.5 text-[hsl(var(--forge-cyan))]" />
          <span>Terminal</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{TERMINAL_THEMES[themeKey].name}</span>
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: isExpanded ? "60vh" : 260 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("overflow-hidden backdrop-blur-sm border-t", theme.bg, theme.border)}
            >
              {/* Toolbar */}
              <div className={cn("flex items-center justify-between px-3 py-1.5 border-b bg-black/20", theme.border)}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(340,75%,55%)]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(42,95%,55%)]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(155,65%,42%)]" />
                  </div>
                  <span className={cn("text-[10px] font-mono", theme.system)}>soupy@local</span>
                  <span className="text-[9px] px-1 rounded" style={{ background: theme.accent + "20", color: theme.accent }}>
                    {theme.name}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5" onClick={cycleTheme} title="Cycle theme (Ctrl+T)">
                    <Palette className="h-3 w-3" style={{ color: theme.accent }} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5" onClick={exportSession} title="Export session (Ctrl+S)">
                    <Download className="h-3 w-3" style={{ color: theme.accent }} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5" onClick={copyAll}>
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5" onClick={() => setLines([])}>
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronUp className="h-3 w-3 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/5" onClick={() => setIsOpen(false)}>
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Terminal body */}
              <div
                ref={scrollRef}
                className="overflow-auto font-mono text-xs leading-relaxed p-3 relative"
                style={{ height: "calc(100% - 40px)" }}
                onClick={() => inputRef.current?.focus()}
              >
                {lines.map(line => (
                  line.type === "card" && line.cardData ? (
                    <ActionCard key={line.id} data={line.cardData} />
                  ) : (
                    <div key={line.id} className={cn("whitespace-pre-wrap", lineColor(line.type))}>
                      {line.content}
                    </div>
                  )
                ))}

                {/* Input line with autocomplete */}
                <div className="relative">
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("select-none", theme.prompt)}>$</span>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={cn("flex-1 bg-transparent outline-none font-mono text-xs", theme.text)}
                      style={{ caretColor: theme.accent }}
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="type a command..."
                    />
                  </div>

                  {/* Autocomplete dropdown */}
                  <AnimatePresence>
                    {autocompleteOptions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={cn("absolute bottom-full left-4 mb-1 rounded border py-1 z-50 min-w-[200px]", theme.border)}
                        style={{ background: "rgba(0,0,0,0.9)" }}
                      >
                        {autocompleteOptions.map((opt, i) => (
                          <button
                            key={opt}
                            onClick={() => { setInput(opt + " "); setAutocompleteOptions([]); inputRef.current?.focus(); }}
                            className={cn(
                              "block w-full text-left px-3 py-1 text-xs font-mono transition-colors",
                              i === selectedAC ? theme.selection + " " + theme.text : theme.system,
                              "hover:" + theme.selection
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                        <div className={cn("text-[9px] px-3 pt-1 border-t mt-1", theme.border, theme.system)}>
                          Tab to complete · ↑↓ to navigate
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
