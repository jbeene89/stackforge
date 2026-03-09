import { useParams } from "react-router-dom";
import { mockStacks } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const nodeColors: Record<string, string> = {
  classifier: "border-forge-cyan bg-forge-cyan/10",
  specialist: "border-primary bg-primary/10",
  critic: "border-forge-rose bg-forge-rose/10",
  formatter: "border-forge-amber bg-forge-amber/10",
  synthesizer: "border-forge-emerald bg-forge-emerald/10",
  router: "border-forge-cyan bg-forge-cyan/10",
  evaluator: "border-primary bg-primary/10",
  extractor: "border-forge-amber bg-forge-amber/10",
  comparator: "border-forge-rose bg-forge-rose/10",
  "human-gate": "border-forge-amber bg-forge-amber/10",
  "memory-filter": "border-muted bg-muted/10",
  slm: "border-forge-cyan bg-forge-cyan/10",
};

export default function StackCanvasPage() {
  const { id } = useParams();
  const stack = mockStacks.find((s) => s.id === id);

  if (!stack) {
    return <div className="p-6 text-muted-foreground">Stack not found.</div>;
  }

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{stack.name}</h1>
        <Badge variant="outline">{stack.nodes.length} nodes</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{stack.description}</p>

      {/* Simple canvas representation */}
      <div className="glass rounded-xl p-6 overflow-auto">
        <svg width="1000" height="450" className="min-w-[1000px]">
          {/* Edges */}
          {stack.edges.map((edge) => {
            const source = stack.nodes.find((n) => n.id === edge.source);
            const target = stack.nodes.find((n) => n.id === edge.target);
            if (!source || !target) return null;
            return (
              <line
                key={edge.id}
                x1={source.x + 75}
                y1={source.y + 25}
                x2={target.x}
                y2={target.y + 25}
                stroke="hsl(var(--border))"
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
            );
          })}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--muted-foreground))" />
            </marker>
          </defs>
          {/* Nodes */}
          {stack.nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={150}
                height={50}
                rx={10}
                className={cn("stroke-2 fill-card", nodeColors[node.type])}
                stroke="currentColor"
              />
              <text x={node.x + 75} y={node.y + 20} textAnchor="middle" className="text-xs fill-foreground font-medium" fontSize={11}>
                {node.label}
              </text>
              <text x={node.x + 75} y={node.y + 36} textAnchor="middle" className="text-[10px] fill-muted-foreground" fontSize={9}>
                {node.type}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
