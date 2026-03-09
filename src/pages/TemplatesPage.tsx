import { Badge } from "@/components/ui/badge";
import { mockTemplates } from "@/data/mock-data";
import { Globe, Smartphone, Brain, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const categoryIcons: Record<string, React.ElementType> = { web: Globe, android: Smartphone, module: Brain, stack: Layers };
const tabs = ["all", "web", "android", "module", "stack"];

export default function TemplatesPage() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? mockTemplates : mockTemplates.filter((t) => t.category === filter);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-sm text-muted-foreground">Start from a proven blueprint.</p>
      </div>
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
        {tabs.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize", filter === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl) => {
          const Icon = categoryIcons[tpl.category];
          return (
            <div key={tpl.id} className="glass rounded-xl p-5 hover:glow-primary transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <Icon className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-[10px] capitalize">{tpl.category}</Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1">{tpl.name}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
