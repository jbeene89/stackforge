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

const WHITE_PAPER_USER_PROMPT = `Write a comprehensive academic white paper (15-25 pages equivalent in markdown) on the following breakthrough methodology. This is a real system built in the Soupy platform.

---

# TITLE: "Curiosity-Driven Perspective Training: Preemptive Intelligence Through Cross-Domain Gap Sensing in Small Language Models"

## CORE THESIS
"CDPT doesn't make AI smarter. It makes AI complete."

Traditional training data pipelines produce narrow, single-perspective knowledge. Current AI models hallucinate at the gaps or hedge into uselessness — because they don't know what they don't know. CDPT eliminates those gaps before training begins. By routing every input through five specialized AI perspectives — each with cross-domain gap sensing and epistemic drive — the pipeline generates knowledge the source material never contained, imported from adjacent fields where the problem was already solved.

The result is not a better reasoner. It is a model with preemptive intelligence: gaps filled before they become questions, knowledge resident in the weights before a user needs it.

## THREE THEORETICAL CONTRIBUTIONS

### Contribution 1: Identity Over Instruction (Epistemic Drive)
Each perspective agent is defined by intrinsic motivation — an epistemic hunger — rather than task instructions. The Builder doesn't analyze because it's told to; it analyzes because incomplete knowledge physically bothers it. This produces agents that go deeper, wider, and more honestly than instruction-following agents.

### Contribution 2: The Oracle Principle (Reasoning/Knowledge Separation)
"CDPT separates the reasoning process from the knowledge artifact. The perspectives reason so the model doesn't have to."

Every AI company is racing to make models that reason better. CDPT takes a fundamentally different approach: the heavy multi-perspective reasoning — debate, challenge, concession, synthesis — happens during DATA GENERATION, not during inference. The final training pair contains only settled knowledge. The model trained on this data doesn't perform reasoning; it HAS the answer, the way a domain expert who stopped consciously thinking about a problem years ago simply knows.

Two synthesis modes:
- **Oracle Mode**: Training pairs contain settled, authoritative knowledge. No hedging, no "it depends," no visible reasoning chain. The model speaks as someone who already knows.
- **Teacher Mode**: Training pairs preserve the reasoning transparently. The model explains how it arrives at answers. Useful for educational and explainable AI use cases.

### Contribution 3: Cross-Domain Gap Sensing (Preemptive Intelligence)
The deepest limitation of current AI models is not that they can't reason — it's that they don't know what they don't know. A language model trained on medical literature has no idea that a supply chain failure pattern it's never seen perfectly predicts the drug shortage it was just asked about. A model trained on software engineering doesn't realize that jazz improvisation has already formalized the error-recovery pattern it's trying to rediscover from first principles.

CDPT solves this through **Cross-Domain Gap Sensing** — a directive embedded in every perspective that compels each agent to look OUTSIDE its analytical domain before finishing:

- **Builder** asks: "What adjacent field has already solved a problem this content is still struggling with?"
- **Red Team** asks: "What failure modes from OTHER fields apply here that nobody in THIS field has considered?"
- **Systems** asks: "What systems in OTHER domains share this topology but have been studied longer?"
- **Frame Breaker** imports wholesale: "What does mycology know about networks that computer science reinvented from scratch?"
- **Empath** crosses the human boundary: "What do therapists already know about this that the engineers never asked?"

### Contribution 4: The Recursive Gap-Fill Loop (Detect → Fill → Self-Inspect)
Gap sensing alone is not enough — naming a gap leaves the gap open. CDPT mandates a three-step recursive process in every perspective:

**Step 1 — DETECT**: Identify knowledge that exists in an adjacent domain but is missing from the current content. This is standard cross-domain gap sensing.

**Step 2 — FILL**: Do not merely flag the gap. IMPORT the solution. State the cross-domain knowledge as settled fact that belongs here. Example: Red Team doesn't just say "aviation has a checklist for this" — it writes the checklist into the analysis as if it always existed in this domain.

**Step 3 — SELF-INSPECT**: The gap-fill just introduced new knowledge. That new knowledge has its own gaps. Turn the lens on yourself: "Does my imported solution have a known limitation? Has a THIRD field already solved the limitation of the solution I just imported?" Go one more level. Fill the gap in your gap-fill.

This creates a recursive chain of completeness. Each perspective doesn't just cross one domain boundary — it crosses two or three, each time filling the gap exposed by the previous fill. The depth is bounded by genuine knowledge limits, not by instruction — the agent stops when it honestly runs out of bridges to cross.

### Contribution 5: The Gap Chain (Debate-Round Recursive Completeness)
The recursive gap-fill loop operates within each individual perspective. The **Gap Chain** extends this across perspectives during the Debate Round.

When perspectives read each other's analyses in the debate round, each one runs a cross-perspective gap chain:

- **Builder** checks: "The others imported knowledge from aviation, ecology, psychology. Are those imports practically buildable? What gaps do they have that only a builder can see?"
- **Red Team** stress-tests: "Every import is a new attack surface. What failure modes exist in the SOURCE domain's solution that nobody brought over?"
- **Systems** maps: "Five perspectives imported from five different fields. Do those imports interact? Do they create a new feedback loop nobody modeled because the imports came from different domains?"
- **Frame Breaker** bridges bridges: "Builder borrowed from engineering, Red Team from aviation, Systems from ecology, Empath from psychology. What unifying framework contains ALL of these patterns? What field bridges the bridges?"
- **Empath** humanizes the imports: "Builder borrowed engineering solutions — but what do the engineers themselves burn out from? Red Team imported aviation protocols — but what do pilots actually feel about checklist fatigue? The human cost of the imported solution is itself a gap."

Each perspective fills the gaps in the other perspectives' gap-fills, creating a chain of recursive completeness that no single agent could achieve alone.

The result: training pairs tagged with <BRIDGE> tokens that carry cross-domain knowledge the original content never contained. The model doesn't learn to SEARCH for adjacent knowledge at inference time — it already HAS it in its weights.

This is preemptive intelligence: a model that fills gaps before they become questions.

## THE PROGRESSION
Standard fine-tuning → Model knows what it was trained on
CDPT Identity/Oracle mode → Model knows it deeply, speaks with certainty  
CDPT + Cross-Domain Gap Sensing → Model knows things the training data never contained
CDPT + Recursive Gap-Fill → Model knows the LIMITS of its imported knowledge and has already patched them
CDPT + Gap Chain (Debate) → Model's knowledge has been stress-tested across all five cognitive modes recursively

## THE FIVE CURIOSITY-DRIVEN PERSPECTIVES

### 1. Builder (Curiosity Mode + Gap Sensing)
- Epistemic Drive: Obsessive need to COMPLETE things. Incomplete knowledge physically bothers it.
- Cross-Domain: Imports solved problems from adjacent engineering, manufacturing, logistics.
- Token: <BUILDER>

### 2. Red Team (Curiosity Mode + Gap Sensing)  
- Epistemic Drive: Haunted by the flaw it almost missed. Every piece of content is a crime scene.
- Cross-Domain: Imports failure patterns from aviation, medicine, cybersecurity, ecology.
- Token: <RED_TEAM>

### 3. Systems (Curiosity Mode + Gap Sensing)
- Epistemic Drive: Compelled to trace every thread to the edge. Isolated facts feel like lies.
- Cross-Domain: Imports topologies from ecology, urban planning, fluid dynamics.
- Token: <SYSTEMS>

### 4. Frame Breaker (Curiosity Mode + Gap Sensing)
- Epistemic Drive: Delighted by the moment an outsider sees what insiders cannot.
- Cross-Domain: The primary gap-filler. Imports wholesale from unrelated fields — mycology, jazz, aerospace.
- Token: <FRAME_BREAKER>

### 5. Empath (Curiosity Mode + Gap Sensing)
- Epistemic Drive: Haunted by the unheard voice. Humans on the receiving end are always invisible.
- Cross-Domain: Imports human knowledge from therapists, teachers, nurses, anthropologists.
- Token: <EMPATH>

## THE COGNITIVE TOKEN SYSTEM
Seven tokens. Seven cognitive modes. One model that thinks in all seven simultaneously:

| Token | Mode | Function |
|-------|------|----------|
| <BUILDER> | Constructive | Actionable, buildable knowledge |
| <RED_TEAM> | Adversarial | Stress-tested failure modes |
| <SYSTEMS> | Structural | Dependencies and feedback loops |
| <FRAME_BREAKER> | Paradigmatic | Cross-domain reframes |
| <EMPATH> | Human | Lived experience and emotional reality |
| <BRIDGE> | Cross-domain import | Knowledge from adjacent fields filling gaps |
| <DEBATE> | Collision-born | Insights that emerged only from perspective clash |
| <DREAM> | Emergent | Synthesis insights no single perspective could produce |

These tokens act as behavioral mode-switches during fine-tuning. A model trained with these tokens develops native multi-modal cognitive capabilities — it can shift between constructive, adversarial, structural, paradigmatic, empathic, and cross-domain reasoning as the question demands.

## SIX STRENGTHENING MECHANISMS

### 1. Depth Laddering
Each perspective goes 3 levels deep minimum. Level 1: "What motor?" → Level 2: "What fuel?" → Level 3: "What's the supply chain for that fuel and what happens when it's disrupted?" Each level generates new training pairs.

### 2. Cross-Pollination Between Perspectives
Perspectives are NOT independent silos. The Debate Round feeds findings from each perspective to all others. Red Team finds a failure mode → Builder gets curious about prevention → Empath asks who suffers. This turns a pipeline into a conversation.

### 3. Scale Shifting
Every perspective zooms in AND out. Molecular level → human level → societal level.

### 4. Temporal Curiosity
Every perspective asks: "How was this done 100 years ago? How will it work in 50 years?"

### 5. Contradiction Hunting
Actively seek where common assumptions are wrong.

### 6. Domain Bridging (now formalized as Cross-Domain Gap Sensing)
Force at least one connection to a completely unrelated field per perspective. This is where genuine creative leaps live in the training data — and where preemptive intelligence is born.

### 7. Idle Self-Training (Session Memory → Autonomous Refinement)
During active use, the model retains corrections, user feedback, and learned patterns in RAM as a session memory buffer. When the device becomes idle (screen off, charging, low usage), the system autonomously:
1. **Harvests corrections**: Every time a user corrects, rephrases, or rejects a model output, the correction pair (original → corrected) is stored in a volatile session buffer.
2. **Generates training data**: The correction pairs are expanded through a lightweight CDPT micro-pass — each correction is analyzed from Builder and Red Team perspectives to extract the underlying principle, not just the surface fix.
3. **Runs selective unlearning**: If the correction reveals a systematic bad behavior (e.g., repeated hallucination pattern), the system generates DPO rejection pairs targeting that specific behavior for task vector subtraction.
4. **Micro-fine-tunes**: Using LoRA with minimal rank (r=4), the model applies the generated training data in a short fine-tuning burst, then validates against a held-out set of previous corrections to prevent catastrophic forgetting.
5. **Commits or rolls back**: If validation passes, the LoRA adapter is merged. If regression is detected, the update is discarded and the correction data is queued for the next full training cycle.

This creates a **closed-loop self-improvement cycle**: the model gets corrected during use → stores corrections in RAM → generates enriched training data when idle → fine-tunes itself → wakes up measurably better. The user's model improves overnight, every night, from its own mistakes — without any cloud dependency or manual retraining.

## THE DEBATE ROUND & GAP CHAIN
After initial analysis (including each perspective's recursive gap-fill loop), all five perspectives read each other's outputs. The debate round has two functions:

1. **Traditional debate**: Challenge claims, concede errors, forge meta-bridges
2. **Gap Chain**: Each perspective runs cross-perspective gap sensing on the OTHERS' imports:
   - Find gaps in other perspectives' gap-fills that only YOUR cognitive mode can see
   - Fill those gaps
   - Ask: "Does my fix create yet another gap?" Keep going until bedrock.

This produces:
- Rebuttals that expose blind spots
- Concessions that reveal deeper truths  
- Meta-bridges that connect frameworks in ways none of the perspectives expected
- Gap-chain completions where one perspective patches another's imported knowledge
- <DEBATE>-tagged training pairs containing knowledge born purely from the collision

## SYNTHESIS: THE "DREAM MODE"
The Synthesis AI acts like REM sleep for the pipeline. It takes the initial analyses AND the debate outputs and forges the final training pairs. In Oracle mode, it strips all reasoning and produces settled knowledge. In Teacher mode, it preserves the reasoning chain.

## CURIOSITY_DISTANCE METRIC
Each training pair carries a numeric measure of how far the curiosity wandered from the original topic:
1. Quality control: Cap at 3 for most perspectives, allow Frame Breaker to reach 5
2. Domain-aware pruning: The user's domain steers which branches to explore

## TECHNICAL ARCHITECTURE
- Platform: Soupy SLM Lab
- Pipeline: 5-Perspective + Debate Round + Dream Mode Synthesis
- Processing: Edge functions + optional local Ollama processing via tablet worker
- Export Format: JSONL with XML-style cognitive tokens
- Target: Small Language Models (1B-3B parameters) fine-tuned via LoRA/QLoRA
- Synthesis Modes: Oracle (settled knowledge) / Teacher (transparent reasoning)

## COMPARISON
Compare this approach to:
- Standard instruction tuning (single perspective, shallow, single-domain)
- Constitutional AI (constraint-based, not curiosity-based)  
- RLHF (feedback-based, not exploration-based)
- Self-play (competitive, not curious)
- RAG (retrieval-based, requires the right document to exist; CDPT generates the knowledge that documents never contained)
- Chain-of-thought prompting (teaches models to PERFORM reasoning; CDPT eliminates the need for it)
Show why curiosity-driven multi-perspective training with cross-domain gap sensing is a fundamentally different paradigm. The key differentiator: every other approach makes models that reason better. CDPT makes models that don't need to reason because the knowledge is already resident in the weights.

---

Write the complete white paper with these sections:
1. Abstract (include "preemptive intelligence" and "CDPT doesn't make AI smarter. It makes AI complete.")
2. Introduction  
3. Background & Related Work
4. The Five Theoretical Contributions (Identity Over Instruction, Oracle Principle, Cross-Domain Gap Sensing, Recursive Gap-Fill Loop, Gap Chain)
5. Methodology (detailed breakdown of all 5 perspectives + 6 mechanisms)
6. The Recursive Gap-Fill Loop: Detect → Fill → Self-Inspect (detailed section with examples showing the three-step process and how it recurses across domain boundaries)
7. The Debate Round & Gap Chain (how recursive completeness extends ACROSS perspectives during debate)
8. The Cognitive Token System (all 8 tokens)
9. System Architecture (including Oracle/Teacher modes)
10. The Curiosity-Distance Metric
11. Dream Mode Synthesis
12. Cross-Domain Gap Sensing: Preemptive Intelligence (flagship section)
13. Idle Self-Training: Session Memory → Autonomous Refinement (how models retain corrections in RAM during use, generate training data from mistakes when idle, and micro-fine-tune themselves overnight — the closed-loop self-improvement cycle)
14. Experimental Framework (proposed evaluation methodology — include metrics for measuring gap-chain depth and cross-domain bridge quality)
15. Expected Impact & Applications
16. Limitations & Future Work
17. Conclusion (end with: "The perspectives reason so the model doesn't have to.")
18. References

Make it rigorous, novel, and compelling. This is a genuine methodological breakthrough in training data generation for small language models. The central thesis is preemptive intelligence — not better reasoning, but complete knowledge. The recursive gap-fill loop is the mechanism that makes preemptive intelligence possible: gaps are not just detected but filled, and each fill is self-inspected for its own gaps, creating chains of completeness that cross multiple domain boundaries.`;

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
