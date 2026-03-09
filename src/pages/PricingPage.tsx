import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "For personal projects and exploration.",
    features: ["3 projects", "5 AI modules", "2 stacks", "100 runs/month", "Community support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "For builders shipping real products.",
    features: ["Unlimited projects", "Unlimited modules", "Unlimited stacks", "5,000 runs/month", "Export code & configs", "Version history", "Priority support"],
    cta: "Start Pro Trial",
    highlight: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    desc: "For teams building together.",
    features: ["Everything in Pro", "5 team members", "Shared workspace", "Role-based access", "Shared templates", "Audit logs", "Dedicated support"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-4">Simple, transparent pricing</h1>
        <p className="text-center text-muted-foreground mb-16 text-lg">Start free. Scale as you build.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-8 flex flex-col ${plan.highlight ? "glass glow-primary border-primary/30" : "glass"}`}>
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-forge-emerald shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className={`w-full ${plan.highlight ? "gradient-primary text-primary-foreground" : ""}`} variant={plan.highlight ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
