import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Database, Layers, Rocket } from "lucide-react";

/**
 * SEO landing page targeting "train your own llm" (KDI 36, ~140/mo).
 * Public, content-rich, single H1, FAQ schema, internal links to /signup and /slm-lab.
 */
export default function TrainYourOwnLLMPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much data do I need to train my own LLM?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For fine-tuning a small language model on a niche task, 500–2,000 high-quality question/answer pairs is usually enough. SoupyLab can generate those pairs from raw documents, chat exports, or notes automatically.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to know Python or machine learning to train a model?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. SoupyLab handles the dataset prep, training run, and export step visually. You upload your source material, review the generated pairs, and click Train. The output is a model file you can run anywhere.",
        },
      },
      {
        "@type": "Question",
        name: "How long does training take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A small language model (1B–3B parameters) trained on a few thousand pairs usually finishes in 20–60 minutes on a consumer GPU, or a few hours on CPU. SoupyLab streams progress live.",
        },
      },
      {
        "@type": "Question",
        name: "What format is the trained model in?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SoupyLab exports to GGUF, the standard format for local runtimes like Ollama, LM Studio, and llama.cpp. You can also keep it inside SoupyLab to run in your browser via WebGPU.",
        },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title="Train your own LLM — fine-tune a small language model on your data"
        description="Train your own LLM on your documents, chats, or notes. No Python required. SoupyLab generates training pairs, runs the fine-tune, and exports a model you can run anywhere."
        canonicalPath="/train-your-own-llm"
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
            <Layers className="w-3 h-3" /> fine-tune · no python required
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Train your own LLM on your own data
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl">
            Turn your documents, chats, or notes into a fine-tuned small language
            model. SoupyLab generates the training data, runs the fine-tune, and
            exports a model file you own — and can run offline.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="text-base">
              <Link to="/signup">
                Start free — 50 credits <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/slm-lab">See the SLM Lab</Link>
            </Button>
          </div>
        </section>

        {/* Why train */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">
            Why train your own LLM instead of using GPT?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-2">It knows what you know</h3>
              <p className="text-sm text-muted-foreground">
                General-purpose models are average at everything. A model trained on
                your playbook, your codebase, or your case notes will out-answer a
                generalist on your exact topic — every time.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-2">You own the weights</h3>
              <p className="text-sm text-muted-foreground">
                When the model file lives on your disk, no provider can deprecate
                it, change its behavior, or raise the price. Your AI does not
                expire.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-2">Your data stays yours</h3>
              <p className="text-sm text-muted-foreground">
                Training and inference happen on your hardware. Your source
                documents never feed someone else's model.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold mb-2">Cheap to run forever</h3>
              <p className="text-sm text-muted-foreground">
                After the one-time training cost, inference is free. No per-token
                bill. No rate limits. No outage to wait through.
              </p>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            The four steps to train your LLM
          </h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <BookOpen className="flex-shrink-0 w-8 h-8 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">1. Bring your source material</h3>
                <p className="text-muted-foreground text-sm">
                  Upload PDFs, markdown, transcripts, ChatGPT exports, or whole
                  folders. SoupyLab handles nested directories and mixed formats.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Database className="flex-shrink-0 w-8 h-8 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">2. Auto-generate training pairs</h3>
                <p className="text-muted-foreground text-sm">
                  SoupyLab turns raw text into question/answer pairs in the format
                  the trainer expects. You review them on a swipe interface and
                  keep what's good.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Layers className="flex-shrink-0 w-8 h-8 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">3. Pick a base model and train</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a small open base (1B–3B parameters) and click Train.
                  Progress streams live; you do not need to babysit a terminal.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <Rocket className="flex-shrink-0 w-8 h-8 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">4. Export and deploy anywhere</h3>
                <p className="text-muted-foreground text-sm">
                  Get a GGUF file. Run it with Ollama on your laptop, LM Studio on
                  a Mac, or directly in the SoupyLab browser runtime. Same model,
                  any environment.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Use cases */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            What people train their own LLMs for
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">A house-style writing assistant</h3>
              <p className="text-sm text-muted-foreground">
                Fine-tuned on your past writing so the output sounds like you, not
                like ChatGPT.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">A domain expert</h3>
              <p className="text-sm text-muted-foreground">
                Trained on legal precedents, medical guidelines, engineering specs
                — answers in your field, not generic web slop.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">A private second brain</h3>
              <p className="text-sm text-muted-foreground">
                Fed your notes, journals, and chats — recalls what you already
                wrote without sending any of it to a vendor.
              </p>
            </div>
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
          <Rocket className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your model. Your data. Your weights.
          </h2>
          <p className="text-muted-foreground mb-8">
            Free tier includes 50 credits, no card required. Train a small model
            on a slice of your data and see what's possible.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">
              Start free <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <div className="mt-8 text-sm text-muted-foreground">
            Also see: <Link to="/offline-llm" className="text-primary hover:underline">Offline LLM guide</Link>
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
