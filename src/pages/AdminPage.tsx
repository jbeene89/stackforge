import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Shield, Users, Settings, BarChart3, Activity, Search,
  ChevronDown, ChevronRight, MoreHorizontal, TrendingUp,
  Zap, Clock, Globe, Cpu, HardDrive, AlertTriangle,
  CheckCircle2, XCircle, UserPlus, Ban, Mail, Eye
} from "lucide-react";

// ------- USER DATA -------

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "suspended" | "invited";
  lastActive: string;
  projects: number;
  runs: number;
}

const mockUsers: MockUser[] = [
  { id: "u1", name: "Alex Morgan", email: "alex@stackforge.ai", role: "owner", status: "active", lastActive: "2 min ago", projects: 6, runs: 1240 },
  { id: "u2", name: "Sarah Chen", email: "sarah@stackforge.ai", role: "admin", status: "active", lastActive: "1 hour ago", projects: 4, runs: 890 },
  { id: "u3", name: "James Wilson", email: "james@stackforge.ai", role: "editor", status: "active", lastActive: "3 hours ago", projects: 3, runs: 456 },
  { id: "u4", name: "Maria Garcia", email: "maria@contractor.co", role: "editor", status: "active", lastActive: "1 day ago", projects: 2, runs: 234 },
  { id: "u5", name: "Dev Patel", email: "dev@stackforge.ai", role: "viewer", status: "active", lastActive: "2 days ago", projects: 1, runs: 89 },
  { id: "u6", name: "Lisa Thompson", email: "lisa@partner.io", role: "viewer", status: "invited", lastActive: "Never", projects: 0, runs: 0 },
  { id: "u7", name: "Tom Baker", email: "tom@example.com", role: "editor", status: "suspended", lastActive: "2 weeks ago", projects: 2, runs: 120 },
];

const roleColors: Record<string, string> = {
  owner: "bg-forge-amber/15 text-forge-amber",
  admin: "bg-primary/15 text-primary",
  editor: "bg-forge-cyan/15 text-forge-cyan",
  viewer: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-forge-emerald/15 text-forge-emerald",
  suspended: "bg-destructive/15 text-destructive",
  invited: "bg-forge-amber/15 text-forge-amber",
};

// ------- FEATURE FLAGS -------

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

// ------- SYSTEM METRICS -------

const systemMetrics = [
  { label: "Total Users", value: "1,247", change: "+12%", trend: "up", icon: Users },
  { label: "Projects Created", value: "3,891", change: "+8%", trend: "up", icon: Globe },
  { label: "Module Runs (24h)", value: "28,450", change: "+23%", trend: "up", icon: Zap },
  { label: "Stack Executions (24h)", value: "12,300", change: "+15%", trend: "up", icon: Activity },
  { label: "Avg Latency", value: "1.8s", change: "-12%", trend: "down", icon: Clock },
  { label: "Error Rate", value: "0.3%", change: "-0.1%", trend: "down", icon: AlertTriangle },
  { label: "CPU Usage", value: "42%", change: "+5%", trend: "up", icon: Cpu },
  { label: "Storage Used", value: "847 GB", change: "+3%", trend: "up", icon: HardDrive },
];

// ------- AUDIT LOGS -------

const auditLogs = [
  { id: "a1", user: "Alex Morgan", action: "Created project", target: "Marine Estimator v13", time: "2 min ago", type: "create" },
  { id: "a2", user: "Sarah Chen", action: "Updated module", target: "Red Team Critic", time: "15 min ago", type: "update" },
  { id: "a3", user: "James Wilson", action: "Ran stack", target: "Inventor Think Tank", time: "1 hour ago", type: "run" },
  { id: "a4", user: "Alex Morgan", action: "Deployed project", target: "Contractor Dashboard", time: "2 hours ago", type: "deploy" },
  { id: "a5", user: "Maria Garcia", action: "Created module", target: "Invoice Parser", time: "3 hours ago", type: "create" },
  { id: "a6", user: "Sarah Chen", action: "Invited user", target: "lisa@partner.io", time: "5 hours ago", type: "admin" },
  { id: "a7", user: "Alex Morgan", action: "Suspended user", target: "tom@example.com", time: "1 day ago", type: "admin" },
  { id: "a8", user: "Dev Patel", action: "Ran benchmark", target: "Marine Scope Summarizer", time: "1 day ago", type: "run" },
  { id: "a9", user: "James Wilson", action: "Exported code", target: "Field Inspection App", time: "2 days ago", type: "export" },
  { id: "a10", user: "Alex Morgan", action: "Changed plan", target: "Upgraded to Pro", time: "3 days ago", type: "billing" },
];

const actionTypeColors: Record<string, string> = {
  create: "text-forge-emerald",
  update: "text-primary",
  run: "text-forge-cyan",
  deploy: "text-forge-amber",
  admin: "text-forge-rose",
  export: "text-muted-foreground",
  billing: "text-forge-amber",
};

// ------- MAIN PAGE -------

export default function AdminPage() {
  const [userSearch, setUserSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [flags, setFlags] = useState(featureFlags.map((f) => ({ ...f })));

  const filteredUsers = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleFlag = (name: string) => {
    setFlags((prev) => prev.map((f) => f.name === name ? { ...f, enabled: !f.enabled } : f));
  };

  return (
    <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Badge variant="outline" className="text-[10px]">Owner</Badge>
      </div>

      <Tabs defaultValue="metrics" className="flex-1 flex flex-col min-h-0">
        <TabsList className="glass w-fit mb-4">
          <TabsTrigger value="metrics" className="text-xs gap-1.5"><BarChart3 className="h-3 w-3" /> System Metrics</TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1.5"><Users className="h-3 w-3" /> Users</TabsTrigger>
          <TabsTrigger value="flags" className="text-xs gap-1.5"><Settings className="h-3 w-3" /> Feature Flags</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1.5"><Activity className="h-3 w-3" /> Audit Log</TabsTrigger>
        </TabsList>

        {/* System Metrics */}
        <TabsContent value="metrics" className="flex-1 min-h-0 mt-0 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemMetrics.map((m, i) => {
              const Icon = m.icon;
              const isGood = (m.trend === "up" && !["Error Rate", "Avg Latency", "CPU Usage"].includes(m.label)) ||
                (m.trend === "down" && ["Error Rate", "Avg Latency"].includes(m.label));
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
                    <span className={cn("text-[10px] font-semibold flex items-center gap-0.5", isGood ? "text-forge-emerald" : "text-forge-rose")}>
                      <TrendingUp className={cn("h-3 w-3", m.trend === "down" && "rotate-180")} />
                      {m.change}
                    </span>
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
              { label: "CPU Usage", value: 42, color: "bg-primary" },
              { label: "Memory", value: 67, color: "bg-forge-amber" },
              { label: "Storage", value: 34, color: "bg-forge-cyan" },
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

        {/* Users */}
        <TabsContent value="users" className="flex-1 min-h-0 mt-0 overflow-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search users…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 h-9 text-sm glass" />
            </div>
            <Button size="sm" className="gradient-primary text-primary-foreground">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Invite User
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              {mockUsers.filter((u) => u.status === "active").length} active · {mockUsers.length} total
            </div>
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Projects</th>
                  <th className="p-3">Runs</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-[10px] text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3"><Badge className={cn("text-[10px] capitalize", roleColors[user.role])}>{user.role}</Badge></td>
                    <td className="p-3"><Badge className={cn("text-[10px] capitalize", statusColors[user.status])}>{user.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{user.projects}</td>
                    <td className="p-3 text-muted-foreground">{user.runs.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground text-xs">{user.lastActive}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Mail className="h-3 w-3" /></Button>
                        {user.role !== "owner" && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"><Ban className="h-3 w-3" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        {/* Audit Log */}
        <TabsContent value="audit" className="flex-1 min-h-0 mt-0 overflow-auto">
          <div className="space-y-1">
            {auditLogs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-lg px-4 py-3 flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {log.user.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-semibold">{log.user}</span>
                    {" "}
                    <span className={cn("font-medium", actionTypeColors[log.type])}>{log.action}</span>
                    {" "}
                    <span className="text-muted-foreground">{log.target}</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{log.time}</span>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
