import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe, Smartphone, Brain, Layers, ArrowRight, Zap, Shield, Eye } from "lucide-react";
import { motion } from "framer-motion";

const pillars = [
  { icon: Globe, title: "Web Apps", desc: "Dashboards, CRMs, portals, admin panels, and internal tools from plain English.", color: "text-primary" },
  { icon: Smartphone, title: "Android Apps", desc: "Field tools, inspectors, trackers, and mobile AI assistants with device preview.", color: "text-forge-cyan" },
  { icon: Brain, title: "AI Modules", desc: "Narrow-purpose specialist AIs — estimators, critics, extractors, classifiers.", color: "text-forge-amber" },
  { icon: Layers, title: "AI Stacks", desc: "Orchestrate multiple AI modules into intelligent pipelines and workflows.", color: "text-forge-rose" },
];

const features = [
  { icon: Zap, title: "Prompt to Prototype", desc: "Describe what you want. Get working code, screens, and logic." },
  { icon: Eye, title: "Transparent Tracing", desc: "See what every AI step received, produced, and decided." },
  { icon: Shield, title: "Human-in-the-Loop", desc: "Add approval gates, edit outputs, pause and resume workflows." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold">StackForge <span className="text-primary">AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/templates" className="hover:text-foreground transition-colors">Templates</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" className="gradient-primary text-primary-foreground">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3 text-primary" /> Build anything with AI — apps, modules, stacks
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              From plain English to{" "}
              <span className="gradient-text">working software</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Build web apps, Android apps, narrow-purpose AI specialists, and multi-AI workflows.
              The modular AI software studio for builders and thinkers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8">
                  Start Building <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/templates">
                <Button size="lg" variant="outline">Browse Templates</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Four pillars of creation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass rounded-xl p-6 hover:glow-primary transition-shadow"
              >
                <p.icon className={`h-8 w-8 ${p.color} mb-4`} />
                <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Built for control and transparency</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-xl glass flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center glass rounded-2xl p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-muted-foreground mb-6">Start with a prompt. Get a prototype. Iterate with AI.</p>
          <Link to="/signup">
            <Button size="lg" className="gradient-primary text-primary-foreground px-8">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 StackForge AI. All rights reserved.</span>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/templates" className="hover:text-foreground transition-colors">Templates</Link>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
