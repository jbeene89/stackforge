import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Brain, Trash2 } from "lucide-react";
import { useModules, useCreateModule, useDeleteModule } from "@/hooks/useSupabaseData";

export default function ModulesPage() {
  const { data: modules, isLoading } = useModules();
  const createModule = useCreateModule();
  const deleteModule = useDeleteModule();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("specialist");
  const [role, setRole] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createModule.mutate(
      { name, type: type as any, role },
      { onSuccess: () => { setOpen(false); setName(""); setRole(""); } }
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Modules</h1>
          <p className="text-sm text-muted-foreground">Your narrow-purpose AI specialists.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Module</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Module</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Scope Analyzer" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["specialist","slm","router","evaluator","critic","comparator","formatter","extractor","classifier","memory-filter","human-gate","synthesizer"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Classifies construction scopes" />
              </div>
              <Button onClick={handleCreate} disabled={!name.trim() || createModule.isPending} className="w-full">
                {createModule.isPending ? "Creating…" : "Create Module"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !modules?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No modules yet. Create your first AI module.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div key={mod.id} className="glass rounded-xl p-5 hover:glow-primary transition-all group relative">
              <Link to={`/modules/${mod.id}`} className="absolute inset-0 z-0" />
              <div className="flex items-start justify-between mb-3">
                <Brain className="h-5 w-5 text-forge-amber" />
                <div className="flex items-center gap-1 z-10">
                  {mod.slm_mode && <Badge variant="secondary" className="text-[10px] bg-forge-cyan/15 text-forge-cyan">SLM</Badge>}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.preventDefault(); deleteModule.mutate(mod.id); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{mod.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{mod.role || "No role defined"}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{mod.type}</Badge>
                <span className="text-[10px] text-muted-foreground">v{mod.version_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
