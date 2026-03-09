import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Globe, Smartphone, Brain, Layers, ArrowRight, Zap, Shield, Eye,
  Play, Star, Users, TrendingUp, Clock, CheckCircle2, Quote, ChevronRight,
  Keyboard, Command
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const pillars = [
  { icon: Globe, title: "Web Apps", desc: "Dashboards, CRMs, portals, admin panels, and internal tools from plain English.", color: "text-primary", gradient: "from-primary to-forge-cyan" },
  { icon: Smartphone, title: "Android Apps", desc: "Field tools, inspectors, trackers, and mobile AI assistants with device preview.", color: "text-forge-cyan", gradient: "from-forge-cyan to-forge-emerald" },
  { icon: Brain, title: "AI Modules", desc: "Narrow-purpose specialist AIs — estimators, critics, extractors, classifiers.", color: "text-forge-amber", gradient: "from-forge-amber to-forge-rose" },
  { icon: Layers, title: "AI Stacks", desc: "Orchestrate multiple AI modules into intelligent pipelines and workflows.", color: "text-forge-rose", gradient: "from-forge-rose to-primary" },
];

const features = [
  { icon: Zap, title: "Prompt to Prototype", desc: "Describe what you want. Get working code, screens, and logic in seconds." },
  { icon: Eye, title: "Transparent Tracing", desc: "See what every AI step received, produced, and decided. Full observability." },
  { icon: Shield, title: "Human-in-the-Loop", desc: "Add approval gates, edit outputs, pause and resume workflows anytime." },
];

const useCases = [
  { title: "Marine Estimator", desc: "Multi-AI stack for vessel damage assessment", type: "Stack", color: "bg-forge-cyan/10 text-forge-cyan" },
  { title: "Contractor Dashboard", desc: "Real-time project tracking web app", type: "Web App", color: "bg-primary/10 text-primary" },
  { title: "Field Inspector", desc: "Mobile inspection tool with AI assist", type: "Android", color: "bg-forge-emerald/10 text-forge-emerald" },
  { title: "Document Analyzer", desc: "Extract, classify, summarize documents", type: "Module", color: "bg-forge-amber/10 text-forge-amber" },
];

const testimonials = [
  { name: "Sarah Chen", role: "CTO, TechFlow", text: "Built our entire internal tooling suite in 2 weeks. What used to take months.", avatar: "SC" },
  { name: "Marcus Rivera", role: "Founder, AutomateAI", text: "The AI module system is exactly what we needed. Modular, testable, traceable.", avatar: "MR" },
  { name: "Emily Watson", role: "Lead Engineer, DataCorp", text: "Finally, AI workflows I can actually debug. The tracing is a game-changer.", avatar: "EW" },
];

const stats = [
  { value: 12000, suffix: "+", label: "Projects Built" },
  { value: 50000, suffix: "+", label: "AI Modules" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 4.9, suffix: "/5", label: "Rating" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {value < 100 ? count.toFixed(1) : count.toLocaleString()}{suffix}
    </span>
  );
}

function TypewriterDemo() {
  const prompts = [
    "Build a CRM with lead tracking and pipeline view",
    "Create an AI that estimates repair costs from photos",
    "Make an Android app for field inspections",
    "Design a multi-step document analysis workflow",
  ];
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const prompt = prompts[currentPrompt];
    if (isTyping) {
      if (displayText.length < prompt.length) {
        const timer = setTimeout(() => {
          setDisplayText(prompt.slice(0, displayText.length + 1));
        }, 40);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => setIsTyping(false), 2000);
      }
    } else {
      if (displayText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 20);
        return () => clearTimeout(timer);
      } else {
        setCurrentPrompt((prev) => (prev + 1) % prompts.length);
        setIsTyping(true);
      }
    }
  }, [displayText, isTyping, currentPrompt, prompts]);

  return (
    <div className="glass rounded-xl p-4 max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-forge-rose/60" />
          <div className="w-3 h-3 rounded-full bg-forge-amber/60" />
          <div className="w-3 h-3 rounded-full bg-forge-emerald/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">StackForge Prompt</span>
      </div>
      <div className="font-mono text-sm text-foreground min-h-[24px]">
        <span className="text-muted-foreground">→ </span>
        {displayText}
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
      </div>
    </div>
  );
}

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
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground glass px-2 py-1 rounded-md">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" className="gradient-primary text-primary-foreground">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3 text-primary" /> 
              <span>Now with SLM mode for domain-specific AI</span>
              <Badge variant="secondary" className="text-[10px] bg-forge-emerald/10 text-forge-emerald">New</Badge>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              From plain English to{" "}
              <span className="gradient-text">working software</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Build web apps, Android apps, narrow-purpose AI specialists, and multi-AI workflows.
              The modular AI software studio for builders and thinkers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link to="/signup">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 group">
                  Start Building <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <Play className="h-4 w-4" /> Watch Demo
              </Button>
            </div>
            <TypewriterDemo />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Four pillars of creation</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Build anything from simple tools to complex AI systems. Each pillar can stand alone or combine with others.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass rounded-xl p-6 hover:glow-primary transition-all group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <p.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
                <div className="flex items-center gap-1 text-primary text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">See what's possible</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Real projects built by our community. From simple modules to complex multi-AI stacks.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer group"
              >
                <Badge className={`${uc.color} text-[10px] mb-3`}>{uc.type}</Badge>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/templates">
              <Button variant="outline" size="lg">
                Browse All Templates <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Built for control and transparency</h2>
            <p className="text-muted-foreground">No black boxes. See and control every step of your AI systems.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-xl glass flex items-center justify-center mb-4 glow-primary">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Loved by builders</h2>
            <p className="text-muted-foreground">Join thousands of developers and teams building with StackForge AI.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-6"
              >
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-sm text-foreground mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <Keyboard className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-3">Keyboard-first design</h2>
                <p className="text-muted-foreground mb-6">
                  Built for power users. Navigate, create, and manage everything with keyboard shortcuts.
                </p>
                <div className="flex flex-wrap gap-2">
                  <kbd className="px-2 py-1 rounded bg-secondary text-xs font-mono">⌘K</kbd>
                  <span className="text-sm text-muted-foreground">Command palette</span>
                  <kbd className="px-2 py-1 rounded bg-secondary text-xs font-mono ml-4">⌘N</kbd>
                  <span className="text-sm text-muted-foreground">New project</span>
                  <kbd className="px-2 py-1 rounded bg-secondary text-xs font-mono ml-4">⌘/</kbd>
                  <span className="text-sm text-muted-foreground">Shortcuts</span>
                </div>
              </div>
              <div className="glass rounded-xl p-4 w-full md:w-64">
                <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
                <div className="space-y-2">
                  {[
                    { key: "⌘K", label: "Search anything" },
                    { key: "⌘N", label: "New project" },
                    { key: "⌘⇧M", label: "New module" },
                    { key: "⌘⇧S", label: "New stack" },
                    { key: "⌘.", label: "Toggle theme" },
                  ].map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between text-sm">
                      <span>{shortcut.label}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-secondary/50 text-[10px] font-mono">{shortcut.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass rounded-2xl p-12 glow-primary"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-muted-foreground mb-6">Start with a prompt. Get a prototype. Iterate with AI.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground px-8">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">View Pricing</Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-forge-emerald" /> Free tier</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-forge-emerald" /> No credit card</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-forge-emerald" /> Cancel anytime</div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-bold">StackForge <span className="text-primary">AI</span></span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">The modular AI software studio. Build anything from plain English.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-semibold mb-3">Product</div>
                <div className="space-y-2 text-muted-foreground">
                  <div><Link to="/templates" className="hover:text-foreground transition-colors">Templates</Link></div>
                  <div><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Changelog</a></div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">Resources</div>
                <div className="space-y-2 text-muted-foreground">
                  <div><a href="#" className="hover:text-foreground transition-colors">Documentation</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">API Reference</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Community</a></div>
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">Company</div>
                <div className="space-y-2 text-muted-foreground">
                  <div><a href="#" className="hover:text-foreground transition-colors">About</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Blog</a></div>
                  <div><a href="#" className="hover:text-foreground transition-colors">Careers</a></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border text-sm text-muted-foreground">
            <span>© 2026 StackForge AI. All rights reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
