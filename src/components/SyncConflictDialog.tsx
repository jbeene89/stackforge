import { useState } from "react";
import { AlertTriangle, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveConflict, type SyncConflict } from "@/lib/offlineCache";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Props {
  conflicts: SyncConflict[];
  onResolved: () => void;
}

export function SyncConflictDialog({ conflicts, onResolved }: Props) {
  const [open, setOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [resolving, setResolving] = useState(false);

  const unresolved = conflicts.filter((c) => !c.resolved);
  if (unresolved.length === 0) return null;

  const conflict = unresolved[currentIdx] || unresolved[0];

  const handleResolve = async (resolution: "local" | "server") => {
    setResolving(true);
    try {
      await resolveConflict(conflict.id, resolution, supabase);
      toast.success(
        resolution === "local"
          ? "Kept your offline version"
          : "Accepted server version"
      );
      onResolved();
      if (currentIdx >= unresolved.length - 1) {
        setCurrentIdx(Math.max(0, currentIdx - 1));
      }
      if (unresolved.length <= 1) setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to resolve conflict");
    } finally {
      setResolving(false);
    }
  };

  const formatLabel = (store: string) =>
    store.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start gap-2 text-amber-400 hover:text-amber-300 font-semibold"
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs">{unresolved.length} conflict{unresolved.length > 1 ? "s" : ""}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Sync Conflict
            </DialogTitle>
            <DialogDescription>
              {formatLabel(conflict.store)} was modified on the server while you were offline.
              Choose which version to keep.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {conflict.mutation_action === "delete" ? "You deleted this" : "Your offline edit"}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {currentIdx + 1} / {unresolved.length}
              </Badge>
            </div>

            {/* Local version */}
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">Your Version (Offline)</p>
              <pre className="text-xs text-foreground/80 max-h-32 overflow-auto whitespace-pre-wrap">
                {conflict.mutation_action === "delete"
                  ? "(Deleted)"
                  : JSON.stringify(pickDisplayFields(conflict.local_version), null, 2)}
              </pre>
            </div>

            {/* Server version */}
            <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="text-xs font-semibold text-blue-400 mb-1">Server Version</p>
              <pre className="text-xs text-foreground/80 max-h-32 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(pickDisplayFields(conflict.server_version), null, 2)}
              </pre>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {unresolved.length > 1 && (
              <div className="flex gap-1 mr-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentIdx(Math.min(unresolved.length - 1, currentIdx + 1))}
                  disabled={currentIdx >= unresolved.length - 1}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => handleResolve("server")}
              disabled={resolving}
              className="gap-1"
            >
              <Check className="h-3 w-3" /> Keep Server
            </Button>
            <Button
              onClick={() => handleResolve("local")}
              disabled={resolving}
              className="gap-1"
            >
              <Check className="h-3 w-3" /> Keep Mine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Show only meaningful fields, hide internal IDs and timestamps */
function pickDisplayFields(obj: Record<string, any>): Record<string, any> {
  const skip = new Set(["user_id", "created_at", "updated_at"]);
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!skip.has(key)) result[key] = value;
  }
  return result;
}
