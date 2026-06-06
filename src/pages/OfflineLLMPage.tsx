import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Cpu, Download, Zap } from "lucide-react";

/**
 * SEO landing page targeting "offline llm" (KDI 17, ~260/mo).
 * Public, content-rich, single H1, FAQ schema, internal links to /signup and /slm-lab.
 */
export default function OfflineLLMPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is an offline LLM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An offline LLM is a large language model that runs entirely on your own device — no API calls, no cloud servers, no internet required after the model is downloaded. Your prompts and outputs never leave your machine.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need a powerful GPU to run an offline LLM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Not anymore. Small language models (1B–3B parameters) run smoothly on modern laptops via WebGPU, and on phones with 6GB+ RAM. SoupyLab automatically picks a model size that fits your hardware.",
        },
      },
      {
        "@type": "Question",
        name: "Is an offline LLM actually private?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — when the model runs locally, your prompts never touch a third-party server. SoupyLab loads models directly into your browser via WebGPU, so even we cannot see what you ask.",
        },
      },
      {
        "@type": "Question",
        name: "Can I train an offline LLM on my own data?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. SoupyLab lets you fine-tune a small language model on your own documents, chats, or notes, then export it as a GGUF file for Ollama, LM Studio, or any local runtime.",
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Offline LLM — run private AI models on your own device"
        description="Run a private, offline LLM on your laptop or phone. No cloud, no API keys, no data leaks. SoupyLab loads small language models locally via WebGPU."
        canonicalPath="/offline-llm"
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="min-h-screen bg-background text-foreground">
        {/* Hero */}
        <section className="container mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-mono text-primary mb-6">
            <Shield className="w-3 h-3" /> 100% local · no cloud
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Offline LLM — your own private AI, running entirely on your device
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl">
            Load a small language model directly in your browser or laptop. No API
            keys, no third-party servers, no data leaving your machine. SoupyLab makes
            it a one-click setup.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/signup">
                Start free — 50 credits <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/slm-lab">Try the 60-second demo</Link>
            </Button>
          </div>
        </section>

        {/* Why offline */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            Why run an LLM offline?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Real privacy</h3>
              <p className="text-sm text-muted-foreground">
                Your prompts and outputs never leave your hardware. There is no API
                call to inspect, log, or train on. Lawyers, doctors, and researchers
                use this for the same reason: regulated data should not touch a
                vendor's servers.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Zero latency, zero bill</h3>
              <p className="text-sm text-muted-foreground">
                No per-token charges. No rate limits. No outage to wait through.
                Once a model is loaded, inference is as fast as your hardware allows
                — usually instantaneous for short prompts.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <Cpu className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Works on a plane</h3>
              <p className="text-sm text-muted-foreground">
                A modern laptop runs a 3B-parameter model comfortably. A phone with
                6GB of RAM runs a 1B model. SoupyLab picks the size for your
                hardware automatically.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">How SoupyLab runs offline</h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-mono flex items-center justify-center">
                1
              </span>
              <div>
                <h3 className="font-semibold mb-1">Pick a model size</h3>
                <p className="text-muted-foreground text-sm">
                  Start with a 1B–3B parameter model. SoupyLab caches it in your
                  browser the first time, so subsequent loads are instant.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-mono flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="font-semibold mb-1">Run inference in WebGPU</h3>
                <p className="text-muted-foreground text-sm">
                  The model executes on your machine's GPU through WebGPU. No
                  server round trip. Your tab is the runtime.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-mono flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="font-semibold mb-1">Export and self-host</h3>
                <p className="text-muted-foreground text-sm">
                  When you want it on a server or phone, export to GGUF and run
                  with Ollama, LM Studio, or llama.cpp. Same model, anywhere.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Comparison */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Offline LLM vs cloud API
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">&nbsp;</th>
                  <th className="text-left p-4 font-semibold">Cloud API (OpenAI, Anthropic)</th>
                  <th className="text-left p-4 font-semibold">Offline LLM (SoupyLab)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="p-4 font-medium">Data leaves your device</td><td className="p-4 text-muted-foreground">Yes</td><td className="p-4 text-primary">No</td></tr>
                <tr><td className="p-4 font-medium">Per-token cost</td><td className="p-4 text-muted-foreground">Yes</td><td className="p-4 text-primary">No</td></tr>
                <tr><td className="p-4 font-medium">Works without internet</td><td className="p-4 text-muted-foreground">No</td><td className="p-4 text-primary">Yes</td></tr>
                <tr><td className="p-4 font-medium">Frontier model quality</td><td className="p-4 text-primary">Yes</td><td className="p-4 text-muted-foreground">Smaller, task-tuned</td></tr>
                <tr><td className="p-4 font-medium">Fine-tune on your data</td><td className="p-4 text-muted-foreground">Limited / expensive</td><td className="p-4 text-primary">Yes, included</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">FAQ</h2>
          <dl className="space-y-6">
            {faqJsonLd.mainEntity.map((q) => (
              <div key={q.name} className="border-b border-border pb-6">
                <dt className="text-lg font-semibold mb-2">{q.name}</dt>
                <dd className="text-muted-foreground">{q.acceptedAnswer.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 max-w-3xl text-center">
          <Download className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Build your offline LLM in under 5 minutes
          </h2>
          <p className="text-muted-foreground mb-8">
            Free tier includes 50 credits, no card required. Bring your own data,
            export the model, keep it forever.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">
              Start free <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <div className="mt-8 text-sm text-muted-foreground">
            Also see: <Link to="/train-your-own-llm" className="text-primary hover:underline">Train your own LLM</Link>
            {" · "}
            <Link to="/slm-lab" className="text-primary hover:underline">Open SLM Lab</Link>
            {" · "}
            <Link to="/pricing" className="text-primary hover:underline">Pricing</Link>
          </div>
        </section>
      </main>
    </>
  );
}
