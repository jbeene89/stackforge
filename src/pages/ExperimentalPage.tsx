import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Atom,
  BrainCircuit,
  Dna,
  Eye,
  Fingerprint,
  Flame,
  Gauge,
  Globe2,
  Lightbulb,
  Network,
  Orbit,
  Rocket,
  ScanEye,
  ShieldCheck,
  Sparkles,
  Waves,
  Zap,
  FlaskConical,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ExperimentalTool {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  status: "concept" | "prototype" | "alpha" | "beta";
  category: "neural" | "quantum" | "generative" | "perception" | "infrastructure";
  maturity: number; // 0-100
  techniques: string[];
  possibleUses: string[];
  risks: string[];
}

const experimentalTools: ExperimentalTool[] = [
  {
    id: "neuro-symbolic",
    name: "Neuro-Symbolic Fusion Engine",
    tagline: "Combine deep learning with formal logic reasoning",
    description:
      "A hybrid architecture that fuses neural network pattern recognition with symbolic AI reasoning. Train sub-symbolic perception modules, then chain them with first-order logic planners for tasks that require both intuition and rigorous deduction — like autonomous legal analysis or medical diagnosis pipelines.",
    icon: BrainCircuit,
    status: "prototype",
    category: "neural",
    maturity: 35,
    techniques: [
      "Differentiable Logic Programming",
      "Neural Theorem Proving",
      "Concept Bottleneck Layers",
      "Abductive Reasoning Heads",
    ],
    possibleUses: [
      "Explainable medical diagnosis",
      "Automated contract analysis",
      "Scientific hypothesis generation",
    ],
    risks: ["High compute overhead for logic grounding", "Limited tooling ecosystem"],
  },
  {
    id: "quantum-tensor",
    name: "Quantum Tensor Network Simulator",
    tagline: "Simulate quantum circuits as tensor contractions on classical hardware",
    description:
      "Run approximate quantum computations without a quantum computer. Uses tensor network decompositions (MPS, PEPS, MERA) to simulate quantum circuits up to ~50 qubits on GPU clusters. Ideal for prototyping quantum ML algorithms before deploying on real quantum hardware.",
    icon: Atom,
    status: "concept",
    category: "quantum",
    maturity: 15,
    techniques: [
      "Matrix Product States (MPS)",
      "DMRG Optimization",
      "Variational Quantum Eigensolver (VQE)",
      "Quantum Approximate Optimization (QAOA)",
    ],
    possibleUses: [
      "Drug molecule simulation",
      "Combinatorial optimization",
      "Quantum-enhanced feature maps for ML",
    ],
    risks: ["Exponential scaling beyond ~50 qubits", "Approximation fidelity trade-offs"],
  },
  {
    id: "world-model",
    name: "World Model Dreamer",
    tagline: "Agents that learn physics by dreaming",
    description:
      "Train agents that build internal world models from raw sensor data, then 'dream' — simulate thousands of trajectories in latent space before acting. Based on DreamerV3 and JEPA architectures. Enables sample-efficient reinforcement learning for robotics and autonomous navigation.",
    icon: Orbit,
    status: "alpha",
    category: "neural",
    maturity: 45,
    techniques: [
      "Latent Dynamics Models",
      "Recurrent State Space Models (RSSM)",
      "Joint Embedding Predictive Architecture (JEPA)",
      "Imagination-Based Planning",
    ],
    possibleUses: [
      "Sim-to-real robot transfer",
      "Autonomous vehicle planning",
      "Game AI with minimal training data",
    ],
    risks: ["World model drift over long horizons", "Catastrophic forgetting in non-stationary envs"],
  },
  {
    id: "diffusion-code",
    name: "Diffusion Code Synthesizer",
    tagline: "Generate entire codebases via iterative denoising",
    description:
      "Instead of autoregressive token-by-token generation, this synthesizer generates code in parallel using discrete diffusion. Start from noise, iteratively refine toward a complete program. Produces more globally coherent code structures and can 'infill' arbitrary regions simultaneously.",
    icon: Sparkles,
    status: "concept",
    category: "generative",
    maturity: 10,
    techniques: [
      "Discrete Denoising Diffusion (D3PM)",
      "Masked Diffusion Transformers",
      "Classifier-Free Guidance for Code",
      "AST-Constrained Sampling",
    ],
    possibleUses: [
      "Full-project code generation",
      "Parallel code infilling",
      "Architecture-aware refactoring",
    ],
    risks: ["Slower inference than autoregressive", "Syntax validity not guaranteed without AST constraints"],
  },
  {
    id: "neural-radiance",
    name: "Neural Radiance Composer",
    tagline: "Compose 3D scenes from text and sparse images",
    description:
      "Combines text-to-3D generation with Neural Radiance Fields (NeRF) and 3D Gaussian Splatting for real-time scene composition. Describe a scene in natural language, supply optional reference images, and get a navigable 3D environment with physically-based lighting.",
    icon: Eye,
    status: "prototype",
    category: "perception",
    maturity: 30,
    techniques: [
      "3D Gaussian Splatting",
      "Score Distillation Sampling (SDS)",
      "Multi-View Diffusion Priors",
      "Physically-Based Material Estimation",
    ],
    possibleUses: [
      "Instant game level design",
      "VR/AR environment authoring",
      "Digital twin generation from photos",
    ],
    risks: ["Geometric artifacts in complex scenes", "High VRAM requirements (24GB+)"],
  },
  {
    id: "bio-compute",
    name: "Bio-Inspired Compute Fabric",
    tagline: "Spiking neural networks on neuromorphic substrates",
    description:
      "Deploy spiking neural networks (SNNs) that process information as temporal spike trains rather than floating-point activations. Achieves 100-1000x energy efficiency for edge inference. Targets Intel Loihi 2, BrainChip Akida, and SpiNNaker 2 neuromorphic chips.",
    icon: Dna,
    status: "concept",
    category: "infrastructure",
    maturity: 20,
    techniques: [
      "Leaky Integrate-and-Fire (LIF) Neurons",
      "Spike-Timing Dependent Plasticity (STDP)",
      "Surrogate Gradient Training",
      "Event-Driven Processing",
    ],
    possibleUses: [
      "Ultra-low-power always-on sensors",
      "Brain-computer interface signal processing",
      "Real-time anomaly detection at the edge",
    ],
    risks: ["Limited chip availability", "Sparse toolchain and framework support"],
  },
  {
    id: "federated-swarm",
    name: "Federated Swarm Intelligence",
    tagline: "Distributed learning across untrusted device swarms",
    description:
      "Coordinate model training across thousands of heterogeneous devices without centralizing data. Combines federated learning with swarm optimization — devices negotiate model updates using gossip protocols, differential privacy, and secure aggregation. No central server required.",
    icon: Network,
    status: "alpha",
    category: "infrastructure",
    maturity: 40,
    techniques: [
      "Decentralized Federated Averaging",
      "Gossip-Based Gradient Exchange",
      "Differential Privacy (ε-δ)",
      "Homomorphic Encryption for Aggregation",
    ],
    possibleUses: [
      "Privacy-preserving healthcare ML",
      "IoT fleet learning",
      "Cross-organization model collaboration",
    ],
    risks: ["Communication overhead in sparse networks", "Byzantine fault tolerance complexity"],
  },
  {
    id: "liquid-nn",
    name: "Liquid Neural Networks",
    tagline: "Continuously adapting networks inspired by C. elegans",
    description:
      "Neural networks with time-varying synaptic weights governed by ordinary differential equations. Unlike static networks, liquid NNs continuously adapt their internal dynamics based on input timing, making them exceptionally compact and interpretable for time-series and control tasks.",
    icon: Waves,
    status: "beta",
    category: "neural",
    maturity: 60,
    techniques: [
      "Neural ODEs with Learned Dynamics",
      "Closed-Form Continuous-Depth (CfC) Layers",
      "Causal Attention over Time",
      "Sparse Wiring Optimization",
    ],
    possibleUses: [
      "Autonomous drone navigation (19 neurons replacing millions)",
      "Real-time financial signal processing",
      "Compact on-device adaptation",
    ],
    risks: ["ODE solver overhead for long sequences", "Sensitivity to initial conditions"],
  },
  {
    id: "adversarial-forge",
    name: "Adversarial Robustness Forge",
    tagline: "Stress-test any model against cutting-edge attacks",
    description:
      "An automated red-teaming pipeline that probes models with state-of-the-art adversarial attacks: PGD, AutoAttack, universal perturbations, backdoor triggers, prompt injection, and jailbreak chains. Generates robustness certificates and hardening recommendations.",
    icon: ShieldCheck,
    status: "prototype",
    category: "infrastructure",
    maturity: 35,
    techniques: [
      "Projected Gradient Descent (PGD)",
      "AutoAttack Ensemble",
      "Certified Robustness via Randomized Smoothing",
      "LLM Red-Teaming Chains",
    ],
    possibleUses: [
      "Pre-deployment model security audit",
      "Regulatory compliance testing",
      "Continuous adversarial monitoring",
    ],
    risks: ["High compute cost for certification", "Arms race with novel attack vectors"],
  },
  {
    id: "morphogenetic-design",
    name: "Morphogenetic Design Engine",
    tagline: "Grow structures using biological growth algorithms",
    description:
      "Generate organic, optimized physical structures using reaction-diffusion systems, L-systems, and cellular automata. Designs self-organize like biological tissue — producing lightweight, strong geometries impossible to create with traditional CAD. Export to 3D printing or simulation.",
    icon: Fingerprint,
    status: "concept",
    category: "generative",
    maturity: 12,
    techniques: [
      "Reaction-Diffusion Morphogenesis",
      "L-System Grammar Expansion",
      "Topology Optimization via Neural Fields",
      "Multi-Material Cellular Automata",
    ],
    possibleUses: [
      "Generative architecture",
      "Lightweight aerospace components",
      "Bio-inspired prosthetics design",
    ],
    risks: ["Manufacturability constraints", "Slow convergence for large-scale structures"],
  },
  {
    id: "zero-shot-sensor",
    name: "Zero-Shot Sensor Fusion",
    tagline: "Fuse arbitrary sensor modalities without paired training data",
    description:
      "A foundation model approach to sensor fusion: embed any sensor modality (LiDAR, radar, thermal, acoustic, hyperspectral) into a shared latent space using modality-agnostic transformers. Fuse new sensor types at inference time with zero paired examples.",
    icon: ScanEye,
    status: "alpha",
    category: "perception",
    maturity: 25,
    techniques: [
      "Modality-Agnostic Tokenization",
      "Cross-Modal Contrastive Pre-training",
      "Prompt-Based Sensor Adapters",
      "Late Fusion with Uncertainty Calibration",
    ],
    possibleUses: [
      "Multi-sensor robotics without retraining",
      "Emergency response with ad-hoc sensor networks",
      "Industrial inspection with mixed sensor suites",
    ],
    risks: ["Alignment quality degrades with rare modalities", "Calibration challenges across sensors"],
  },
  {
    id: "energy-harvesting-ai",
    name: "Energy-Harvesting AI Runtime",
    tagline: "AI inference powered by ambient energy alone",
    description:
      "A compute-aware inference runtime that dynamically adjusts model complexity based on available harvested energy (solar, RF, thermal, kinetic). Uses progressive inference — delivering coarse predictions instantly and refining as energy budget allows. Targets perpetual, batteryless IoT AI.",
    icon: Zap,
    status: "concept",
    category: "infrastructure",
    maturity: 8,
    techniques: [
      "Anytime Neural Networks",
      "Energy-Aware Early Exit",
      "Intermittent Computing Checkpointing",
      "Sub-threshold Voltage Inference",
    ],
    possibleUses: [
      "Perpetual environmental monitoring",
      "Batteryless wearable health sensors",
      "Infrastructure-free wildlife tracking",
    ],
    risks: ["Unpredictable energy availability", "Extremely limited model capacity"],
  },
];

const statusConfig = {
  concept: { label: "Concept", color: "bg-muted text-muted-foreground", icon: Lightbulb },
  prototype: { label: "Prototype", color: "bg-accent text-accent-foreground", icon: FlaskConical },
  alpha: { label: "Alpha", color: "bg-primary/20 text-primary", icon: Rocket },
  beta: { label: "Beta", color: "bg-primary text-primary-foreground", icon: Gauge },
};

const categories = [
  { id: "all", label: "All" },
  { id: "neural", label: "Neural Architectures" },
  { id: "quantum", label: "Quantum" },
  { id: "generative", label: "Generative" },
  { id: "perception", label: "Perception" },
  { id: "infrastructure", label: "Infrastructure" },
];

export default function ExperimentalPage() {
  const [selectedTool, setSelectedTool] = useState<ExperimentalTool | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  const filtered =
    activeCategory === "all"
      ? experimentalTools
      : experimentalTools.filter((t) => t.category === activeCategory);

  const handleEnroll = (tool: ExperimentalTool) => {
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      if (next.has(tool.id)) {
        next.delete(tool.id);
        toast({ title: `Left ${tool.name} preview` });
      } else {
        next.add(tool.id);
        toast({ title: `Enrolled in ${tool.name}`, description: "You'll be notified when it's ready." });
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Experimental Lab
                <Badge variant="outline" className="text-xs font-normal border-primary/40 text-primary">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Unstable
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                Bleeding-edge research tools & techniques — use at your own risk
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Updated March 2026</span>
        </div>
      </div>

      {/* Category Filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tools List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((tool) => {
            const StatusIcon = statusConfig[tool.status].icon;
            const isEnrolled = enrolledIds.has(tool.id);
            const isSelected = selectedTool?.id === tool.id;
            return (
              <Card
                key={tool.id}
                className={`cursor-pointer transition-all hover:border-primary/40 ${
                  isSelected ? "border-primary ring-1 ring-primary/30" : ""
                }`}
                onClick={() => setSelectedTool(tool)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                        <tool.icon className="h-4.5 w-4.5 text-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{tool.name}</CardTitle>
                        <CardDescription className="text-xs">{tool.tagline}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${statusConfig[tool.status].color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[tool.status].label}
                      </Badge>
                      {isEnrolled && (
                        <Badge variant="outline" className="text-[10px] border-primary text-primary">
                          Enrolled
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Maturity bar */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground w-14">Maturity</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-primary transition-all"
                        style={{ width: `${tool.maturity}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{tool.maturity}%</span>
                  </div>
                  {/* Technique pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tool.techniques.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                    {tool.techniques.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        +{tool.techniques.length - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedTool ? (
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <selectedTool.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{selectedTool.name}</CardTitle>
                    <Badge className={`text-[10px] mt-1 ${statusConfig[selectedTool.status].color}`}>
                      {statusConfig[selectedTool.status].label} · {selectedTool.maturity}% mature
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-5 pr-3">
                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Overview
                      </h4>
                      <p className="text-sm text-foreground/90 leading-relaxed">{selectedTool.description}</p>
                    </div>

                    {/* Techniques */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Key Techniques
                      </h4>
                      <ul className="space-y-1">
                        {selectedTool.techniques.map((t) => (
                          <li key={t} className="text-sm flex items-start gap-2">
                            <Globe2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Use Cases */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Possible Applications
                      </h4>
                      <ul className="space-y-1">
                        {selectedTool.possibleUses.map((u) => (
                          <li key={u} className="text-sm flex items-start gap-2">
                            <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                            <span>{u}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Known Risks
                      </h4>
                      <ul className="space-y-1">
                        {selectedTool.risks.map((r) => (
                          <li key={r} className="text-sm flex items-start gap-2 text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Enroll button */}
                    <Button
                      className="w-full"
                      variant={enrolledIds.has(selectedTool.id) ? "outline" : "default"}
                      onClick={() => handleEnroll(selectedTool)}
                    >
                      {enrolledIds.has(selectedTool.id) ? "Leave Preview Program" : "Enroll in Early Access"}
                    </Button>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-64">
              <div className="text-center text-muted-foreground">
                <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select a tool to explore</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
