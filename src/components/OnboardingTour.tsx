import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Brain, Layers, FolderOpen, Sparkles, Rocket, X, ChevronRight, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  targetId: string;
  position: "bottom" | "top" | "left" | "right";
}

export const tourSteps: TourStep[] = [
  {
    title: "Welcome to StackForge",
    description: "Let's take a quick tour of the key features that make building AI effortless. This will only take a moment.",
    icon: Sparkles,
    color: "text-primary",
    targetId: "tour-welcome",
    position: "bottom",
  },
  {
    title: "Your Projects",
    description: "All your AI projects live here — web apps, Android builds, modules, and full stacks. Create, manage, and deploy from one place.",
    icon: FolderOpen,
    color: "text-forge-emerald",
    targetId: "tour-projects",
    position: "bottom",
  },
  {
    title: "Module Builder",
    description: "Build specialised AI modules with custom system prompts, guardrails, and cognitive boundaries. Each module is a focused expert.",
    icon: Brain,
    color: "text-forge-amber",
    targetId: "tour-modules",
    position: "bottom",
  },
  {
    title: "Stack Canvas",
    description: "Wire modules together visually into powerful pipelines. Drag, connect, and orchestrate multi-step AI workflows with zero code.",
    icon: Layers,
    color: "text-forge-rose",
    targetId: "tour-stacks",
    position: "bottom",
  },
  {
    title: "You're All Set!",
    description: "Start by creating a new project or exploring templates. Your AI, your rules — trained on your data, running on your terms.",
    icon: Rocket,
    color: "text-primary",
    targetId: "tour-new-project",
    position: "bottom",
  },
];

const TOUR_STORAGE_KEY = "stackforge-onboarding-tour-completed";

export interface OnboardingTourHandle {
  startTour: (stepIndex?: number) => void;
}

export const OnboardingTour = forwardRef<OnboardingTourHandle>((_props, ref) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useImperativeHandle(ref, () => ({
    startTour: (stepIndex = 0) => {
      setCurrentStep(stepIndex);
      setIsActive(true);
    },
  }));

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateTargetRect = useCallback(() => {
    const step = tourSteps[currentStep];
    const el = document.getElementById(step.targetId);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isActive) return;
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [isActive, currentStep, updateTargetRect]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  }, []);

  const next = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    const padding = 12;
    return {
      position: "fixed",
      top: targetRect.bottom + padding,
      left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 170, window.innerWidth - 356)),
    };
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-background/60 backdrop-blur-sm"
          onClick={completeTour}
        />
      </AnimatePresence>

      {targetRect && (
        <div
          className="fixed z-[9999] rounded-xl ring-2 ring-primary/50 shadow-[0_0_0_9999px_hsl(var(--background)/0.6)]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            pointerEvents: "none",
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[10000] w-[340px] max-w-[calc(100vw-32px)]"
          style={getTooltipStyle()}
        >
          <div className="rounded-xl border bg-card p-5 shadow-xl">
            <button
              onClick={completeTour}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 mb-3">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted"
                  )}
                />
              ))}
            </div>

            <div className="flex items-start gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                step.color === "text-primary" && "bg-primary/10",
                step.color === "text-forge-emerald" && "bg-forge-emerald/10",
                step.color === "text-forge-amber" && "bg-forge-amber/10",
                step.color === "text-forge-rose" && "bg-forge-rose/10",
              )}>
                <Icon className={cn("h-5 w-5", step.color)} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={completeTour}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={prev} className="h-8 text-xs">
                    <ChevronLeft className="h-3 w-3 mr-1" /> Back
                  </Button>
                )}
                <Button size="sm" onClick={next} className="h-8 text-xs gradient-primary text-primary-foreground">
                  {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
                  {currentStep < tourSteps.length - 1 && <ChevronRight className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
});

OnboardingTour.displayName = "OnboardingTour";
