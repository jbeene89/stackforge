import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Globe, Smartphone, Brain, Layers, Wrench, Search, 
  ArrowRight, ArrowLeft, Check, Sparkles, Rocket,
  GraduationCap, Briefcase, Code2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateProject } from "@/hooks/useSupabaseData";
import { toast } from "sonner";

const buildTypes = [
  { id: "web", icon: Globe, label: "Web App", desc: "Dashboard, CRM, portal, admin panel", color: "text-primary", gradient: "from-primary to-forge-cyan" },
  { id: "android", icon: Smartphone, label: "Android App", desc: "Field tool, inspector, mobile AI app", color: "text-forge-cyan", gradient: "from-forge-cyan to-forge-emerald" },
  { id: "module", icon: Brain, label: "AI Module", desc: "Narrow-purpose specialist AI", color: "text-forge-amber", gradient: "from-forge-amber to-forge-rose" },
  { id: "stack", icon: Layers, label: "AI Stack", desc: "Multi-step AI workflow pipeline", color: "text-forge-rose", gradient: "from-forge-rose to-primary" },
  { id: "tool", icon: Wrench, label: "Internal Tool", desc: "Business process automation", color: "text-forge-emerald", gradient: "from-forge-emerald to-forge-cyan" },
  { id: "research", icon: Search, label: "Research Workflow", desc: "Summarize, analyze, report", color: "text-muted-foreground", gradient: "from-secondary to-muted" },
];

const experienceLevels = [
  { id: "beginner", icon: GraduationCap, label: "Just Getting Started", desc: "New to AI development, show me the basics" },
  { id: "intermediate", icon: Code2, label: "Some Experience", desc: "Built some things, ready for more" },
  { id: "expert", icon: Briefcase, label: "Power User", desc: "Give me full control, skip tutorials" },
];

const templatesByType: Record<string, { name: string; desc: string }[]> = {
  web: [
    { name: "CRM Dashboard", desc: "Customer tracking with pipeline" },
    { name: "Admin Panel", desc: "User management & analytics" },
    { name: "Project Tracker", desc: "Team tasks & milestones" },
  ],
  android: [
    { name: "Field Inspector", desc: "Photo + form capture tool" },
    { name: "Inventory Scanner", desc: "Barcode & NFC tracking" },
    { name: "Route Planner", desc: "Delivery optimization app" },
  ],
  module: [
    { name: "Document Analyzer", desc: "Extract & classify text" },
    { name: "Sentiment Classifier", desc: "Analyze tone & emotion" },
    { name: "Cost Estimator", desc: "Price calculation AI" },
  ],
  stack: [
    { name: "Marine Estimator", desc: "Multi-AI damage assessment" },
    { name: "Research Pipeline", desc: "Search → Analyze → Report" },
    { name: "Content Generator", desc: "Draft → Review → Publish" },
  ],
  tool: [
    { name: "Invoice Processor", desc: "Extract & validate invoices" },
    { name: "HR Onboarding", desc: "Automated new hire flow" },
    { name: "Report Generator", desc: "Data → Charts → PDF" },
  ],
  research: [
    { name: "Competitor Analysis", desc: "Track & compare competitors" },
    { name: "Literature Review", desc: "Search & summarize papers" },
    { name: "Market Research", desc: "Trends & insights digest" },
  ],
};

const steps = [
  { id: 1, label: "What to build" },
  { id: 2, label: "Experience" },
  { id: 3, label: "Project name" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [buildType, setBuildType] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const navigate = useNavigate();

  const canContinue = () => {
    if (step === 1) return buildType !== null;
    if (step === 2) return experience !== null;
    if (step === 3) return projectName.trim().length > 0;
    return false;
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">StackForge</span>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                      ? "bg-primary/10 text-primary border-2 border-primary"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("w-8 h-0.5 mx-1", step > s.id ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-2">What do you want to build?</h1>
                  <p className="text-muted-foreground">Pick a starting point. You can always change later.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {buildTypes.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setBuildType(opt.id)}
                      className={cn(
                        "glass rounded-xl p-5 text-left transition-all hover:glow-primary group",
                        buildType === opt.id && "ring-2 ring-primary glow-primary"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
                        opt.gradient
                      )}>
                        <opt.icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-2">What's your experience level?</h1>
                  <p className="text-muted-foreground">We'll customize the experience for you.</p>
                </div>
                <div className="space-y-3">
                  {experienceLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setExperience(level.id)}
                      className={cn(
                        "w-full glass rounded-xl p-5 text-left transition-all hover:glow-primary flex items-center gap-4",
                        experience === level.id && "ring-2 ring-primary glow-primary"
                      )}
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <level.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.desc}</div>
                      </div>
                      {experience === level.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h1 className="text-3xl font-bold mb-2">Name your project</h1>
                  <p className="text-muted-foreground">Or start from a template below.</p>
                </div>
                <div className="space-y-4">
                  <Input
                    placeholder="My Awesome Project"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="text-center text-lg h-14"
                    autoFocus
                  />
                  {buildType && templatesByType[buildType] && (
                    <div className="pt-4">
                      <div className="text-sm text-muted-foreground mb-3 text-center">Or start from a template:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {templatesByType[buildType].map((t) => (
                          <button
                            key={t.name}
                            onClick={() => {
                              setProjectName(t.name);
                              setSelectedTemplate(t.name);
                            }}
                            className={cn(
                              "glass rounded-lg p-4 text-left transition-all hover:border-primary/30",
                              selectedTemplate === t.name && "ring-2 ring-primary"
                            )}
                          >
                            <div className="font-medium text-sm">{t.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className={cn(step === 1 && "invisible")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="gradient-primary text-primary-foreground px-8"
            >
              {step === 3 ? (
                <>
                  <Rocket className="h-4 w-4 mr-2" /> Create Project
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Keyboard hint */}
      <footer className="border-t border-border py-4 text-center">
        <span className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono mx-1">Enter</kbd> to continue
        </span>
      </footer>
    </div>
  );
}
