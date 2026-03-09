import { useState } from "react";
import { useParams } from "react-router-dom";
import { mockProjects } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send, FolderTree, FileCode, Eye, Database, Settings, Activity,
  ChevronRight, ChevronDown, File, Folder, Plus, Smartphone
} from "lucide-react";

const mockFiles = [
  { name: "src", type: "folder" as const, children: [
    { name: "components", type: "folder" as const, children: [
      { name: "Header.tsx", type: "file" as const, lang: "tsx" },
      { name: "Sidebar.tsx", type: "file" as const, lang: "tsx" },
      { name: "Dashboard.tsx", type: "file" as const, lang: "tsx" },
      { name: "LeadTable.tsx", type: "file" as const, lang: "tsx" },
    ]},
    { name: "pages", type: "folder" as const, children: [
      { name: "index.tsx", type: "file" as const, lang: "tsx" },
      { name: "leads.tsx", type: "file" as const, lang: "tsx" },
      { name: "estimates.tsx", type: "file" as const, lang: "tsx" },
    ]},
    { name: "App.tsx", type: "file" as const, lang: "tsx" },
    { name: "main.tsx", type: "file" as const, lang: "tsx" },
  ]},
  { name: "public", type: "folder" as const, children: [
    { name: "index.html", type: "file" as const, lang: "html" },
  ]},
  { name: "package.json", type: "file" as const, lang: "json" },
];

const mockCode = `import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  name: string;
  email: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "closed";
  value: number;
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<string>("all");
  
  const filtered = filter === "all" 
    ? leads 
    : leads.filter(l => l.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["all", "new", "contacted", "qualified", "proposal", "closed"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={\`px-3 py-1 rounded-full text-sm \${filter === s ? "bg-primary text-white" : "bg-muted"}\`}>
            {s}
          </button>
        ))}
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-muted-foreground">
            <th className="pb-2">Name</th>
            <th className="pb-2">Email</th>
            <th className="pb-2">Status</th>
            <th className="pb-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(lead => (
            <tr key={lead.id} className="border-t border-border">
              <td className="py-2 font-medium">{lead.name}</td>
              <td className="py-2 text-muted-foreground">{lead.email}</td>
              <td className="py-2"><Badge>{lead.status}</Badge></td>
              <td className="py-2 text-right font-mono">\${lead.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`;

const mockSchema = [
  { table: "leads", columns: ["id (uuid)", "name (text)", "email (text)", "status (enum)", "value (numeric)", "created_at (timestamp)"] },
  { table: "estimates", columns: ["id (uuid)", "lead_id (uuid → leads)", "amount (numeric)", "line_items (jsonb)", "status (enum)", "created_at (timestamp)"] },
  { table: "proposals", columns: ["id (uuid)", "estimate_id (uuid → estimates)", "content (text)", "sent_at (timestamp)", "opened_at (timestamp)"] },
];

interface FileNode { name: string; type: "file" | "folder"; lang?: string; children?: FileNode[] }

function FileTreeItem({ node, depth = 0, selected, onSelect }: { node: FileNode; depth?: number; selected: string; onSelect: (name: string) => void }) {
  const [open, setOpen] = useState(depth < 2);
  if (node.type === "folder") {
    return (
      <div>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full hover:bg-muted/50 rounded px-2 py-1 text-xs" style={{ paddingLeft: depth * 12 + 8 }}>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Folder className="h-3 w-3 text-forge-amber" />
          <span>{node.name}</span>
        </button>
        {open && node.children?.map((c) => <FileTreeItem key={c.name} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />)}
      </div>
    );
  }
  return (
    <button onClick={() => onSelect(node.name)} className={`flex items-center gap-1.5 w-full rounded px-2 py-1 text-xs ${selected === node.name ? "bg-primary/10 text-primary" : "hover:bg-muted/50"}`} style={{ paddingLeft: depth * 12 + 8 }}>
      <File className="h-3 w-3 text-muted-foreground" />
      <span>{node.name}</span>
    </button>
  );
}

export default function ProjectPage() {
  const { id } = useParams();
  const project = mockProjects.find((p) => p.id === id);
  const [prompt, setPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState("LeadTable.tsx");
  const isAndroid = project?.type === "android";

  if (!project) {
    return <div className="p-6 text-muted-foreground">Project not found.</div>;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {isAndroid ? <Smartphone className="h-5 w-5 text-forge-emerald" /> : <FolderTree className="h-5 w-5 text-primary" />}
          <h1 className="text-lg font-bold">{project.name}</h1>
          <Badge variant="secondary" className="text-[10px]">{project.type}</Badge>
          <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">v{project.versionCount}</span>
          <Button size="sm" className="gradient-primary text-primary-foreground">Deploy</Button>
        </div>
      </div>

      {/* Prompt bar */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isAndroid ? "Describe the screen or feature you want to build..." : "Describe what you want to build or change..."}
            className="h-9 text-sm"
          />
          <Button size="sm" className="gradient-primary text-primary-foreground px-4"><Send className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Workspace */}
      <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-6 mt-2 glass w-fit">
          <TabsTrigger value="preview"><Eye className="h-3 w-3 mr-1" /> Preview</TabsTrigger>
          <TabsTrigger value="code"><FileCode className="h-3 w-3 mr-1" /> Code</TabsTrigger>
          <TabsTrigger value="database"><Database className="h-3 w-3 mr-1" /> Database</TabsTrigger>
          <TabsTrigger value="runs"><Activity className="h-3 w-3 mr-1" /> Runs</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-3 w-3 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 m-0 mt-2 px-6 pb-4">
          {isAndroid ? (
            <div className="h-full flex items-center justify-center">
              {/* Android device frame */}
              <div className="relative">
                <div className="w-[320px] h-[640px] rounded-[40px] border-[6px] border-foreground/20 bg-background overflow-hidden shadow-2xl">
                  <div className="h-8 bg-foreground/5 flex items-center justify-center">
                    <div className="w-20 h-1.5 bg-foreground/10 rounded-full" />
                  </div>
                  <div className="flex-1 p-4 space-y-3">
                    <div className="text-sm font-bold">Field Inspection</div>
                    <div className="space-y-2">
                      {["Site A — Dock 4", "Site B — Pier 7", "Site C — Bridge Support"].map((item) => (
                        <div key={item} className="glass rounded-lg p-3 text-xs">{item}<br /><span className="text-muted-foreground">Pending inspection</span></div>
                      ))}
                    </div>
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-6">
                      {["📋", "📷", "📍", "⚙️"].map((icon) => (
                        <div key={icon} className="w-10 h-10 glass rounded-full flex items-center justify-center text-lg">{icon}</div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Screen selector */}
                <div className="mt-4 flex gap-2 justify-center">
                  {["Home", "Checklist", "Camera", "Map"].map((s, i) => (
                    <Button key={s} variant={i === 0 ? "default" : "outline"} size="sm" className="text-[10px] h-6">{s}</Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="glass-strong rounded-xl p-8 mx-auto max-w-2xl">
                  <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-forge-rose" />
                    <div className="w-2.5 h-2.5 rounded-full bg-forge-amber" />
                    <div className="w-2.5 h-2.5 rounded-full bg-forge-emerald" />
                    <span className="text-[10px] text-muted-foreground ml-2">localhost:3000</span>
                  </div>
                  <div className="text-left space-y-3">
                    <div className="h-8 w-full bg-muted rounded animate-pulse" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-20 bg-muted rounded animate-pulse" />
                      <div className="h-20 bg-muted rounded animate-pulse" />
                      <div className="h-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Live preview — describe your app in the prompt bar above</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 mt-2 overflow-hidden">
          <div className="flex h-full mx-6 mb-4 glass rounded-xl overflow-hidden">
            {/* File tree */}
            <div className="w-56 border-r border-border py-2">
              <ScrollArea className="h-full">
                {mockFiles.map((f) => (
                  <FileTreeItem key={f.name} node={f} selected={selectedFile} onSelect={setSelectedFile} />
                ))}
              </ScrollArea>
            </div>
            {/* Code viewer */}
            <div className="flex-1 overflow-hidden">
              <div className="h-8 border-b border-border flex items-center px-3 gap-2">
                <Badge variant="secondary" className="text-[10px] h-5">{selectedFile}</Badge>
                <span className="text-[10px] text-muted-foreground">tsx</span>
              </div>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <pre className="p-4 text-xs font-mono leading-relaxed text-foreground">
                  {mockCode.split("\n").map((line, i) => (
                    <div key={i} className="flex">
                      <span className="w-8 text-right pr-4 text-muted-foreground select-none">{i + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="database" className="flex-1 m-0 mt-2 px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {mockSchema.map((table) => (
              <div key={table.table} className="glass rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">{table.table}</h3>
                </div>
                <Separator />
                {table.columns.map((col) => (
                  <div key={col} className="text-xs text-muted-foreground font-mono pl-2 border-l-2 border-border">{col}</div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-[10px] h-7"><Plus className="h-3 w-3 mr-1" /> Add Column</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="runs" className="flex-1 m-0 mt-2 px-6 pb-4">
          <div className="glass rounded-xl p-6 flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <Activity className="h-8 w-8 mx-auto animate-glow-pulse" />
              <p className="text-sm">No runs yet</p>
              <p className="text-[10px]">Deploy or test your app to see execution logs here</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 mt-2 px-6 pb-4">
          <div className="glass rounded-xl p-6 max-w-2xl space-y-4">
            <h2 className="font-semibold">Project Settings</h2>
            <div className="space-y-3">
              <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Project Name</label><Input defaultValue={project.name} className="h-8 text-sm" /></div>
              <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Description</label><Input defaultValue={project.description} className="h-8 text-sm" /></div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Tags</label>
                <div className="flex gap-1.5 flex-wrap">{project.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Export ZIP</Button>
              <Button variant="outline" size="sm">Export JSON</Button>
              <Button variant="destructive" size="sm">Delete Project</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
