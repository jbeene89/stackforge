import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Smartphone, Brain, Layers, Wrench, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { id: "web", icon: Globe, label: "Web App", desc: "Dashboard, CRM, portal, admin panel" },
  { id: "android", icon: Smartphone, label: "Android App", desc: "Field tool, inspector, mobile AI app" },
  { id: "module", icon: Brain, label: "AI Module", desc: "Narrow-purpose specialist AI" },
  { id: "stack", icon: Layers, label: "AI Stack", desc: "Multi-step AI workflow pipeline" },
  { id: "tool", icon: Wrench, label: "Internal Tool", desc: "Business process automation" },
  { id: "research", icon: Search, label: "Research Workflow", desc: "Summarize, analyze, report" },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">What do you want to build?</h1>
          <p className="text-muted-foreground">Pick a starting point. You can always change later.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={cn(
                "glass rounded-xl p-5 text-left transition-all hover:glow-primary",
                selected === opt.id && "ring-2 ring-primary glow-primary"
              )}
            >
              <opt.icon className="h-6 w-6 text-primary mb-3" />
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <Button
            size="lg"
            className="gradient-primary text-primary-foreground px-10"
            disabled={!selected}
            onClick={() => navigate("/dashboard")}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
