import { useState, useRef } from "react";
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
import type { StackNode, StackEdge } from "@/types";

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

const NODE_W = 160;
const NODE_H = 64;
const PORT_R = 6;

export default function StackCanvasPage() {
  const { id } = useParams();
  const stack = mockStacks.find((s) => s.id === id);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<StackNode | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [nodes, setNodes] = useState(stack?.nodes ?? []);
  const [edges, setEdges] = useState<StackEdge[]>(stack?.edges ?? []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });

  // Edge creation state
  const [edgeDrag, setEdgeDrag] = useState<{ sourceId: string; mouseX: number; mouseY: number } | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; side: "in" | "out" } | null>(null);

  if (!stack) {
    return <div className="p-6 text-muted-foreground">Stack not found.</div>;
  }

  const handleZoom = (delta: number) => setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Convert screen coords to canvas coords
  const screenToCanvas = (clientX: number, clientY: number) => ({
    x: (clientX - pan.x) / zoom,
    y: (clientY - pan.y) / zoom,
  });

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
    if (edgeDrag) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setEdgeDrag((prev) => prev ? { ...prev, mouseX: canvasPos.x, mouseY: canvasPos.y } : null);
    }
  };

  const handleCanvasMouseUp = () => {
    isPanning.current = false;
    setDragging(null);

    // Complete edge creation if hovering over an input port
    if (edgeDrag && hoveredPort && hoveredPort.side === "in" && hoveredPort.nodeId !== edgeDrag.sourceId) {
      const alreadyExists = edges.some(
        (e) => e.source === edgeDrag.sourceId && e.target === hoveredPort.nodeId
      );
      if (!alreadyExists) {
        const newEdge: StackEdge = {
          id: `e${Date.now()}`,
          source: edgeDrag.sourceId,
          target: hoveredPort.nodeId,
        };
        setEdges((prev) => [...prev, newEdge]);
      }
    }
    setEdgeDrag(null);
    setHoveredPort(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: StackNode) => {
    e.stopPropagation();
    setSelectedNode(node);
    setDragging(node.id);
    const rect = (e.target as HTMLElement).closest("[data-node]")!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleOutputPortMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setEdgeDrag({ sourceId: nodeId, mouseX: canvasPos.x, mouseY: canvasPos.y });
  };

  const handleInputPortMouseEnter = (nodeId: string) => {
    if (edgeDrag && nodeId !== edgeDrag.sourceId) {
      setHoveredPort({ nodeId, side: "in" });
    }
  };

  const handleInputPortMouseLeave = () => {
    setHoveredPort(null);
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

  const getOutputPortPos = (node: StackNode) => ({ x: node.x + NODE_W, y: node.y + NODE_H / 2 });
  const getInputPortPos = (node: StackNode) => ({ x: node.x, y: node.y + NODE_H / 2 });

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <GitBranch className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">{stack.name}</h1>
          <Badge variant="outline" className="text-[10px]">{nodes.length} nodes</Badge>
          <Badge variant="outline" className="text-[10px]">{edges.length} edges</Badge>
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
          className={cn(
            "flex-1 overflow-hidden relative bg-background",
            edgeDrag ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
          )}
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
            <svg className="absolute top-0 left-0 w-[2000px] h-[1000px] pointer-events-none" style={{ overflow: "visible" }}>
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                </marker>
                <marker id="arrowhead-active" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--primary))" opacity="0.8" />
                </marker>
                <filter id="glow-edge">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Existing edges */}
              {edges.map((edge, i) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;
                const sp = getOutputPortPos(source);
                const tp = getInputPortPos(target);
                const mx = (sp.x + tp.x) / 2;
                const d = `M${sp.x},${sp.y} C${mx},${sp.y} ${mx},${tp.y} ${tp.x},${tp.y}`;
                const isConnected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
                return (
                  <g key={edge.id}>
                    <motion.path
                      d={d}
                      stroke={isConnected ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={isConnected ? 2.5 : 2}
                      fill="none"
                      markerEnd={isConnected ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                      filter={isConnected ? "url(#glow-edge)" : undefined}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    />
                    {edge.label && (
                      <motion.text
                        x={mx} y={Math.min(sp.y, tp.y) - 8}
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

              {/* Dragging edge preview */}
              {edgeDrag && (() => {
                const sourceNode = nodes.find((n) => n.id === edgeDrag.sourceId);
                if (!sourceNode) return null;
                const sp = getOutputPortPos(sourceNode);
                const tx = edgeDrag.mouseX;
                const ty = edgeDrag.mouseY;
                const mx = (sp.x + tx) / 2;
                const isSnapped = hoveredPort && hoveredPort.side === "in";
                let finalX = tx, finalY = ty;
                if (isSnapped) {
                  const targetNode = nodes.find((n) => n.id === hoveredPort.nodeId);
                  if (targetNode) {
                    const tp = getInputPortPos(targetNode);
                    finalX = tp.x;
                    finalY = tp.y;
                  }
                }
                const fmx = (sp.x + finalX) / 2;
                return (
                  <motion.path
                    d={`M${sp.x},${sp.y} C${fmx},${sp.y} ${fmx},${finalY} ${finalX},${finalY}`}
                    stroke={isSnapped ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    strokeWidth={2}
                    strokeDasharray={isSnapped ? "0" : "6 4"}
                    fill="none"
                    filter={isSnapped ? "url(#glow-edge)" : undefined}
                    markerEnd={isSnapped ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  />
                );
              })()}
            </svg>

            {/* Nodes */}
            <AnimatePresence>
              {nodes.map((node, i) => {
                const Icon = nodeIcons[node.type] || Brain;
                const isSelected = selectedNode?.id === node.id;
                const isEdgeSource = edgeDrag?.sourceId === node.id;
                const isHoveredTarget = hoveredPort?.nodeId === node.id && hoveredPort.side === "in";
                return (
                  <motion.div
                    key={node.id}
                    data-node
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      boxShadow: isSelected
                        ? "0 0 20px 4px hsl(var(--primary) / 0.35), 0 0 40px 8px hsl(var(--primary) / 0.15)"
                        : "0 0 0px 0px transparent",
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      scale: { type: "spring", stiffness: 400, damping: 25, delay: i * 0.05 },
                      opacity: { duration: 0.2, delay: i * 0.05 },
                      boxShadow: { duration: 0.3 },
                    }}
                    whileHover={!edgeDrag ? { scale: 1.05, transition: { duration: 0.15 } } : {}}
                    whileTap={!edgeDrag ? { scale: 0.97 } : {}}
                    onMouseDown={(e) => !edgeDrag && handleNodeMouseDown(e, node)}
                    className={cn(
                      "absolute rounded-xl border-2 p-3 cursor-pointer select-none",
                      nodeColors[node.type] || "border-border bg-card",
                      isSelected && "ring-2 ring-primary",
                      isHoveredTarget && "ring-2 ring-primary/60"
                    )}
                    style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div
                        animate={isSelected ? { rotate: [0, -10, 10, 0] } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                      </motion.div>
                      <span className="text-xs font-semibold truncate">{node.label}</span>
                    </div>
                    <span className="text-[10px] opacity-60">{node.type}</span>

                    {/* Input port (left) */}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 transition-all duration-150 z-10",
                        isHoveredTarget
                          ? "w-4 h-4 bg-primary border-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.5)]"
                          : edgeDrag
                            ? "w-3.5 h-3.5 bg-muted border-primary/40 hover:bg-primary/30 hover:border-primary"
                            : "w-2.5 h-2.5 bg-muted border-border hover:w-3.5 hover:h-3.5 hover:border-primary/60"
                      )}
                      style={{ left: 0 }}
                      onMouseEnter={() => handleInputPortMouseEnter(node.id)}
                      onMouseLeave={handleInputPortMouseLeave}
                    />

                    {/* Output port (right) */}
                    <div
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border-2 transition-all duration-150 z-10 cursor-crosshair",
                        isEdgeSource
                          ? "w-4 h-4 bg-primary border-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.5)]"
                          : "w-2.5 h-2.5 bg-muted border-border hover:w-3.5 hover:h-3.5 hover:bg-primary/30 hover:border-primary"
                      )}
                      style={{ right: 0 }}
                      onMouseDown={(e) => handleOutputPortMouseDown(e, node.id)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
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
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-l border-border bg-muted/30 flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between min-w-[300px]">
                <h3 className="text-sm font-semibold">Node Inspector</h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedNode(null)}><X className="h-3 w-3" /></Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3 min-w-[300px]">
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
                    {edges.filter((e) => e.target === selectedNode.id).map((e) => (
                      <div key={e.id} className="text-xs glass rounded px-2 py-1">{nodes.find((n) => n.id === e.source)?.label} → here</div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Outgoing Edges</label>
                    {edges.filter((e) => e.source === selectedNode.id).map((e) => (
                      <div key={e.id} className="text-xs glass rounded px-2 py-1">here → {nodes.find((n) => n.id === e.target)?.label}</div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
