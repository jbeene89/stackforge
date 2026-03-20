import { HelpCircle, Play, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tourSteps, type OnboardingTourHandle } from "@/components/OnboardingTour";
import { cn } from "@/lib/utils";

interface TourMenuProps {
  tourRef: React.RefObject<OnboardingTourHandle | null>;
}

export function TourMenu({ tourRef }: TourMenuProps) {
  const handleRestart = () => {
    tourRef.current?.startTour(0);
  };

  const handleJumpTo = (index: number) => {
    tourRef.current?.startTour(index);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tour</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-medium">Onboarding Tour</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleRestart} className="gap-2 cursor-pointer">
          <Play className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm">Restart full tour</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
          Jump to chapter
        </DropdownMenuLabel>
        {tourSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <DropdownMenuItem
              key={i}
              onClick={() => handleJumpTo(i)}
              className="gap-2 cursor-pointer"
            >
              <Icon className={cn("h-3.5 w-3.5", step.color)} />
              <span className="text-sm flex-1">{step.title}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
