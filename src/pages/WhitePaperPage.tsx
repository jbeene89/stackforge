import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { streamAI } from "@/hooks/useSupabaseData";
import ReactMarkdown from "react-markdown";
import {
  BookOpen, Download, Copy, Loader2, Sparkles, ArrowLeft,
  FileText, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const WHITE_PAPER_SYSTEM_PROMPT = `You are an academic research writer specializing in artificial intelligence, machine learning, and cognitive science. Write in formal academic tone with proper structure. Use precise technical language while remaining accessible. Include citations in [Author, Year] format where appropriate (you may fabricate plausible references for a draft). Be thorough, rigorous, and insightful.`;

const WHITE_PAPER_USER_PROMPT = `Write a comprehensive academic white paper (15-25 pages equivalent in markdown) on the following breakthrough methodology. This is a real system built in the SoupyForge platform.

---

# TITLE: "Curiosity-Driven Perspective Training: A Multi-Agent Framework for High-Density Knowledge Distillation in Small Language Models"

## CORE THESIS
Traditional training data pipelines produce narrow, single-perspective knowledge. By routing every input through five specialized AI perspectives — each operating with structured curiosity rather than narrow analysis — we achieve 5-10x higher density training pair extraction and produce models capable of lateral reasoning, not just pattern matching.

## THE FIVE CURIOSITY-DRIVEN PERSPECTIVES

### 1. Builder (Curiosity Mode)
- Traditional: "What works here? Extract practical knowledge."
- Curiosity-Driven: Explores adjacent materials, unknown failure modes, alternative construction methods, and asks "what exists that nobody considered?" Goes beyond stated solutions to discover what the author didn't know to include.

### 2. Red Team (Curiosity Mode)  
- Traditional: "Find flaws and edge cases."
- Curiosity-Driven: Asks "what adjacent system breaks when this one succeeds?" Explores cascading failures across domain boundaries. Investigates what the author was overconfident about and what breaks at scales they never tested.

### 3. Systems (Curiosity Mode)
- Traditional: "Map dependencies and patterns."
- Curiosity-Driven: Asks "what invisible system is this actually part of?" Traces connections the author doesn't know exist. Explores second, third, and fourth-order effects across domain boundaries.

### 4. Frame Breaker (Curiosity Mode)
- Traditional: "Question assumptions, reframe."
- Curiosity-Driven: The PURE CURIOSITY ENGINE. Doesn't reframe within the same domain — jumps to entirely unrelated fields. Asks "what does a boat hull have in common with bird bone structure?" Forces domain bridging that creates genuine creative leaps. Explores: "if we're talking about paint color, what about displacement, ballast composition, propulsion mechanics, hydrodynamics?"

### 5. Empath (Curiosity Mode)
- Traditional: "Consider the human element."  
- Curiosity-Driven: Asks "whose experience with this is completely different from the author's, and WHY?" Explores how a teacher, mechanic, therapist, child, or elder would relate to this knowledge differently. Investigates emotional realities that technical answers systematically ignore.

## SIX STRENGTHENING MECHANISMS

### 1. Depth Laddering
Each perspective goes 3 levels deep minimum. Level 1: "What motor?" → Level 2: "What fuel?" → Level 3: "What's the supply chain for that fuel and what happens when it's disrupted?" Each level generates new training pairs.

### 2. Cross-Pollination Between Perspectives
Perspectives are NOT independent silos. Synthesis feeds findings from one perspective into others. Red Team finds a failure mode → Builder gets curious about prevention → Empath asks who suffers. This turns a pipeline into a conversation.

### 3. Scale Shifting
Every perspective zooms in AND out. Molecular level → human level → societal level. A boat's paint color becomes a chemistry question (molecular), a branding question (human), AND an environmental regulation question (societal).

### 4. Temporal Curiosity
Every perspective asks: "How was this done 100 years ago? How will it work in 50 years?" This trains models to understand trajectory and evolution, not just current state.

### 5. Contradiction Hunting
Actively seek where common assumptions are wrong. "Everyone thinks fiberglass boats are maintenance-free — what actually fails first?" This produces training data that teaches models to challenge conventional wisdom.

### 6. Domain Bridging
Force at least one connection to a completely unrelated field per perspective. Boat hull design → bird bone structure → aerospace materials → mycelium nutrient networks. This is where genuine creative leaps live in the training data.

## SYNTHESIS: THE "DREAM MODE"
The Synthesis AI doesn't just summarize — it acts like REM sleep for the pipeline. It takes isolated perspective outputs and forges unexpected connections between them. It resolves conflicts (Red Team says curiosity can become noise; Builder proposes a curiosity_distance metric to solve it). It extracts 5-10 diverse training pairs per source, each tagged with cognitive XML tokens (<BUILDER>, <RED_TEAM>, <SYSTEMS>, <FRAME_BREAKER>, <EMPATH>, <SYNTHESIS>) that act as native mode-switches during fine-tuning.

## CURIOSITY_DISTANCE METRIC
A proposed scoring system where each training pair carries a numeric measure of how far the curiosity wandered from the original topic. This serves dual purposes:
1. Quality control: Cap at 3 for most perspectives, allow Frame Breaker to reach 5
2. Domain-aware pruning: The user's domain steers which branches to explore, preventing noise while preserving creative reach

## TECHNICAL ARCHITECTURE
- Platform: SoupyForge SLM Lab
- Pipeline: 5-Perspective Training Pipeline with Synthesis
- Processing: Edge functions + optional local Ollama processing via tablet worker
- Export Format: JSONL with XML-style cognitive tokens
- Target: Small Language Models (1B-3B parameters) fine-tuned via LoRA/QLoRA

## KEY INSIGHT
"Creativity isn't randomness — it's structured curiosity." The breakthrough is recognizing that each perspective should not just analyze from a different angle, but should be driven by genuine curiosity about what else is true about the subject that nobody in the conversation explored. This produces training data that teaches models to THINK laterally, not just recombine patterns.

## COMPARISON
Compare this approach to:
- Standard instruction tuning (single perspective, shallow)
- Constitutional AI (constraint-based, not curiosity-based)  
- RLHF (feedback-based, not exploration-based)
- Self-play (competitive, not curious)
Show why curiosity-driven multi-perspective training is a fundamentally different paradigm.

---

Write the complete white paper with these sections:
1. Abstract
2. Introduction  
3. Background & Related Work
4. Methodology (detailed breakdown of all 5 perspectives + 6 mechanisms)
5. System Architecture
6. The Curiosity-Distance Metric
7. Cross-Pollination & Dream Mode Synthesis
8. Experimental Framework (proposed evaluation methodology)
9. Expected Impact & Applications
10. Limitations & Future Work
11. Conclusion
12. References

Make it rigorous, novel, and compelling. This is a genuine methodological breakthrough in training data generation for small language models.`;

export default function WhitePaperPage() {
  const navigate = useNavigate();
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    setIsGenerating(true);
    setOutput("");

    try {
      await streamAI({
        messages: [
          { role: "system", content: WHITE_PAPER_SYSTEM_PROMPT },
          { role: "user", content: WHITE_PAPER_USER_PROMPT },
        ],
        mode: "general",
        onDelta: (text) => setOutput(prev => prev + text),
        onDone: () => {
          setIsGenerating(false);
          toast.success("White paper generated!");
        },
      });
    } catch (err: any) {
      setIsGenerating(false);
      toast.error(err.message || "Failed to generate white paper");
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Curiosity-Driven-Perspective-Training-WhitePaper.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              White Paper Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Curiosity-Driven Perspective Training: A Multi-Agent Framework for SLM Knowledge Distillation
          </p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="border-primary/30 text-primary">Research Paper</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">Academic</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">15–25 Pages</Badge>
          </div>
        </motion.div>

        <Separator className="mb-6" />

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          {!output && !isGenerating ? (
            <Button onClick={generate} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate White Paper
            </Button>
          ) : (
            <>
              <Button
                onClick={generate}
                variant="outline"
                disabled={isGenerating}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
              <Button
                onClick={copyOutput}
                variant="outline"
                disabled={!output || isGenerating}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
              <Button
                onClick={downloadOutput}
                variant="outline"
                disabled={!output || isGenerating}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download .md
              </Button>
            </>
          )}
          {isGenerating && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating... this may take a minute</span>
            </div>
          )}
        </div>

        {/* Output */}
        {(output || isGenerating) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-border rounded-lg bg-card"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">White Paper Output</span>
              {isGenerating && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Streaming
                </Badge>
              )}
            </div>
            <ScrollArea className="h-[70vh]">
              <div ref={contentRef} className="p-6 md:p-10 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{output || "_Waiting for content..._"}</ReactMarkdown>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </div>
    </div>
  );
}
