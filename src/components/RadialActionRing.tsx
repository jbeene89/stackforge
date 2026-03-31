import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface RadialAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string; // tailwind text color class
}

interface RadialActionRingProps {
  actions: RadialAction[];
  isOpen: boolean;
  onClose: () => void;
  /** radius in px from center to action buttons */
  radius?: number;
}

export function RadialActionRing({ actions, isOpen, onClose, radius = 120 }: RadialActionRingProps) {
  const count = actions.length;
  const angleStep = (2 * Math.PI) / count;
  // Start from the top (-90 degrees)
  const startAngle = -Math.PI / 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[70] bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Ring container — centered on screen */}
          <div className="fixed inset-0 z-[71] flex items-center justify-center pointer-events-none">
            {/* Center dot */}
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            />

            {/* Orbiting ring line */}
            <motion.div
              className="absolute rounded-full border border-primary/20"
              style={{ width: radius * 2, height: radius * 2 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />

            {/* Action buttons */}
            {actions.map((action, i) => {
              const angle = startAngle + i * angleStep;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <motion.button
                      className={`absolute pointer-events-auto flex flex-col items-center gap-1.5 group focus:outline-none`}
                      style={{ left: `calc(50% + ${x}px - 28px)`, top: `calc(50% + ${y}px - 28px)` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25, type: "spring", stiffness: 300, damping: 20 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick();
                        onClose();
                      }}
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-card border border-border shadow-lg flex items-center justify-center
                        group-hover:border-primary/50 group-hover:shadow-primary/20 group-hover:shadow-xl transition-all duration-200
                        group-hover:scale-110 ${action.color || "text-foreground"}`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                        {action.label}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {action.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
