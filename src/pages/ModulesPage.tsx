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
import { motion } from "framer-motion";

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
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">AI Modules</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Your narrow-purpose AI specialists.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> New Module</Button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !modules?.length ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-forge-amber/5 flex items-center justify-center">
            <Brain className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No modules yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first AI module.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-hover rounded-xl p-4 sm:p-5 group relative"
            >
              <Link to={`/modules/${mod.id}`} className="absolute inset-0 z-0" />
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-forge-amber/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-forge-amber" />
                </div>
                <div className="flex items-center gap-1 z-10">
                  {mod.slm_mode && <Badge variant="secondary" className="text-[10px] bg-forge-cyan/15 text-forge-cyan">SLM</Badge>}
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
