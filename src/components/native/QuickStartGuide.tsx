import { useState } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const steps = [
  { title: "Find a tool", text: "Search the workspace by task. Star useful tools to find them again in Favorites.", path: "/launchpad?view=tools", action: "Explore tools" },
  { title: "Start with your knowledge", text: "Write a prompt and a useful response in the offline notebook. Save your examples on this device, then export JSONL with Android's share options.", path: "/offline-workbench", action: "Open notebook" },
  { title: "Explore AI when you're ready", text: "Try a module preset or open SLM Lab. Cloud tools need an internet connection; saving cloud work needs an account, and some features require credits or a plan.", path: "/demo/module-builder", action: "Try a demo" },
];

export function QuickStartGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const current = steps[step];
  return <Dialog open={open} onOpenChange={value => { setOpen(value); setStep(0); }}>
    <DialogTrigger asChild><Button variant="outline" className="min-h-12"><BookOpen aria-hidden="true" />Quick start guide</Button></DialogTrigger>
    <DialogContent className="w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto rounded-xl">
      <DialogHeader><DialogTitle className="pr-8">Welcome to SoupyLab</DialogTitle><DialogDescription>Three ways to get started. You can close this guide at any time.</DialogDescription></DialogHeader>
      <p className="text-sm text-muted-foreground" role="status">Step {step + 1} of {steps.length}</p>
      <h2 className="text-xl font-semibold">{current.title}</h2>
      <p className="leading-relaxed">{current.text}</p>
      <Button asChild variant="outline" className="min-h-12"><Link to={current.path} onClick={() => setOpen(false)}>{current.action}<ChevronRight aria-hidden="true" /></Link></Button>
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="ghost" className="min-h-12" onClick={() => setOpen(false)}>Skip guide</Button>
        {step > 0 && <Button variant="outline" className="min-h-12" onClick={() => setStep(step - 1)}>Back</Button>}
        <Button className="min-h-12" onClick={() => step === 2 ? setOpen(false) : setStep(step + 1)}>{step === 2 ? "Done" : "Next"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}

export function WelcomeGuideCard() {
  const [visible, setVisible] = useState(() => { try { return localStorage.getItem("soupylab-guide-dismissed-v1") !== "yes"; } catch { return true; } });
  if (!visible) return null;
  return <section className="slp-guide-card" aria-label="Getting started">
    <div><h2>New here?</h2><p>Find your tools, save an example, and explore AI at your own pace.</p></div>
    <QuickStartGuide />
    <button type="button" className="slp-text-button" onClick={() => { setVisible(false); try { localStorage.setItem("soupylab-guide-dismissed-v1", "yes"); } catch { /* Dismiss for this visit. */ } }}>Dismiss</button>
  </section>;
}
