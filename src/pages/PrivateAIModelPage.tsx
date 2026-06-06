import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Building2, FileCheck, ServerOff } from "lucide-react";

/**
 * SEO landing page targeting "private ai model" — high commercial intent.
 * Public, single H1, FAQ schema, internal links to /signup, /slm-lab, /pricing.
 */
export default function PrivateAIModelPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a private AI model?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A private AI model is a language model that you own, host, and control end-to-end. Your prompts, your training data, and the model weights stay inside your environment — never sent to a third-party API.",
        },
      },
      {
        "@type": "Question",
        name: "How is a private AI model different from ChatGPT or Claude?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ChatGPT and Claude are shared cloud services — every prompt leaves your network and is processed on the vendor's servers. A private AI model runs on hardware you control (your laptop, your phone, or your own server), so regulated and confidential data never leaves your perimeter.",
        },
      },
      {
        "@type": "Question",
        name: "Can a private AI model be fine-tuned on company data?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. SoupyLab lets you fine-tune a small language model on your own documents, transcripts, or knowledge base, then export the weights as GGUF or Safetensors so you can run it inside your VPC, on a workstation, or on-device.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to be a machine-learning engineer to build one?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. SoupyLab's guided pipeline walks you through data import, training, evaluation, and export with visual action cards — no Python required for the basic workflow. Engineers can drop into the generated train.py at any point.",
        },
      },
      {
        "@type": "Question",
        name: "Is a private AI model HIPAA / GDPR friendly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Because the model runs locally and data never transits a third party, a private AI model removes the most common compliance risk vector for generative AI — vendor processing of regulated personal data. You still own your overall compliance posture, but the architecture is built around data minimisation.",
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Private AI Model — own, train, and deploy your own LLM"
        description="Build a private AI model your company actually owns. Train on your own data, run on your own hardware, export the weights. No vendor lock-in, no data leaks."
        canonicalPath="/private-ai-model"
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
            <Lock className="w-3 h-3" /> you own the weights · you own the data
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Private AI Model — your own LLM, trained on your data, hosted by you
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl">
            Stop renting intelligence from a vendor. Build a private AI model on your
            own documents, export the weights, and run it on your hardware — laptop,
            phone, or air-gapped server.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/signup">
                Start free — 50 credits <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/slm-lab">See the 60-second build</Link>
            </Button>
          </div>
        </section>

        {/* Why private */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            Why teams build private AI models
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Regulated data stays in</h3>
              <p className="text-sm text-muted-foreground">
                Patient records, legal documents, financial filings, source code —
                training and inference happen inside your perimeter, never on a
                vendor's servers.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <Building2 className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">No vendor lock-in</h3>
              <p className="text-sm text-muted-foreground">
                You leave with the model. Export to GGUF or Safetensors and run it on
                Ollama, llama.cpp, vLLM, or any local runtime. If SoupyLab disappears
                tomorrow, your model still works.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <ServerOff className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-lg font-semibold mb-2">Predictable cost</h3>
              <p className="text-sm text-muted-foreground">
                Pay once to train, then run inference for free on hardware you
                already own. No per-token bills, no usage surprises at the end of
                the quarter.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            How to build a private AI model in SoupyLab
          </h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-mono flex items-center justify-center">1</span>
              <div>
                <h3 className="font-semibold mb-1">Bring your data</h3>
                <p className="text-muted-foreground text-sm">
                  Upload PDFs, transcripts, chat logs, code, or any text. SoupyLab
                  turns them into a clean training dataset you can review and edit.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-mono flex items-center justify-center">2</span>
              <div>
                <h3 className="font-semibold mb-1">Pick (or bring) a base model</h3>
                <p className="text-muted-foreground text-sm">
                  Choose from the curated catalog — Llama 3.2, Qwen 2.5, Gemma 2,
                  Phi-4 — or import your own from HuggingFace, Ollama, or a local
                  path. Your choice carries through every step of the pipeline.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-mono flex items-center justify-center">3</span>
              <div>
                <h3 className="font-semibold mb-1">Train, evaluate, export</h3>
                <p className="text-muted-foreground text-sm">
                  SoupyLab generates a ready-to-run training script, tracks
                  loss live, and produces evaluation probes so you know the model
                  actually learned. When you're happy, export the weights.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-mono flex items-center justify-center">4</span>
              <div>
                <h3 className="font-semibold mb-1">Deploy where you want</h3>
                <p className="text-muted-foreground text-sm">
                  Run the same model on a laptop with Ollama, ship it inside a
                  mobile app via Capacitor, or host it on your own GPU box. The
                  weights are yours.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Comparison */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Private AI model vs shared cloud model
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">&nbsp;</th>
                  <th className="text-left p-4 font-semibold">Shared cloud API</th>
                  <th className="text-left p-4 font-semibold">Private AI model (SoupyLab)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="p-4 font-medium">Who owns the weights</td><td className="p-4 text-muted-foreground">Vendor</td><td className="p-4 text-primary">You</td></tr>
                <tr><td className="p-4 font-medium">Data leaves your network</td><td className="p-4 text-muted-foreground">Yes</td><td className="p-4 text-primary">No</td></tr>
                <tr><td className="p-4 font-medium">Cost shape</td><td className="p-4 text-muted-foreground">Per-token, ongoing</td><td className="p-4 text-primary">Train once, run free</td></tr>
                <tr><td className="p-4 font-medium">Works air-gapped</td><td className="p-4 text-muted-foreground">No</td><td className="p-4 text-primary">Yes</td></tr>
                <tr><td className="p-4 font-medium">Trained on your domain</td><td className="p-4 text-muted-foreground">No</td><td className="p-4 text-primary">Yes</td></tr>
                <tr><td className="p-4 font-medium">Survives vendor outage</td><td className="p-4 text-muted-foreground">No</td><td className="p-4 text-primary">Yes</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Compliance */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="rounded-lg border border-border bg-card p-8">
            <FileCheck className="w-8 h-8 text-primary mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Built for regulated industries
            </h2>
            <p className="text-muted-foreground mb-4">
              Healthcare, legal, finance, and government teams pick private AI models
              for a simple reason: when the model never sees a third party, the
              compliance surface shrinks dramatically. HIPAA, GDPR, attorney-client
              privilege, and IP confidentiality all benefit from data that never
              leaves your control.
            </p>
            <p className="text-muted-foreground">
              SoupyLab's training pipeline runs locally, the optional cloud features
              use bring-your-own-key encryption, and your exported model belongs to
              you — not us.
            </p>
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
          <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Own your AI in an afternoon
          </h2>
          <p className="text-muted-foreground mb-8">
            Free tier includes 50 credits, no card required. Build, export, and keep
            the model forever — even if you cancel.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">
              Start free <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <div className="mt-8 text-sm text-muted-foreground">
            Also see:{" "}
            <Link to="/offline-llm" className="text-primary hover:underline">Offline LLM</Link>
            {" · "}
            <Link to="/train-your-own-llm" className="text-primary hover:underline">Train your own LLM</Link>
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
