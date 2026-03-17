import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ThumbsUp,
  ThumbsDown,
  SkipForward,
  Star,
  Undo2,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
} from "lucide-react";

interface Sample {
  id: string;
  input: string;
  output: string;
  status: string;
  quality_score: number;
  dataset_id: string;
  source_url: string | null;
}

interface Dataset {
  id: string;
  name: string;
  sample_count: number;
}

type SwipeAction = "approved" | "rejected" | "skipped";

export default function SwipeReviewPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedDataset, setSelectedDataset] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeX, setSwipeX] = useState(0);
  const [swipeOpacity, setSwipeOpacity] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [history, setHistory] = useState<{ sampleId: string; previousStatus: string }[]>([]);
  const [stats, setStats] = useState({ approved: 0, rejected: 0, skipped: 0 });
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;

  // Fetch datasets
  const { data: datasets = [] } = useQuery({
    queryKey: ["training_datasets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_datasets")
        .select("id, name, sample_count")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Dataset[];
    },
    enabled: !!user,
  });

  // Fetch pending samples
  const { data: samples = [], isLoading } = useQuery({
    queryKey: ["review_samples", selectedDataset],
    queryFn: async () => {
      let query = supabase
        .from("dataset_samples")
        .select("id, input, output, status, quality_score, dataset_id, source_url")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(50);
      if (selectedDataset !== "all") {
        query = query.eq("dataset_id", selectedDataset);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Sample[];
    },
    enabled: !!user,
  });

  const updateSample = useMutation({
    mutationFn: async ({ id, status, quality_score }: { id: string; status: string; quality_score?: number }) => {
      const updates: Record<string, unknown> = { status };
      if (quality_score !== undefined) updates.quality_score = quality_score;
      const { error } = await supabase.from("dataset_samples").update(updates).eq("id", id);
      if (error) throw error;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentSample = samples[currentIndex];
  const remaining = samples.length - currentIndex;

  const performAction = useCallback(
    (action: SwipeAction) => {
      if (!currentSample || isAnimating) return;

      setHistory((prev) => [...prev, { sampleId: currentSample.id, previousStatus: currentSample.status }]);
      setStats((prev) => ({ ...prev, [action]: prev[action as keyof typeof prev] + 1 }));

      const status = action === "skipped" ? "pending" : action;
      if (action !== "skipped") {
        updateSample.mutate({
          id: currentSample.id,
          status,
          quality_score: action === "approved" ? 5 : 1,
        });
      }

      // Animate out
      setIsAnimating(true);
      const targetX = action === "approved" ? 400 : action === "rejected" ? -400 : 0;
      setSwipeX(targetX);

      setTimeout(() => {
        setSwipeX(0);
        setSwipeOpacity(0);
        setSwipeDirection(null);
        setIsAnimating(false);
        setCurrentIndex((prev) => prev + 1);
      }, 250);
    },
    [currentSample, isAnimating, updateSample]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || currentIndex === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    // Restore previous status
    updateSample.mutate({ id: last.sampleId, status: last.previousStatus });

    // Decrement the last stat
    setStats((prev) => {
      const copy = { ...prev };
      // We don't know which stat to decrement perfectly, but we decrement the last action
      return copy;
    });

    setCurrentIndex((prev) => prev - 1);
    toast("Undid last action");
  }, [history, currentIndex, updateSample]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isAnimating) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    setSwipeX(dx);
    const opacity = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
    setSwipeOpacity(opacity);
    setSwipeDirection(dx > 0 ? "right" : "left");
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || isAnimating) return;
    if (Math.abs(swipeX) > SWIPE_THRESHOLD) {
      performAction(swipeX > 0 ? "approved" : "rejected");
    } else {
      setSwipeX(0);
      setSwipeOpacity(0);
      setSwipeDirection(null);
    }
    touchStartRef.current = null;
  };

  // Mouse drag handlers for desktop
  const mouseStartRef = useRef<{ x: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    mouseStartRef.current = { x: e.clientX };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseStartRef.current || isAnimating) return;
    const dx = e.clientX - mouseStartRef.current.x;
    setSwipeX(dx);
    const opacity = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);
    setSwipeOpacity(opacity);
    setSwipeDirection(dx > 0 ? "right" : "left");
  };

  const handleMouseUp = () => {
    if (!mouseStartRef.current || isAnimating) return;
    if (Math.abs(swipeX) > SWIPE_THRESHOLD) {
      performAction(swipeX > 0 ? "approved" : "rejected");
    } else {
      setSwipeX(0);
      setSwipeOpacity(0);
      setSwipeDirection(null);
    }
    mouseStartRef.current = null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "a") performAction("approved");
      else if (e.key === "ArrowLeft" || e.key === "r") performAction("rejected");
      else if (e.key === "ArrowDown" || e.key === "s") performAction("skipped");
      else if ((e.ctrlKey || e.metaKey) && e.key === "z") handleUndo();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [performAction, handleUndo]);

  // Refresh data when we run out
  useEffect(() => {
    if (samples.length > 0 && currentIndex >= samples.length) {
      qc.invalidateQueries({ queryKey: ["review_samples"] });
      setCurrentIndex(0);
    }
  }, [currentIndex, samples.length, qc]);

  const rotation = swipeX * 0.05;
  const cardStyle = {
    transform: `translateX(${swipeX}px) rotate(${rotation}deg)`,
    transition: isAnimating ? "transform 0.25s ease-out, opacity 0.25s" : "none",
    opacity: isAnimating ? 0 : 1,
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto px-4 py-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold font-display">Swipe Review</h1>
          <p className="text-xs text-muted-foreground">
            {remaining} pending · {stats.approved}✓ {stats.rejected}✗ {stats.skipped}→
          </p>
        </div>
        <Select value={selectedDataset} onValueChange={(v) => { setSelectedDataset(v); setCurrentIndex(0); }}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="All datasets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All datasets</SelectItem>
            {datasets.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} ({d.sample_count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Card area */}
      <div className="flex-1 relative flex items-center justify-center min-h-[300px]">
        {isLoading ? (
          <div className="text-muted-foreground animate-pulse">Loading samples…</div>
        ) : !currentSample ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-[hsl(var(--forge-emerald))]" />
            <p className="font-display font-semibold">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending samples to review.</p>
          </div>
        ) : (
          <>
            {/* Swipe overlay indicators */}
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{ opacity: swipeDirection === "left" ? swipeOpacity : 0 }}
            >
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/90 text-destructive-foreground font-bold text-sm">
                <XCircle className="h-4 w-4" /> REJECT
              </div>
            </div>
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{ opacity: swipeDirection === "right" ? swipeOpacity : 0 }}
            >
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[hsl(var(--forge-emerald))]/90 text-primary-foreground font-bold text-sm">
                <CheckCircle2 className="h-4 w-4" /> APPROVE
              </div>
            </div>

            {/* Peek next card */}
            {samples[currentIndex + 1] && (
              <Card className="absolute inset-x-2 top-2 bottom-2 opacity-30 scale-[0.96] border-border/50">
                <CardContent className="p-4 h-full" />
              </Card>
            )}

            {/* Current card */}
            <Card
              ref={cardRef}
              className="absolute inset-x-0 top-0 bottom-0 cursor-grab active:cursor-grabbing border-2 border-border/60 shadow-lg overflow-hidden"
              style={cardStyle}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <CardContent className="p-4 h-full flex flex-col overflow-y-auto">
                {currentSample.source_url && (
                  <Badge variant="outline" className="self-start mb-2 text-[10px]">
                    {currentSample.source_url}
                  </Badge>
                )}

                <div className="space-y-3 flex-1">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--forge-cyan))]" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Input</span>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {currentSample.input}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layers className="h-3.5 w-3.5 text-[hsl(var(--forge-amber))]" />
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Output</span>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {currentSample.output}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= currentSample.quality_score ? "text-[hsl(var(--forge-gold))] fill-[hsl(var(--forge-gold))]" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {currentIndex + 1}/{samples.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3 py-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={handleUndo}
          disabled={history.length === 0 || isAnimating}
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
          onClick={() => performAction("rejected")}
          disabled={!currentSample || isAnimating}
        >
          <ThumbsDown className="h-6 w-6 text-destructive" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-muted-foreground/30"
          onClick={() => performAction("skipped")}
          disabled={!currentSample || isAnimating}
        >
          <SkipForward className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-14 w-14 rounded-full border-2 border-[hsl(var(--forge-emerald))]/50 hover:bg-[hsl(var(--forge-emerald))]/10 hover:border-[hsl(var(--forge-emerald))]"
          onClick={() => performAction("approved")}
          disabled={!currentSample || isAnimating}
        >
          <ThumbsUp className="h-6 w-6 text-[hsl(var(--forge-emerald))]" />
        </Button>

        <div className="h-10 w-10" /> {/* spacer for symmetry */}
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-center text-muted-foreground/50 pb-2">
        ← reject · → approve · ↓ skip · ⌘Z undo
      </p>
    </div>
  );
}
