import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProjects, useModules, useStacks, useRuns, useProfile } from "@/hooks/useSupabaseData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, Settings, BarChart3, Activity,
  Zap, Clock, Globe, Cpu, AlertTriangle,
  Brain, Layers, Share2, Copy, ExternalLink,
  Users, Eye, TrendingDown, FileText,
} from "lucide-react";
import { toast } from "sonner";

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
        title: "Launch announcement",
        body: `I built an AI app — without writing backend code.\n\nSoupy lets you wire up GPT-5, Gemini, and open-source models into pipelines, test them, and ship to Android — all from one dashboard.\n\nNo infra headaches. No API-key juggling.\n\nTry it free 👇\n${SITE_URL}`,
      },
      {
        title: "Builder credibility",
        body: `Most "AI tools" are just wrappers.\n\nSoupy is different — you design the reasoning chain:\n✦ Pick your models\n✦ Set guardrails & tone\n✦ Wire nodes into stacks\n✦ Deploy to phone or web\n\nIt's Lego for AI builders.\n\n${SITE_URL}`,
      },
      {
        title: "Edge AI angle",
        body: `Hot take: the future of AI isn't in the cloud — it's on the device.\n\nThat's why I'm building with Soupy. It supports SLM mode so your models can run locally on a phone.\n\nSmaller. Faster. Private.\n\n${SITE_URL}`,
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
        title: "Community post",
        body: `If you've ever wanted to build your own AI app but didn't know where to start — Soupy is free to try. No coding required for basic setups. 50 free credits/month.\n\n${SITE_URL}`,
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
        title: "Thread opener",
        body: `I built an AI builder that lets you ship real AI apps — not toy demos.\n\nPick models. Wire logic. Deploy to Android.\n\nMeet Soupy 🧪\n\n${SITE_URL}`,
      },
      {
        title: "Short banger",
        body: `GPT-5 + Gemini + your own guardrails + one-click Android deploy = Soupy\n\nFree to start.\n${SITE_URL}`,
      },
    ],
    shareUrl: (text: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  },
];

export default function AdminPage() {
  const [flags, setFlags] = useState(featureFlags.map((f) => ({ ...f })));

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: projects } = useProjects();
  const { data: modules } = useModules();
  const { data: stacks } = useStacks();
  const { data: runs } = useRuns();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(7);

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
          {/* Site Analytics Summary */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Site Analytics</h3>
              <Badge variant="outline" className="text-[10px]">Last 7 days{analyticsLoading ? " · loading…" : ""}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Visitors", value: String(analytics?.totalVisitors ?? 0), icon: Users, change: `${analytics?.totalPageViews ?? 0} total views` },
                { label: "Page Views", value: String(analytics?.totalPageViews ?? 0), icon: Eye, change: analytics?.totalVisitors ? `${(analytics.totalPageViews / analytics.totalVisitors).toFixed(1)} per visit` : "—" },
                { label: "Bounce Rate", value: `${analytics?.bounceRate ?? 0}%`, icon: TrendingDown, change: analytics?.totalVisitors ? `${analytics.totalVisitors - Math.round(analytics.totalVisitors * analytics.bounceRate / 100)} engaged` : "—" },
                { label: "Avg Session", value: analytics?.avgSessionDuration ?? "—", icon: Clock, change: `${analytics?.totalVisitors ?? 0} sessions` },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                    <div className="text-[9px] text-primary/70 mt-1">{stat.change}</div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Top Pages */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Top Pages</span>
                </div>
                <div className="space-y-2">
                  {(analytics?.topPages ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  )}
                  {(analytics?.topPages ?? []).map((p) => (
                    <div key={p.page} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-mono text-xs truncate">{p.page}</span>
                      <Badge variant="secondary" className="text-[10px]">{p.views}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Traffic Sources</span>
                </div>
                <div className="space-y-2">
                  {(analytics?.topSources ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  )}
                  {(analytics?.topSources ?? []).map((s) => (
                    <div key={s.source} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">{s.source}</span>
                      <Badge variant="secondary" className="text-[10px]">{s.visits}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Devices */}
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Devices</span>
                </div>
                <div className="space-y-2">
                  {(analytics?.devices ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  )}
                  {(analytics?.devices ?? []).map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs capitalize">{d.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{d.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
      </Tabs>
    </div>
  );
}
