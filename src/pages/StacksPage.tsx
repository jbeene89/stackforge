import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers } from "lucide-react";
import { mockStacks } from "@/data/mock-data";

export default function StacksPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Stacks</h1>
          <p className="text-sm text-muted-foreground">Your multi-AI orchestration workflows.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Stack</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockStacks.map((stack) => (
          <Link key={stack.id} to={`/stacks/${stack.id}`} className="glass rounded-xl p-5 hover:glow-primary transition-all group">
            <div className="flex items-start justify-between mb-3">
              <Layers className="h-5 w-5 text-forge-rose" />
              <Badge variant="outline" className="text-[10px]">{stack.nodes.length} nodes</Badge>
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{stack.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{stack.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>v{stack.versionCount}</span>
              <span>·</span>
              <span>{stack.edges.length} connections</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
