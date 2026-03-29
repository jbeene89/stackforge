import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProjects, useModules, useStacks, useRuns, useProfile } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Settings, BarChart3, Activity,
  Zap, Clock, Globe, Cpu, AlertTriangle,
  Brain, Layers, Share2, Copy, ExternalLink,
  Megaphone, Plus, Trash2, Gift, Search, Send, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// ------- FEATURE FLAGS (local state, no DB table for these) -------
const featureFlags = [
  { name: "AI Module Builder", description: "Visual module configuration and prompt engineering", enabled: true, category: "core" },
  { name: "Stack Orchestration", description: "Multi-node pipeline builder with canvas editor", enabled: true, category: "core" },
  { name: "Android App Generation", description: "Generate native Android apps from AI specs", enabled: true, category: "generation" },
  { name: "SLM Mode", description: "Small Language Model optimization for edge deployment", enabled: false, category: "experimental" },
  { name: "Real-time Collaboration", description: "Live multi-user editing and cursors", enabled: false, category: "experimental" },
  { name: "Local Model Support", description: "Run models locally via Ollama or LM Studio", enabled: false, category: "experimental" },
  { name: "Auto-versioning", description: "Automatic version snapshots on every save", enabled: true, category: "core" },
  { name: "Usage Analytics", description: "Detailed per-user and per-project analytics", enabled: true, category: "analytics" },
];

const SITE_URL = "https://soupylab.com";

const SOCIAL_POSTS = [
  {
    platform: "LinkedIn",
    color: "bg-[hsl(210,84%,40%)]",
    emoji: "💼",
    posts: [
      {
        title: "Guest demo launch",
        body: `Just added something I've been wanting to build for a while — a guest demo for Soupy Lab.\n\nYou can now try the module builder without signing up. Pick a preset (email classifier, scope summarizer, red team critic), tweak the system prompt, and run it live.\n\n5 free test runs. No account needed.\n\nI know "no-code AI" sounds like marketing fluff, but this is genuinely different — you're designing the reasoning, not just typing into a chatbox.\n\nWould love honest feedback from anyone who tries it.\n\n${SITE_URL}/demo/module-builder`,
      },
      {
        title: "Why modular matters",
        body: `Something I keep running into when talking to people about AI:\n\nEveryone's building wrappers. Thin layers over GPT that do one thing okay.\n\nWhat if instead, you designed each AI as a specialist with defined boundaries? Then wired them together?\n\nThat's what I've been building with Soupy. A module for classification. Another for critique. A third for formatting. Chain them into a pipeline. Each one traceable, testable, swappable.\n\nNot sexy. But it works in production.\n\n${SITE_URL}`,
      },
      {
        title: "Solo builder update",
        body: `Quick update on what I've shipped this month as a solo founder:\n\n→ Guest demo mode (try building a module without signing up)\n→ Redesigned landing page (was losing 90% of visitors at the door)\n→ SLM Lab publicly accessible for non-logged-in users\n→ Pricing page now properly reflects database tiers\n\nSmall things, but they matter. The biggest lesson: nobody cares about your features until they can try them.\n\n${SITE_URL}`,
      },
    ],
    shareUrl: (text: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}`,
  },
  {
    platform: "Facebook",
    color: "bg-[hsl(214,89%,52%)]",
    emoji: "📘",
    posts: [
      {
        title: "Casual share",
        body: `Been working on something cool — an app that lets you build AI-powered tools without being an ML engineer. Pick models, wire them up, deploy to your phone. Check it out: ${SITE_URL}`,
      },
      {
        title: "Demo drop",
        body: `I just added a free demo to my AI project — you can try building an AI module without even making an account. It takes like 30 seconds. Would love to know what you think.\n\n${SITE_URL}/demo/module-builder`,
      },
    ],
    shareUrl: (text: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(text)}`,
  },
  {
    platform: "Discord",
    color: "bg-[hsl(235,86%,65%)]",
    emoji: "🎮",
    posts: [
      {
        title: "Server drop",
        body: `yo just shipped something — **Soupy** lets you build AI pipelines visually and deploy them to Android 🤖\n\npick your models (GPT-5, Gemini, etc), set guardrails, chain them together, hit deploy\n\nfree tier has 50 credits/mo\n${SITE_URL}`,
      },
      {
        title: "Demo channel",
        body: `added a guest demo to soupy — you can try the module builder without making an account\n\nthree presets loaded: email classifier, scope summarizer, red team critic\n\njust hit run and it streams live output. 5 free tests.\n\n${SITE_URL}/demo/module-builder`,
      },
      {
        title: "Dev channel",
        body: `anyone messing with multi-model AI stacks? built a tool that lets you chain different LLMs together with routing logic, evaluators, critics etc\n\nlike n8n but for AI reasoning\n\n${SITE_URL}`,
      },
    ],
    shareUrl: null,
  },
  {
    platform: "X / Twitter",
    color: "bg-foreground",
    emoji: "𝕏",
    posts: [
      {
        title: "Demo announcement",
        body: `you can now try soupy's module builder without signing up\n\npick a preset, tweak the prompt, hit run, see live AI output\n\n5 free tests. 30 seconds to start.\n\n${SITE_URL}/demo/module-builder`,
      },
      {
        title: "Builder philosophy",
        body: `hot take: the best AI apps won't be built by prompting one model really hard\n\nthey'll be built by wiring specialists together — classifier → critic → formatter\n\nthat's what soupy does\n${SITE_URL}`,
      },
      {
        title: "Short banger",
        body: `GPT-5 + Gemini + your own guardrails + one-click Android deploy = Soupy\n\nFree to start.\n${SITE_URL}`,
      },
    ],
    shareUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
  {
    platform: "Reddit",
    color: "bg-[hsl(16,100%,50%)]",
    emoji: "🔴",
    posts: [
      {
        title: "r/microsaas — guest demo",
        body: `Title: Added a guest demo to my AI platform — try building a module without signing up\n\nHey r/microsaas,\n\nI posted about Soupy Lab a while back and got some good feedback. One thing that kept coming up: "let me try it before I make an account."\n\nSo I built that. There's now a guest demo at ${SITE_URL}/demo/module-builder where you can:\n\n• Pick a preset (email classifier, scope summarizer, or red team critic)\n• Edit the system prompt, role, temperature\n• Hit "Run Test" and get live streaming AI output\n• 5 free runs, no account needed\n\nThe whole point is to show that this isn't another chatbot wrapper. Each module has a defined job, explicit boundaries, and traceable output. You're designing the reasoning, not just typing.\n\nIf you try it, I'd genuinely love to hear what breaks or what feels weird. Solo founder here, so every bit of feedback actually gets read.\n\n${SITE_URL}`,
      },
      {
        title: "r/microsaas — conversion lessons",
        body: `Title: 83 visitors, 0 signups — what I changed and what I learned\n\nReal numbers from my first week with analytics on Soupy Lab (${SITE_URL}):\n\n• 83 unique visitors\n• 90% bounce rate\n• 8 people reached the login page\n• 0 signed up\n\nOuch.\n\nWhat I did about it:\n1. Rebuilt the landing page — moved social proof up, added video in the hero, killed the "Explore Demo" button that required login\n2. Made the SLM Lab publicly accessible so people can poke around\n3. Built a guest demo mode — try the module builder without an account (5 free AI test runs)\n4. Fixed the "Try Live Demo" CTA to actually go somewhere useful\n\nBiggest lesson: nobody cares about your feature list until they can touch the product. Reduce friction ruthlessly.\n\nWould love to hear from other microsaas founders — what's your best tactic for converting cold traffic?\n\n${SITE_URL}`,
      },
      {
        title: "r/SideProject — demo update",
        body: `Title: Month 3 of Soupy Lab — added a guest demo and rebuilt the landing page\n\nHey r/SideProject,\n\nQuick progress update on my AI builder side project:\n\nWhat shipped this sprint:\n• Guest demo mode — try the full module builder without signing up. Three presets, live AI output, 5 free runs\n• Landing page redesign — hero video, social proof moved above the fold, clearer CTAs\n• Public SLM Lab — the flagship feature page is now accessible without auth\n• Fixed pricing to respect database tiers (was defaulting everyone to "free")\n\nWhat I learned:\n• Having 83 visitors and 0 conversions is a humbling experience\n• The fix isn't more features — it's less friction\n• A free demo is worth 100 feature bullets\n\nStack: React + Supabase + Edge Functions. Solo founder. Everything serverless.\n\nTry the demo: ${SITE_URL}/demo/module-builder\n\nFeedback welcome — what would you build with something like this?`,
      },
      {
        title: "r/LocalLLaMA — SLM training",
        body: `Title: Building a visual interface for training and deploying small language models — looking for feedback\n\nHey r/LocalLLaMA,\n\nI've been building Soupy Lab (${SITE_URL}) — a visual platform for AI development. One of the features I'm most excited about is the SLM Lab, which is designed around the idea that most real-world tasks don't need a 70B model.\n\nThe approach:\n• Build training datasets from multiple sources (chat exports, web scrapes, interviews, HuggingFace imports)\n• Each data point gets enriched through 5 cognitive perspectives (we call it CDPT)\n• Selective Unlearning — remove specific behaviors without full retraining\n• Cognitive Fingerprinting — analyze your dataset to pick the right base model\n• Export for fine-tuning on whatever hardware you have (Ollama, LM Studio, etc.)\n\nThe SLM Lab is publicly accessible if you want to poke around: ${SITE_URL}/slm-lab\n\nI'm not claiming to replace your existing workflow — I'm trying to make the dataset engineering part less painful, especially for domain experts who aren't comfortable with CLI tools.\n\nWould love to hear from people actually training small models: what's the most annoying part of your current pipeline? What would save you the most time?\n\n${SITE_URL}`,
      },
      {
        title: "r/artificial — modular reasoning",
        body: `Title: Modular AI agents vs. single-model wrappers — where do you stand?\n\nGenuinely curious about this community's take.\n\nI've been building a platform (Soupy Lab — ${SITE_URL}) around the thesis that modular agent architectures will outperform monolithic wrappers for real-world tasks.\n\nThe idea: instead of one giant system prompt doing everything, you design specialists:\n• A classifier that routes input\n• A domain expert that processes it\n• A critic that evaluates the output\n• A formatter that structures the final result\n\nEach has explicit task boundaries, guardrails, and traceable I/O. Wire them together visually.\n\nThe counterargument: models keep getting better and context windows keep growing. Maybe a single well-prompted model will always beat a pipeline of smaller ones.\n\nI've built a free demo where you can try designing a module: ${SITE_URL}/demo/module-builder\n\nBut honestly, I'm more interested in the theoretical debate. Where do you think this is headed?`,
      },
    ],
    shareUrl: (text: string) => `https://www.reddit.com/submit?url=${encodeURIComponent(SITE_URL)}&title=${encodeURIComponent(text.split('\n')[0] || 'Soupy Lab')}`,
  },
];

export default function AdminPage() {
  const [flags, setFlags] = useState(featureFlags.map((f) => ({ ...f })));
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState("info");
  const [giftSearch, setGiftSearch] = useState("");
  const [giftAmount, setGiftAmount] = useState("100");
  const [giftReason, setGiftReason] = useState("");
  const [giftSendEmail, setGiftSendEmail] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const invokeAnnouncements = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-announcements", { body });
    if (error) throw error;
    return data;
  };

  const { data: announcements } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const result = await invokeAnnouncements({ action: "list" });
      return result.data;
    },
  });

  const addAnnouncement = useMutation({
    mutationFn: async () => {
      await invokeAnnouncements({ action: "create", title: newTitle, content: newContent, priority: newPriority });
    },
    onSuccess: () => {
      toast.success("Message posted");
      setNewTitle("");
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: () => toast.error("Failed to post"),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      await invokeAnnouncements({ action: "delete", id });
    },
    onSuccess: () => {
      toast.success("Message deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const toggleAnnouncement = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await invokeAnnouncements({ action: "toggle", id, active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  // Gift credits: user search
  const { data: searchedUsers, isLoading: searchingUsers } = useQuery({
    queryKey: ["admin-user-search", giftSearch],
    queryFn: async () => {
      if (giftSearch.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .or(`display_name.ilike.%${giftSearch}%`)
        .limit(10);
      return data || [];
    },
    enabled: giftSearch.length >= 2,
  });

  const giftCreditsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error("No user selected");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("gift-credits", {
        body: {
          targetUserId: selectedUserId,
          amount: parseInt(giftAmount),
          reason: giftReason || "Admin gift",
          sendEmail: giftSendEmail,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Gifted ${giftAmount} credits to ${data.targetUser}!`);
      setSelectedUserId(null);
      setGiftSearch("");
      setGiftAmount("100");
      setGiftReason("");
    },
    onError: (e) => toast.error(e.message),
  });

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: projects } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();
  const { data: runs } = useRuns();

  const projectCount = projects?.length || 0;
  const moduleCount = modules?.length || 0;
  const stackCount = stacks?.length || 0;
  const runCount = runs?.length || 0;

  const successRuns = runs?.filter(r => r.status === "success").length || 0;
  const failedRuns = runs?.filter(r => r.status === "failed").length || 0;
  const errorRate = runCount > 0 ? ((failedRuns / runCount) * 100).toFixed(1) : "0.0";
  const avgDuration = runCount > 0
    ? ((runs?.reduce((a, r) => a + r.total_duration_ms, 0) || 0) / runCount / 1000).toFixed(1)
    : "0.0";

  const deployedProjects = projects?.filter(p => p.status === "deployed").length || 0;

  const systemMetrics = [
    { label: "Projects", value: projectCount.toString(), icon: Globe },
    { label: "Modules", value: moduleCount.toString(), icon: Brain },
    { label: "Stacks", value: stackCount.toString(), icon: Layers },
    { label: "Total Runs", value: runCount.toString(), icon: Zap },
    { label: "Successful Runs", value: successRuns.toString(), icon: Activity },
    { label: "Avg Latency", value: `${avgDuration}s`, icon: Clock },
    { label: "Error Rate", value: `${errorRate}%`, icon: AlertTriangle },
    { label: "Deployed", value: deployedProjects.toString(), icon: Cpu },
  ];

  const toggleFlag = (name: string) => {
    setFlags((prev) => prev.map((f) => f.name === name ? { ...f, enabled: !f.enabled } : f));
  };

  return (
    <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Badge variant="outline" className="text-[10px]">{profile?.display_name || user?.email}</Badge>
      </div>

      <Tabs defaultValue="metrics" className="flex-1 flex flex-col min-h-0">
        <TabsList className="glass w-fit mb-4">
          <TabsTrigger value="metrics" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> Overview</TabsTrigger>
          <TabsTrigger value="social" className="text-xs gap-1.5"><Share2 className="h-3 w-3" /> Quick Posts</TabsTrigger>
          <TabsTrigger value="flags" className="text-xs gap-1.5"><Settings className="h-3 w-3" /> Feature Flags</TabsTrigger>
          <TabsTrigger value="messages" className="text-xs gap-1.5"><Megaphone className="h-3 w-3" /> Messages</TabsTrigger>
          <TabsTrigger value="gift" className="text-xs gap-1.5"><Gift className="h-3 w-3" /> Gift Credits</TabsTrigger>
          <TabsTrigger value="recent" className="text-xs gap-1.5"><Activity className="h-3 w-3" /> Recent Runs</TabsTrigger>
        </TabsList>

        {/* System Metrics */}
        <TabsContent value="metrics" className="flex-1 min-h-0 mt-0 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemMetrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{m.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Resource gauges */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Projects Active", value: projectCount > 0 ? Math.round((deployedProjects / projectCount) * 100) : 0, color: "bg-primary" },
              { label: "Run Success Rate", value: runCount > 0 ? Math.round((successRuns / runCount) * 100) : 0, color: "bg-forge-emerald" },
              { label: "Modules with SLM", value: moduleCount > 0 ? Math.round(((modules?.filter(m => m.slm_mode).length || 0) / moduleCount) * 100) : 0, color: "bg-forge-cyan" },
            ].map((gauge) => (
              <div key={gauge.label} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{gauge.label}</span>
                  <span className="text-sm font-bold">{gauge.value}%</span>
                </div>
                <Progress value={gauge.value} className="h-2" />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Quick Posts */}
        <TabsContent value="social" className="flex-1 min-h-0 mt-0 overflow-auto">
          <div className="space-y-6">
            {SOCIAL_POSTS.map((platform) => (
              <div key={platform.platform}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs text-white", platform.color)}>
                    {platform.emoji}
                  </span>
                  <h3 className="text-sm font-semibold">{platform.platform}</h3>
                  <Badge variant="outline" className="text-[10px]">{platform.posts.length} ready</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {platform.posts.map((post, pi) => (
                    <motion.div
                      key={pi}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pi * 0.06 }}
                      className="glass rounded-xl p-4 flex flex-col"
                    >
                      <p className="text-[11px] font-medium text-muted-foreground mb-2">{post.title}</p>
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed flex-1 mb-3 text-foreground/90">{post.body}</pre>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 flex-1"
                          onClick={() => {
                            navigator.clipboard.writeText(post.body);
                            toast.success("Copied to clipboard!");
                          }}
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                        {platform.shareUrl && (
                          <Button
                            size="sm"
                            className="text-xs gap-1.5 flex-1"
                            onClick={() => window.open((platform.shareUrl as Function)(post.body), "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" /> Post
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="flags" className="flex-1 min-h-0 mt-0 overflow-auto">
          {["core", "generation", "analytics", "experimental"].map((cat) => {
            const catFlags = flags.filter((f) => f.category === cat);
            if (catFlags.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">{cat}</h3>
                <div className="space-y-2">
                  {catFlags.map((flag) => (
                    <motion.div
                      key={flag.name}
                      layout
                      className="glass rounded-xl px-5 py-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", flag.enabled ? "bg-forge-emerald" : "bg-muted-foreground/30")} />
                        <div>
                          <span className="text-sm font-medium">{flag.name}</span>
                          <p className="text-[10px] text-muted-foreground">{flag.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px]">{flag.enabled ? "active" : "disabled"}</Badge>
                        <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.name)} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* Recent Runs */}
        <TabsContent value="recent" className="flex-1 min-h-0 mt-0 overflow-auto">
          {!runs?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No runs recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {runs.map((run, i) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-lg px-4 py-3 flex items-center gap-4"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    run.status === "success" ? "bg-forge-emerald/15 text-forge-emerald" : 
                    run.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                  )}>
                    {run.target_type === "module" ? "M" : run.target_type === "stack" ? "S" : "R"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{run.target_name}</span>
                      {" "}
                      <span className={cn("font-medium", run.status === "success" ? "text-forge-emerald" : "text-destructive")}>{run.status}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {run.target_type} · v{run.version} · {(Array.isArray(run.steps) ? run.steps : []).length} steps · {(run.total_duration_ms / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{new Date(run.started_at).toLocaleString()}</span>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages" className="flex-1 min-h-0 mt-0 overflow-auto">
          <div className="space-y-4">
            <div className="glass rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold">Post New Message</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-8 text-sm"
                />
                <Textarea
                  placeholder="Message content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="text-sm min-h-[60px]"
                />
                <div className="flex items-center gap-3">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={() => addAnnouncement.mutate()}
                    disabled={!newTitle.trim() || !newContent.trim() || addAnnouncement.isPending}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Post
                  </Button>
                </div>
              </div>
            </div>

            {announcements?.map((a: any) => (
              <div key={a.id} className={cn(
                "glass rounded-xl p-4 flex items-start justify-between gap-3",
                !a.active && "opacity-50"
              )}>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px]",
                      a.priority === "critical" ? "border-destructive text-destructive" :
                      a.priority === "warning" ? "border-forge-amber text-forge-amber" :
                      "border-primary text-primary"
                    )}>{a.priority}</Badge>
                    <span className="text-sm font-medium">{a.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.content}</p>
                  <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Switch
                    checked={a.active}
                    onCheckedChange={(active) => toggleAnnouncement.mutate({ id: a.id, active })}
                  />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteAnnouncement.mutate(a.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {(!announcements || announcements.length === 0) && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No messages yet. Post one above.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
