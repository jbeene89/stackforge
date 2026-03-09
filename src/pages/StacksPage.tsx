import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Layers, Trash2 } from "lucide-react";
import { useStacks, useCreateStack, useDeleteStack } from "@/hooks/useSupabaseData";

export default function StacksPage() {
  const { data: stacks, isLoading } = useStacks();
  const createStack = useCreateStack();
  const deleteStack = useDeleteStack();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createStack.mutate(
      { name, description },
      { onSuccess: () => { setOpen(false); setName(""); setDescription(""); } }
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Stacks</h1>
          <p className="text-sm text-muted-foreground">Your multi-AI orchestration workflows.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Stack</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Stack</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Document Pipeline" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the workflow…" rows={3} />
              </div>
              <Button onClick={handleCreate} disabled={!name.trim() || createStack.isPending} className="w-full">
                {createStack.isPending ? "Creating…" : "Create Stack"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !stacks?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No stacks yet. Create your first AI stack.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stacks.map((stack) => {
            const nodes = Array.isArray(stack.nodes) ? stack.nodes : [];
            const edges = Array.isArray(stack.edges) ? stack.edges : [];
            return (
              <div key={stack.id} className="glass rounded-xl p-5 hover:glow-primary transition-all group relative">
                <Link to={`/stacks/${stack.id}`} className="absolute inset-0 z-0" />
                <div className="flex items-start justify-between mb-3">
                  <Layers className="h-5 w-5 text-forge-rose" />
                  <div className="flex items-center gap-1 z-10">
                    <Badge variant="outline" className="text-[10px]">{nodes.length} nodes</Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.preventDefault(); deleteStack.mutate(stack.id); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{stack.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{stack.description || "No description"}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>v{stack.version_count}</span>
                  <span>·</span>
                  <span>{edges.length} connections</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
