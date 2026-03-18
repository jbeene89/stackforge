import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useOfflineSync, ConnectionStatus } from "@/hooks/useOfflineSync";
import { SyncConflictDialog } from "@/components/SyncConflictDialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusConfig: Record<ConnectionStatus, { icon: typeof Wifi; label: string; className: string }> = {
  online: { icon: Wifi, label: "Online", className: "text-emerald-400" },
  offline: { icon: WifiOff, label: "Offline — edits cached locally", className: "text-amber-400" },
  syncing: { icon: RefreshCw, label: "Syncing changes…", className: "text-blue-400" },
};

export function OfflineIndicator({ collapsed = false }: { collapsed?: boolean }) {
  const { status, pendingCount, conflicts, triggerSync, refreshState } = useOfflineSync();
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="space-y-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={status === "online" && pendingCount > 0 ? triggerSync : undefined}
            className={cn(
              "w-full justify-start gap-2 font-semibold",
              config.className
            )}
          >
            <Icon className={cn("h-4 w-4", status === "syncing" && "animate-spin")} />
            {!collapsed && (
              <span className="text-xs">
                {config.label}
                {pendingCount > 0 && status !== "syncing" && ` (${pendingCount} queued)`}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{config.label}</p>
          {pendingCount > 0 && <p className="text-xs text-muted-foreground">{pendingCount} changes waiting to sync</p>}
        </TooltipContent>
      </Tooltip>

      {!collapsed && conflicts.length > 0 && (
        <SyncConflictDialog conflicts={conflicts} onResolved={refreshState} />
      )}
    </div>
  );
}
