import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { mockStacks } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Plus, ZoomIn, ZoomOut, Maximize2, Play, Save,
  X, Brain, Shield, Zap, GitBranch, ArrowRight
} from "lucide-react";
import type { StackNode } from "@/types";

const nodeColors: Record<string, string> = {
  classifier: "border-forge-cyan bg-forge-cyan/10 text-forge-cyan",
  specialist: "border-primary bg-primary/10 text-primary",
  critic: "border-forge-rose bg-forge-rose/10 text-forge-rose",
  formatter: "border-forge-amber bg-forge-amber/10 text-forge-amber",
  synthesizer: "border-forge-emerald bg-forge-emerald/10 text-forge-emerald",
  router: "border-forge-cyan bg-forge-cyan/10 text-forge-cyan",
  evaluator: "border-primary bg-primary/10 text-primary",
  extractor: "border-forge-amber bg-forge-amber/10 text-forge-amber",
  comparator: "border-forge-rose bg-forge-rose/10 text-forge-rose",
  "human-gate": "border-forge-amber bg-forge-amber/10 text-forge-amber",
  "memory-filter": "border-muted-foreground bg-muted/30 text-muted-foreground",
  slm: "border-forge-cyan bg-forge-cyan/10 text-forge-cyan",
};

const nodeIcons: Record<string, typeof Brain> = {
  classifier: GitBranch,
  specialist: Brain,
  critic: Shield,
  formatter: ArrowRight,
  synthesizer: Zap,
  router: GitBranch,
  evaluator: Shield,
  extractor: Zap,
  comparator: Shield,
  "human-gate": Shield,
  "memory-filter": Brain,
  slm: Brain,
};

const nodeTypeOptions = [
  "classifier", "specialist", "critic", "formatter", "synthesizer",
  "router", "evaluator", "extractor", "comparator", "human-gate",
];

export default function StackCanvasPage() {
  const { id } = useParams();
  const stack = mockStacks.find((s) => s.id === id);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<StackNode | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [nodes, setNodes] = useState(stack?.nodes ?? []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  if (!stack) {
    return <div className="p-6 text-muted-foreground">Stack not found.</div>;
  }

  const handleZoom = (delta: number) => setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest("[data-canvas-bg]")) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    }
    if (dragging) {
      setNodes((prev) => prev.map((n) =>
        n.id === dragging ? { ...n, x: (e.clientX - dragOffset.current.x - pan.x) / zoom, y: (e.clientY - dragOffset.current.y - pan.y) / zoom } : n
      ));
    }
  };

  const handleCanvasMouseUp = () => {
    isPanning.current = false;
    setDragging(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: StackNode) => {
    e.stopPropagation();
    setSelectedNode(node);
    setDragging(node.id);
    const rect = (e.target as HTMLElement).closest("[data-node]")!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const addNode = (type: string) => {
    const newNode: StackNode = {
      id: `n${Date.now()}`,
      type: type as any,
      label: `New ${type}`,
      x: (300 - pan.x) / zoom,
      y: (200 - pan.y) / zoom,
      config: {},
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">{stack.name}</h1>
          <Badge variant="outline" className="text-[10px]">{nodes.length} nodes</Badge>
          <Badge variant="outline" className="text-[10px]">{stack.edges.length} edges</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-forge-emerald"><Play className="h-4 w-4 mr-1" /> Run</Button>
          <Button size="sm" className="gradient-primary text-primary-foreground"><Save className="h-4 w-4 mr-1" /> Save</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <div className="w-14 border-r border-border flex flex-col items-center py-3 gap-2">
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => handleZoom(0.1)}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => handleZoom(-0.1)}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={resetView}><Maximize2 className="h-4 w-4" /></Button>
          <Separator className="w-6" />
          <span className="text-[10px] text-muted-foreground font-mono">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative bg-background"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Grid pattern */}
          <div data-canvas-bg className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }} />

          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
            {/* Edges as SVG */}
            <svg className="absolute top-0 left-0 w-[2000px] h-[1000px] pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                </marker>
                <filter id="glow-edge">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {stack.edges.map((edge, i) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;
                const sx = source.x + 160, sy = source.y + 32;
                const tx = target.x, ty = target.y + 32;
                const mx = (sx + tx) / 2;
                const d = `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
                const isConnected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
                return (
                  <g key={edge.id}>
                    <motion.path
                      d={d}
                      stroke={isConnected ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={isConnected ? 2.5 : 2}
                      fill="none"
                      markerEnd="url(#arrowhead)"
                      filter={isConnected ? "url(#glow-edge)" : undefined}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    />
                    {edge.label && (
                      <motion.text
                        x={mx} y={Math.min(sy, ty) - 8}
                        textAnchor="middle" className="fill-muted-foreground" fontSize={9}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        {edge.label}
                      </motion.text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const Icon = nodeIcons[node.type] || Brain;
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  data-node
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  className={cn(
                    "absolute w-[160px] rounded-xl border-2 p-3 cursor-pointer transition-shadow select-none",
                    nodeColors[node.type] || "border-border bg-card",
                    isSelected && "ring-2 ring-primary shadow-lg"
                  )}
                  style={{ left: node.x, top: node.y }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-semibold truncate">{node.label}</span>
                  </div>
                  <span className="text-[10px] opacity-60">{node.type}</span>
                </div>
              );
            })}
          </div>

          {/* Add node dropdown */}
          <div className="absolute bottom-4 left-4 flex gap-1.5 flex-wrap max-w-[300px]">
            {nodeTypeOptions.map((type) => (
              <Button key={type} variant="outline" size="sm" className="text-[10px] h-6 px-2 glass" onClick={() => addNode(type)}>
                <Plus className="h-3 w-3 mr-1" />{type}
              </Button>
            ))}
          </div>
        </div>

        {/* Inspector */}
        {selectedNode && (
          <div className="w-[300px] border-l border-border bg-muted/30 flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Node Inspector</h3>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedNode(null)}><X className="h-3 w-3" /></Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Label</label>
                  <div className="glass rounded-lg px-3 py-2 text-sm">{selectedNode.label}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Type</label>
                  <Badge className={cn("text-[10px]", nodeColors[selectedNode.type])}>{selectedNode.type}</Badge>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Position</label>
                  <div className="text-xs font-mono text-muted-foreground">x: {Math.round(selectedNode.x)}, y: {Math.round(selectedNode.y)}</div>
                </div>
                {selectedNode.moduleId && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Linked Module</label>
                    <div className="glass rounded-lg px-3 py-2 text-xs text-primary">{selectedNode.moduleId}</div>
                  </div>
                )}
                <Separator />
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Incoming Edges</label>
                  {stack.edges.filter((e) => e.target === selectedNode.id).map((e) => (
                    <div key={e.id} className="text-xs glass rounded px-2 py-1">{nodes.find((n) => n.id === e.source)?.label} → here</div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Outgoing Edges</label>
                  {stack.edges.filter((e) => e.source === selectedNode.id).map((e) => (
                    <div key={e.id} className="text-xs glass rounded px-2 py-1">here → {nodes.find((n) => n.id === e.target)?.label}</div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
