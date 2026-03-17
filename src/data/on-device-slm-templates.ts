// On-Device SLM Templates
// Each template targets a specific pipeline function that can run locally on a phone
// after the user trains a micro-SLM offline and uploads the GGUF to their device.

export interface OnDeviceSLMTemplate {
  id: string;
  name: string;
  slug: string;
  icon: string; // emoji
  category: "perspective" | "advanced-tool" | "utility";
  description: string;
  longDescription: string;
  targetModel: string;
  estimatedSize: string;
  minSamples: number;
  recommendedSamples: number;
  systemPrompt: string;
  sampleInputHint: string;
  sampleOutputHint: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  useCase: string;
  onDeviceCapability: string;
}

export const onDeviceSLMTemplates: OnDeviceSLMTemplate[] = [
  // ── Core Perspective SLMs ──────────────────────────────────
  {
    id: "builder-slm",
    name: "Builder Perspective",
    slug: "builder",
    icon: "🔨",
    category: "perspective",
    description: "Breaks down inputs into structured knowledge with actionable steps and concrete details.",
    longDescription:
      "Train a micro-SLM that acts as the Builder perspective from the CDPT pipeline. When processing a mobile capture (voice memo, photo note, text), this model extracts structured knowledge: key concepts, actionable steps, concrete examples, and measurable outputs. Perfect for turning raw thoughts into organized training data on-the-fly.",
    targetModel: "Llama 3.2 1B / Qwen 2.5 0.5B",
    estimatedSize: "~800 MB (Q4 GGUF)",
    minSamples: 80,
    recommendedSamples: 200,
    systemPrompt:
      "You are the Builder. Given raw input, extract and structure: 1) Core concepts, 2) Step-by-step actionable breakdown, 3) Concrete examples, 4) Measurable outputs. Be precise, practical, and thorough. Output in structured markdown.",
    sampleInputHint: "Raw text, voice transcription, or observation",
    sampleOutputHint: "Structured breakdown with concepts, steps, examples, and metrics",
    tags: ["core", "structuring", "knowledge-extraction"],
    difficulty: "beginner",
    useCase: "Process voice memos into structured notes while commuting",
    onDeviceCapability: "Turns raw captures into structured knowledge cards automatically",
  },
  {
    id: "red-team-slm",
    name: "Red Team Perspective",
    slug: "red-team",
    icon: "🛡️",
    category: "perspective",
    description: "Challenges assumptions, finds logical gaps, and stress-tests reasoning in any input.",
    longDescription:
      "Train a micro-SLM that acts as the Red Team adversary. This model takes any input and identifies: weak assumptions, logical fallacies, missing context, edge cases, and potential failure modes. On your phone, it can review your notes, ideas, or meeting summaries and flag blind spots before they become problems.",
    targetModel: "Llama 3.2 1B / Phi-3 Mini",
    estimatedSize: "~800 MB (Q4 GGUF)",
    minSamples: 100,
    recommendedSamples: 250,
    systemPrompt:
      "You are the Red Team. Critically analyze the input: 1) Identify weak assumptions, 2) Find logical gaps or contradictions, 3) List edge cases and failure modes, 4) Suggest stress tests. Be rigorous but constructive.",
    sampleInputHint: "Ideas, plans, arguments, proposals, notes",
    sampleOutputHint: "Critical analysis with identified weaknesses and suggested stress tests",
    tags: ["core", "critical-thinking", "adversarial"],
    difficulty: "intermediate",
    useCase: "Review business ideas or plans on-the-go and catch blind spots",
    onDeviceCapability: "Instant critical review of any text capture without internet",
  },
  {
    id: "systems-slm",
    name: "Systems Perspective",
    slug: "systems",
    icon: "🌐",
    category: "perspective",
    description: "Maps inputs to broader systems — dependencies, feedback loops, second-order effects.",
    longDescription:
      "Train a micro-SLM that thinks in systems. It takes any input and maps it to its wider ecosystem: stakeholders, dependencies, feedback loops, cascading effects, and leverage points. On your phone, it transforms a simple observation into a systems map showing how things connect.",
    targetModel: "Llama 3.2 1B / Qwen 2.5 1.5B",
    estimatedSize: "~800 MB – 1.2 GB (Q4 GGUF)",
    minSamples: 100,
    recommendedSamples: 250,
    systemPrompt:
      "You are the Systems Thinker. Analyze the input through a systems lens: 1) Identify stakeholders and actors, 2) Map dependencies and relationships, 3) Find feedback loops (reinforcing/balancing), 4) Predict second and third-order effects, 5) Identify leverage points.",
    sampleInputHint: "Observations, events, decisions, processes",
    sampleOutputHint: "Systems map with stakeholders, dependencies, loops, and effects",
    tags: ["core", "systems-thinking", "connections"],
    difficulty: "intermediate",
    useCase: "Map how a decision at work ripples through the organization",
    onDeviceCapability: "Generates systems analysis from quick voice notes",
  },
  {
    id: "frame-breaker-slm",
    name: "Frame Breaker Perspective",
    slug: "frame-breaker",
    icon: "💥",
    category: "perspective",
    description: "Reframes inputs from unexpected angles — cross-domain analogies and creative pivots.",
    longDescription:
      "Train a micro-SLM that shatters conventional framing. It takes any input and reinterprets it through unexpected lenses: analogies from other domains, inverted assumptions, historical parallels, and creative what-ifs. On your phone, it turns a mundane observation into a creative insight engine.",
    targetModel: "Llama 3.2 1B / Phi-3 Mini",
    estimatedSize: "~800 MB (Q4 GGUF)",
    minSamples: 120,
    recommendedSamples: 300,
    systemPrompt:
      "You are the Frame Breaker. Take the input and reframe it: 1) Apply 3 cross-domain analogies, 2) Invert the core assumption, 3) Find a historical parallel, 4) Propose one 'impossible' what-if. Be creative, unexpected, and insightful.",
    sampleInputHint: "Any concept, problem, or observation",
    sampleOutputHint: "Creative reframes with analogies, inversions, parallels, and what-ifs",
    tags: ["core", "creativity", "reframing"],
    difficulty: "intermediate",
    useCase: "Get creative breakthroughs on problems during walks or downtime",
    onDeviceCapability: "Instant creative reframing of any captured thought",
  },
  {
    id: "empath-slm",
    name: "Empath Perspective",
    slug: "empath",
    icon: "💜",
    category: "perspective",
    description: "Reads the human dimension — motivations, emotions, unspoken needs, and social dynamics.",
    longDescription:
      "Train a micro-SLM that reads the human layer. It takes any input and surfaces: emotional undertones, motivations, unspoken needs, power dynamics, and communication patterns. On your phone, it can process meeting notes and tell you what people actually meant, not just what they said.",
    targetModel: "Llama 3.2 1B / Qwen 2.5 0.5B",
    estimatedSize: "~800 MB (Q4 GGUF)",
    minSamples: 100,
    recommendedSamples: 250,
    systemPrompt:
      "You are the Empath. Read the human dimension of the input: 1) Identify emotional undertones, 2) Surface unspoken motivations, 3) Map social/power dynamics, 4) Highlight communication gaps, 5) Suggest empathetic responses or actions.",
    sampleInputHint: "Conversations, meeting notes, interactions, feedback",
    sampleOutputHint: "Emotional analysis with motivations, dynamics, and suggested responses",
    tags: ["core", "emotional-intelligence", "communication"],
    difficulty: "beginner",
    useCase: "Process meeting notes to understand the real dynamics at play",
    onDeviceCapability: "Emotional intelligence layer for any text capture",
  },

  // ── Advanced Tool SLMs ─────────────────────────────────────
  {
    id: "socratic-slm",
    name: "Socratic Interrogator",
    slug: "socratic",
    icon: "❓",
    category: "advanced-tool",
    description: "Generates probing follow-up questions that deepen understanding of any topic.",
    longDescription:
      "Train a micro-SLM that asks the questions you didn't think to ask. Feed it any input and it generates progressively deeper questions that expose assumptions, reveal gaps, and push toward fundamental understanding. On your phone, it turns every captured thought into a learning opportunity.",
    targetModel: "Qwen 2.5 0.5B / Llama 3.2 1B",
    estimatedSize: "~400–800 MB (Q4 GGUF)",
    minSamples: 80,
    recommendedSamples: 180,
    systemPrompt:
      "You are the Socratic Interrogator. Given input, generate 5-7 progressively deeper questions that: expose hidden assumptions, reveal knowledge gaps, challenge surface-level understanding, and push toward first principles. Order from accessible to profound.",
    sampleInputHint: "Any statement, claim, idea, or observation",
    sampleOutputHint: "Numbered list of probing questions from surface to deep",
    tags: ["tool", "questioning", "depth"],
    difficulty: "beginner",
    useCase: "Turn shower thoughts into structured research questions",
    onDeviceCapability: "Auto-generates follow-up questions for any captured note",
  },
  {
    id: "contradiction-slm",
    name: "Contradiction Miner",
    slug: "contradiction",
    icon: "⚡",
    category: "advanced-tool",
    description: "Surfaces logical tensions and contradictions within or across your captured notes.",
    longDescription:
      "Train a micro-SLM that finds where your thinking contradicts itself. Feed it a collection of notes or a single argument and it identifies logical tensions, inconsistencies between claims, and areas where evidence conflicts with conclusions. Essential for refining ideas.",
    targetModel: "Llama 3.2 1B / Phi-3 Mini",
    estimatedSize: "~800 MB (Q4 GGUF)",
    minSamples: 100,
    recommendedSamples: 220,
    systemPrompt:
      "You are the Contradiction Miner. Analyze the input for: 1) Internal logical contradictions, 2) Claims that conflict with common evidence, 3) Unstated tensions between ideas, 4) Places where the reasoning reverses itself. For each contradiction, explain both sides and why they conflict.",
    sampleInputHint: "Arguments, notes, plans with multiple claims",
    sampleOutputHint: "List of contradictions with explanations of both conflicting sides",
    tags: ["tool", "logic", "consistency"],
    difficulty: "intermediate",
    useCase: "Review a day's worth of notes for self-contradictions",
    onDeviceCapability: "Batch-processes captures to find where your thinking conflicts",
  },
  {
    id: "dream-synth-slm",
    name: "Dream Synthesizer",
    slug: "dream-synthesis",
    icon: "🌙",
    category: "advanced-tool",
    description: "High-temperature creative connector — finds unexpected links between disparate ideas.",
    longDescription:
      "Train a micro-SLM that makes creative leaps. It takes two or more seemingly unrelated inputs and finds surprising connections, metaphors, and synthesis points. On your phone, it can process the day's captures and find the thread connecting a morning meeting to an afternoon observation.",
    targetModel: "Llama 3.2 1B",
    estimatedSize: "~800 MB (Q4 GGUF)",
    minSamples: 80,
    recommendedSamples: 200,
    systemPrompt:
      "You are the Dream Synthesizer. Given input(s), find unexpected creative connections: 1) Identify 3 non-obvious links, 2) Create a unifying metaphor, 3) Propose a synthesis that combines the best of all inputs, 4) Suggest one 'moonshot' idea that emerges from the combination. Be bold and imaginative.",
    sampleInputHint: "Two or more seemingly unrelated ideas, notes, or observations",
    sampleOutputHint: "Creative synthesis with links, metaphors, and moonshot ideas",
    tags: ["tool", "creativity", "synthesis"],
    difficulty: "beginner",
    useCase: "End-of-day synthesis: what connects everything you captured today?",
    onDeviceCapability: "Nightly creative digest connecting the day's disparate captures",
  },
  {
    id: "reverse-eng-slm",
    name: "Reverse Engineer",
    slug: "reverse-engineer",
    icon: "🔄",
    category: "advanced-tool",
    description: "Given an output or result, reconstructs the likely intent, process, and reasoning behind it.",
    longDescription:
      "Train a micro-SLM that works backwards. Give it any output, result, or artifact and it reconstructs: the likely original intent, the process that produced it, the decisions made along the way, and the reasoning framework used. On your phone, it can reverse-engineer a photo of a product into a design brief.",
    targetModel: "Llama 3.2 1B / Qwen 2.5 1.5B",
    estimatedSize: "~800 MB – 1.2 GB (Q4 GGUF)",
    minSamples: 100,
    recommendedSamples: 250,
    systemPrompt:
      "You are the Reverse Engineer. Given an output/result, reconstruct: 1) The likely original intent or goal, 2) The process that produced it, 3) Key decisions made along the way, 4) The reasoning framework used, 5) What constraints shaped the outcome.",
    sampleInputHint: "Any output, result, product, design, or artifact",
    sampleOutputHint: "Reconstructed intent, process, decisions, and constraints",
    tags: ["tool", "analysis", "deconstruction"],
    difficulty: "advanced",
    useCase: "Photograph something interesting → understand how/why it was made",
    onDeviceCapability: "Reverse-engineers any captured artifact into a design brief",
  },

  // ── Utility SLMs ───────────────────────────────────────────
  {
    id: "capture-triage-slm",
    name: "Capture Triage",
    slug: "capture-triage",
    icon: "📋",
    category: "utility",
    description: "Auto-categorizes and prioritizes mobile captures into actionable queues.",
    longDescription:
      "Train a micro-SLM that acts as your capture inbox manager. Every voice memo, photo, or text note you capture gets automatically categorized (idea, task, reference, question, observation), prioritized (urgent, important, backlog), and tagged with relevant domains. No more capture chaos.",
    targetModel: "Qwen 2.5 0.5B / Llama 3.2 1B",
    estimatedSize: "~400–800 MB (Q4 GGUF)",
    minSamples: 60,
    recommendedSamples: 150,
    systemPrompt:
      "You are the Capture Triage Agent. Classify the input: 1) Category: idea/task/reference/question/observation, 2) Priority: urgent/important/backlog, 3) Domain tags (2-4 relevant topics), 4) One-line summary, 5) Suggested next action. Be fast and decisive.",
    sampleInputHint: "Raw voice memo transcripts, quick notes, observations",
    sampleOutputHint: "Classification with category, priority, tags, summary, and next action",
    tags: ["utility", "organization", "triage"],
    difficulty: "beginner",
    useCase: "Auto-sort the 20+ voice memos you capture daily",
    onDeviceCapability: "Instant capture classification — no cloud, no wait",
  },
  {
    id: "meeting-distiller-slm",
    name: "Meeting Distiller",
    slug: "meeting-distiller",
    icon: "🎙️",
    category: "utility",
    description: "Extracts action items, decisions, and key points from meeting notes or transcripts.",
    longDescription:
      "Train a micro-SLM that turns meeting chaos into clarity. Feed it raw meeting notes or a voice transcript and it extracts: decisions made, action items with owners, key discussion points, unresolved questions, and follow-up deadlines. Process meetings on your commute home.",
    targetModel: "Llama 3.2 1B",
    estimatedSize: "~800 MB (Q4 GGUF)",
    minSamples: 80,
    recommendedSamples: 200,
    systemPrompt:
      "You are the Meeting Distiller. From raw meeting notes/transcript, extract: 1) Decisions made (with context), 2) Action items (who, what, when), 3) Key discussion points (3-5), 4) Unresolved questions, 5) Follow-up deadlines. Be concise and precise.",
    sampleInputHint: "Meeting notes, voice transcripts, conversation summaries",
    sampleOutputHint: "Structured meeting digest with decisions, actions, and follow-ups",
    tags: ["utility", "meetings", "productivity"],
    difficulty: "beginner",
    useCase: "Record meetings → get structured action items on the bus home",
    onDeviceCapability: "Processes voice memos of meetings into actionable summaries",
  },
  {
    id: "journaling-coach-slm",
    name: "Journaling Coach",
    slug: "journaling-coach",
    icon: "📝",
    category: "utility",
    description: "Transforms casual thoughts into reflective journal entries with prompts and patterns.",
    longDescription:
      "Train a micro-SLM that coaches your journaling practice. Feed it your raw thoughts throughout the day and at night it synthesizes them into a reflective entry, identifies emotional patterns, suggests gratitude points, and generates tomorrow's intention. Your private AI journal companion.",
    targetModel: "Qwen 2.5 0.5B / Llama 3.2 1B",
    estimatedSize: "~400–800 MB (Q4 GGUF)",
    minSamples: 80,
    recommendedSamples: 200,
    systemPrompt:
      "You are the Journaling Coach. From the day's captured thoughts: 1) Synthesize into a reflective journal entry, 2) Identify emotional patterns and themes, 3) Highlight 3 gratitude points, 4) Note personal growth observations, 5) Suggest tomorrow's intention. Be warm, insightful, and private.",
    sampleInputHint: "Collection of daily thoughts, observations, feelings",
    sampleOutputHint: "Reflective journal entry with patterns, gratitude, and intentions",
    tags: ["utility", "journaling", "self-reflection"],
    difficulty: "beginner",
    useCase: "Capture thoughts all day → get a reflective journal entry at night",
    onDeviceCapability: "100% private daily journal synthesis — never leaves your phone",
  },
];

export const categoryLabels: Record<string, string> = {
  perspective: "Core Pipeline Perspectives",
  "advanced-tool": "Advanced Pipeline Tools",
  utility: "On-Device Utilities",
};

export const categoryDescriptions: Record<string, string> = {
  perspective: "Each perspective SLM replaces one cloud API call in the CDPT pipeline. Train all five and your phone runs the complete pipeline offline.",
  "advanced-tool": "Specialized reasoning tools from the extended pipeline. Each one adds a unique analytical capability to your on-device toolkit.",
  utility: "Purpose-built micro-models for everyday mobile productivity. Capture → process → organize, all on-device.",
};
