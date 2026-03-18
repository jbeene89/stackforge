import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Smartphone,
  Apple,
  TabletSmartphone,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Wifi,
  WifiOff,
  ChevronRight,
  ArrowRight,
  Info,
  Download,
  Terminal,
  FolderOpen,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { RamChecker } from "@/components/RamChecker";

// ─── Helpers ─────────────────────────────────────────────────
function CopyCommand({ code, label }: { code: string; label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-secondary/30 px-3 py-2 font-mono text-xs">
      <code className="flex-1 text-foreground/80 break-all">{code}</code>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => {
          navigator.clipboard.writeText(code);
          toast.success(label ? `Copied ${label}` : "Copied!");
        }}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
      {n}
    </div>
  );
}

function Requirement({ label, detail, ok }: { label: string; detail: string; ok?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      {ok !== undefined ? (
        ok ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--forge-emerald))]" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--forge-amber))]" />
        )
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
      )}
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[10px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function AppCard({
  name,
  icon,
  description,
  platform,
  storeUrl,
  recommended,
  children,
}: {
  name: string;
  icon: string;
  description: string;
  platform: string;
  storeUrl?: string;
  recommended?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={`transition-all ${
        recommended
          ? "border-[hsl(var(--forge-cyan))]/40 shadow-[0_0_12px_hsl(var(--forge-cyan)/0.08)]"
          : ""
      }`}
    >
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm flex items-center gap-2">
              {name}
              {recommended && (
                <Badge className="text-[9px] h-4 bg-[hsl(var(--forge-cyan))]/15 text-[hsl(var(--forge-cyan))] border-[hsl(var(--forge-cyan))]/30">
                  Recommended
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-[11px] mt-0.5">
              {description}
            </CardDescription>
          </div>
          {storeUrl && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 text-[10px] h-7 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                window.open(storeUrl, "_blank");
              }}
            >
              <Download className="h-3 w-3" />
              Get App
            </Button>
          )}
        </div>
      </CardHeader>
      {expanded && <CardContent className="pt-0 space-y-3">{children}</CardContent>}
      {!expanded && (
        <CardContent className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] text-muted-foreground h-6 px-0"
            onClick={() => setExpanded(true)}
          >
            Show setup steps <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function PhoneDeployGuidePage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TabletSmartphone className="h-6 w-6 text-[hsl(var(--forge-cyan))]" />
          <h1 className="text-2xl font-bold font-display">Phone Deployment Guide</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Step-by-step instructions for getting your trained GGUF model running on iOS and Android.
          Pick your app, follow the steps, and your SLM processes captures locally — no internet required.
        </p>
      </div>

      {/* Quick path */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {[
          { icon: "🏋️", label: "Train on PC" },
          { icon: "📦", label: "Get .gguf file" },
          { icon: "📲", label: "Transfer to phone" },
          { icon: "🤖", label: "Load in app" },
          { icon: "✨", label: "Run locally" },
        ].map((step, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/50" />}
            <span className="px-2 py-1 rounded-md bg-secondary/50 border border-border/40 font-medium">
              {step.icon} {step.label}
            </span>
          </span>
        ))}
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4 text-[hsl(var(--forge-cyan))]" />
            Before You Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                You'll Need
              </p>
              <Requirement
                label="A .gguf model file"
                detail="Generated from the Deploy Pipeline or manually converted with llama.cpp"
              />
              <Requirement
                label="A way to transfer files"
                detail="AirDrop, USB cable, cloud storage, or local Wi-Fi transfer"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Phone Requirements
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-semibold">RAM</p>
                  <p className="text-xs font-medium">6 GB+ (8 GB ideal)</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-semibold">Storage</p>
                  <p className="text-xs font-medium">1–2 GB per model</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-semibold">iOS</p>
                  <p className="text-xs font-medium">iPhone 12+ (A14)</p>
                </div>
                <div className="rounded-lg bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-semibold">Android</p>
                  <p className="text-xs font-medium">Snapdragon 8 Gen 1+</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RAM Checker */}
      <RamChecker />

      {/* Platform Tabs */}
      <Tabs defaultValue="ios" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="ios" className="gap-1.5">
            <Apple className="h-4 w-4" /> iOS
          </TabsTrigger>
          <TabsTrigger value="android" className="gap-1.5">
            <Smartphone className="h-4 w-4" /> Android
          </TabsTrigger>
        </TabsList>

        {/* ── iOS ─────────────────────────────────────────── */}
        <TabsContent value="ios" className="space-y-4">
          {/* LM Studio */}
          <AppCard
            name="LM Studio"
            icon="🧪"
            description="Full-featured local AI chat app with model management, conversation history, and system prompt support."
            platform="ios"
            storeUrl="https://apps.apple.com/app/lm-studio/id6448482004"
            recommended
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <StepNumber n={1} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Install LM Studio</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download from the App Store. Free, no account required.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => window.open("https://apps.apple.com/app/lm-studio/id6448482004", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" /> Open App Store
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={2} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Transfer your .gguf file</p>
                  <p className="text-[11px] text-muted-foreground">
                    Choose the easiest method for you:
                  </p>
                  <div className="space-y-1 ml-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[9px] shrink-0">Fastest</Badge>
                      <span><strong>AirDrop</strong> — right-click the .gguf on your Mac → Share → AirDrop</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[9px] shrink-0">Easy</Badge>
                      <span><strong>iCloud Drive</strong> — drop the file in iCloud, open from Files app</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[9px] shrink-0">Any OS</Badge>
                      <span><strong>USB + Finder</strong> — connect iPhone, drag to LM Studio folder</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={3} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Import into LM Studio</p>
                  <p className="text-[11px] text-muted-foreground">
                    Open LM Studio → tap <strong>Models</strong> tab → <strong>Import from Files</strong> →
                    select your .gguf file. It will appear in your model list.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={4} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Configure & Chat</p>
                  <p className="text-[11px] text-muted-foreground">
                    Select your model → tap <strong>Settings</strong> gear → paste your system prompt
                    from the template. Start a new chat — your SLM is now running 100% on-device.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-[hsl(var(--forge-emerald))]/5 border border-[hsl(var(--forge-emerald))]/20 p-2.5">
                <p className="text-[10px] text-[hsl(var(--forge-emerald))] font-semibold">
                  💡 Pro Tip
                </p>
                <p className="text-[10px] text-foreground/70 mt-0.5">
                  Save your system prompt as a preset in LM Studio so every new chat starts with
                  the right personality. Tap Settings → System Prompt → Save as Preset.
                </p>
              </div>
            </div>
          </AppCard>

          {/* MLC Chat iOS */}
          <AppCard
            name="MLC Chat"
            icon="💬"
            description="Open-source on-device chat app by the MLC team. Lightweight with broad model support."
            platform="ios"
            storeUrl="https://apps.apple.com/app/mlc-chat/id6448482004"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <StepNumber n={1} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Install MLC Chat</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download from the App Store. Open-source and free.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={2} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Transfer .gguf via Files</p>
                  <p className="text-[11px] text-muted-foreground">
                    Move your .gguf to iCloud Drive or On My iPhone. MLC Chat reads from the
                    local file system.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={3} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Add Custom Model</p>
                  <p className="text-[11px] text-muted-foreground">
                    Open MLC Chat → Settings → <strong>Add Custom Model</strong> → Browse to your
                    .gguf file. Set the model name and context length.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={4} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Start chatting</p>
                  <p className="text-[11px] text-muted-foreground">
                    Your model appears in the model list. Select it and start a conversation.
                  </p>
                </div>
              </div>
            </div>
          </AppCard>

          {/* llama.cpp iOS (advanced) */}
          <AppCard
            name="llama.cpp (iSH / a]Shell)"
            icon="⚙️"
            description="Run llama.cpp directly in a terminal emulator. Maximum control for power users."
            platform="ios"
          >
            <div className="space-y-3">
              <div className="rounded-lg bg-[hsl(var(--forge-amber))]/5 border border-[hsl(var(--forge-amber))]/20 p-2.5 mb-2">
                <p className="text-[10px] text-[hsl(var(--forge-amber))] font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Advanced — requires terminal familiarity
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={1} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Install a-Shell</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download <strong>a-Shell</strong> from the App Store — it provides a Unix
                    environment with C compiler on iOS.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => window.open("https://apps.apple.com/app/a-shell/id1473805438", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" /> a-Shell on App Store
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={2} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Get llama.cpp binary</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download a pre-built iOS binary or compile inside a-Shell:
                  </p>
                  <CopyCommand code="git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp && make" />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={3} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Run inference</p>
                  <CopyCommand code="./llama-cli -m /path/to/model.gguf -p 'Your prompt here' -n 256" />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={4} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Interactive chat mode</p>
                  <CopyCommand code="./llama-cli -m model.gguf --interactive --color -r 'User:' -p 'You are the Builder perspective...'" />
                </div>
              </div>
            </div>
          </AppCard>
        </TabsContent>

        {/* ── Android ─────────────────────────────────────── */}
        <TabsContent value="android" className="space-y-4">
          {/* MLC Chat Android */}
          <AppCard
            name="MLC Chat"
            icon="💬"
            description="Open-source on-device chat app. Best balance of ease-of-use and GGUF support on Android."
            platform="android"
            storeUrl="https://play.google.com/store/apps/details?id=ai.mlc.mlcchat"
            recommended
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <StepNumber n={1} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Install MLC Chat</p>
                  <p className="text-[11px] text-muted-foreground">
                    Download from Google Play Store or the MLC GitHub releases.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => window.open("https://play.google.com/store/apps/details?id=ai.mlc.mlcchat", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" /> Google Play
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={2} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Transfer .gguf to phone</p>
                  <p className="text-[11px] text-muted-foreground">Choose your method:</p>
                  <div className="space-y-1 ml-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[9px] shrink-0">Fastest</Badge>
                      <span><strong>USB cable</strong> — connect phone, drag .gguf to Downloads</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[9px] shrink-0">Wireless</Badge>
                      <span><strong>Google Drive</strong> — upload, then download on phone</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant="outline" className="text-[9px] shrink-0">Local</Badge>
                      <span><strong>Wi-Fi transfer</strong> — use any file transfer app on same network</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={3} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Import model</p>
                  <p className="text-[11px] text-muted-foreground">
                    Open MLC Chat → tap <strong>+</strong> → <strong>Import Local Model</strong> →
                    browse to your .gguf file in Downloads.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={4} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Start chatting</p>
                  <p className="text-[11px] text-muted-foreground">
                    Select your model from the list. Paste your system prompt and begin processing captures.
                  </p>
                </div>
              </div>
            </div>
          </AppCard>

          {/* Ollama via Termux */}
          <AppCard
            name="Ollama (via Termux)"
            icon="🦙"
            description="Run the full Ollama server on Android via Termux. Supports Modelfile, API access, and scripting."
            platform="android"
            storeUrl="https://f-droid.org/packages/com.termux/"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <StepNumber n={1} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Install Termux</p>
                  <p className="text-[11px] text-muted-foreground">
                    Get <strong>Termux</strong> from F-Droid (not Play Store — the Play Store version is outdated).
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    onClick={() => window.open("https://f-droid.org/packages/com.termux/", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" /> F-Droid
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={2} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Install Ollama</p>
                  <CopyCommand code="pkg update && pkg install ollama" label="install command" />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={3} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Transfer .gguf and create Modelfile</p>
                  <p className="text-[11px] text-muted-foreground">
                    Copy your .gguf to Termux's home directory, then create a Modelfile:
                  </p>
                  <CopyCommand code='echo "FROM ./model.gguf" > Modelfile' />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    For a custom system prompt, add it to the Modelfile:
                  </p>
                  <CopyCommand
                    code={`cat > Modelfile << 'EOF'\nFROM ./model.gguf\nSYSTEM "You are the Builder perspective..."\nEOF`}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={4} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Create and run the model</p>
                  <CopyCommand code="ollama create my-slm -f Modelfile" label="create command" />
                  <div className="mt-1">
                    <CopyCommand code="ollama run my-slm" label="run command" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-[hsl(var(--forge-cyan))]/5 border border-[hsl(var(--forge-cyan))]/20 p-2.5">
                <p className="text-[10px] text-[hsl(var(--forge-cyan))] font-semibold">
                  🔌 API Mode — process captures programmatically
                </p>
                <p className="text-[10px] text-foreground/70 mt-0.5 mb-1.5">
                  Run Ollama as a background server and hit it from any app:
                </p>
                <CopyCommand code="ollama serve &" />
                <div className="mt-1">
                  <CopyCommand
                    code={`curl http://localhost:11434/api/generate -d '{"model":"my-slm","prompt":"Process this capture..."}'`}
                  />
                </div>
              </div>
            </div>
          </AppCard>

          {/* llama.cpp Android */}
          <AppCard
            name="llama.cpp (Termux)"
            icon="⚙️"
            description="Compile and run llama.cpp directly. Maximum performance with direct hardware access."
            platform="android"
          >
            <div className="space-y-3">
              <div className="rounded-lg bg-[hsl(var(--forge-amber))]/5 border border-[hsl(var(--forge-amber))]/20 p-2.5 mb-2">
                <p className="text-[10px] text-[hsl(var(--forge-amber))] font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Advanced — best performance, more setup
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={1} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Install build tools in Termux</p>
                  <CopyCommand code="pkg install git cmake make clang" />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={2} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Clone and build llama.cpp</p>
                  <CopyCommand code="git clone https://github.com/ggerganov/llama.cpp\ncd llama.cpp\nmkdir build && cd build\ncmake ..\ncmake --build . --config Release" />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={3} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Run your model</p>
                  <CopyCommand code="./build/bin/llama-cli -m ~/model.gguf -p 'Analyze this capture...' -n 512" />
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <StepNumber n={4} />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Server mode (for app integration)</p>
                  <CopyCommand code="./build/bin/llama-server -m ~/model.gguf --host 0.0.0.0 --port 8080" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Runs a local OpenAI-compatible API on your phone at <code>http://localhost:8080</code>
                  </p>
                </div>
              </div>
            </div>
          </AppCard>
        </TabsContent>
      </Tabs>

      {/* Troubleshooting */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--forge-amber))]" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold">"Model too large" error</p>
              <p className="text-[10px] text-muted-foreground">
                Your phone doesn't have enough RAM. Use a smaller quantization (Q3_K_S instead
                of Q4_K_M) or a smaller base model (Qwen 2.5 0.5B instead of 1B).
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold">Slow inference speed</p>
              <p className="text-[10px] text-muted-foreground">
                Close other apps to free RAM. Lower the context length (e.g., 1024 instead of
                2048). Ensure your phone isn't in battery saver mode.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold">Garbage output</p>
              <p className="text-[10px] text-muted-foreground">
                Ensure you're using the correct chat template. Set temperature to 0.3-0.5 for
                structured tasks. Add a strong system prompt from your template.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold">App crashes on load</p>
              <p className="text-[10px] text-muted-foreground">
                The .gguf file may be corrupted during transfer. Re-transfer and verify the file
                size matches the original. Try a clean reinstall of the app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy callout */}
      <div className="rounded-lg border border-[hsl(var(--forge-emerald))]/20 bg-[hsl(var(--forge-emerald))]/5 p-4 text-center">
        <WifiOff className="h-6 w-6 mx-auto text-[hsl(var(--forge-emerald))] mb-2" />
        <p className="text-sm font-semibold">100% Private. 100% Offline. 100% Yours.</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Once deployed, your SLM runs entirely on your phone. No data leaves your device.
          No API calls. No cloud dependency. Your captures, your model, your insights.
        </p>
      </div>
    </div>
  );
}
