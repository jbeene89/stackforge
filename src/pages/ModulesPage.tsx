import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Brain } from "lucide-react";
import { mockModules } from "@/data/mock-data";

export default function ModulesPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Modules</h1>
          <p className="text-sm text-muted-foreground">Your narrow-purpose AI specialists.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Module</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockModules.map((mod) => (
          <Link key={mod.id} to={`/modules/${mod.id}`} className="glass rounded-xl p-5 hover:glow-primary transition-all group">
            <div className="flex items-start justify-between mb-3">
              <Brain className="h-5 w-5 text-forge-amber" />
              {mod.slmMode && <Badge variant="secondary" className="text-[10px] bg-forge-cyan/15 text-forge-cyan">SLM</Badge>}
            </div>
            <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{mod.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{mod.role}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{mod.type}</Badge>
              <span className="text-[10px] text-muted-foreground">v{mod.versionCount}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
