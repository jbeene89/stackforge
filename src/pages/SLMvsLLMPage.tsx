import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { TRAINING_MODELS } from "@/lib/localModels";
import landscape from "@/assets/bg-landscape.jpg";

const comparisons = [
  ["Task fit", "A bounded task, such as ticket routing or extracting fields.", "Broad writing, complex reasoning, and unfamiliar questions."],
  ["Hardware", "Usually a smaller memory footprint; device compatibility still matters.", "Larger models generally need more memory and compute."],
  ["Speed", "Can respond quickly on suitable local hardware.", "Depends on hardware, model size, context, and service load."],
  ["Cost", "Local use avoids API charges, but hardware, electricity, and maintenance still cost money.", "Hosted APIs charge for usage; self-hosting requires suitable infrastructure."],
  ["Privacy", "Local inference can keep prompts on the device if no cloud fallback or external tools are used.", "A large model can also be private when self-hosted. Hosted privacy depends on the provider."],
  ["Limitations", "Less capacity can mean weaker general knowledge or complex reasoning. Test carefully.", "More capacity is not a guarantee of correctness; hallucinations still need checking."],
];

export default function SLMvsLLMPage() {
  return (
    <>
      <SEOHead title="SLM vs LLM: choosing a model that fits" description="Compare small and large language models by task, hardware, privacy, speed, and total cost. See how to test a small model with SoupyLab." canonicalPath="/slm-vs-llm" />
      <main className="bg-background text-foreground min-h-screen">
        <header className="relative overflow-hidden">
          <img src={landscape} alt="" width={1920} height={1080} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/90" />
          <div className="relative container max-w-4xl mx-auto px-4 py-16 md:py-20">
            <Button asChild variant="ghost" className="mb-8"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />SoupyLab</Link></Button>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">SLM vs LLM</h1>
            <p className="text-xl mb-4">Choose the smallest model that meets your quality target—not the smallest model at any cost.</p>
            <p className="text-muted-foreground max-w-3xl">Small and large language models both generate language. “Small” has no universal parameter cutoff, and size alone does not determine quality, privacy, or where a model runs. Start with the job and the device, then measure the result.</p>
          </div>
        </header>
        <section className="container max-w-5xl mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold mb-6">Small vs large: the practical trade-offs</h2>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <caption className="sr-only">Small and large language model comparison</caption>
              <thead className="bg-muted"><tr><th scope="col" className="p-4 text-left">Factor</th><th scope="col" className="p-4 text-left">Small language model</th><th scope="col" className="p-4 text-left">Large language model</th></tr></thead>
              <tbody className="divide-y divide-border">{comparisons.map(([factor, small, large]) => <tr key={factor}><th scope="row" className="p-4 text-left align-top font-medium">{factor}</th><td className="p-4 align-top text-muted-foreground">{small}</td><td className="p-4 align-top text-muted-foreground">{large}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Further reading: <a href="https://www.redhat.com/en/topics/ai/llm-vs-slm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Red Hat’s SLM/LLM overview</a> and <a href="https://sensory.com/slm-vs-llm-on-device-nlu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sensory’s on-device discussion</a>. Their examples are not benchmarks for your hardware.</p>
        </section>
        <section className="container max-w-4xl mx-auto px-4 py-12 border-t border-border">
          <h2 className="font-display text-2xl font-bold mb-6">When should you choose each?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div><h3 className="text-lg font-semibold mb-3 text-primary">Start small for a focused job</h3><p className="text-muted-foreground">Try classifying support tickets, following a fixed answer format, or answering a narrow set of questions. Curated examples and a clear evaluation set matter more than a promise that fine-tuning will solve everything.</p></div>
            <div><h3 className="text-lg font-semibold mb-3">Use more capacity when needed</h3><p className="text-muted-foreground">Open-ended research, complex code, and multi-step reasoning may benefit from a larger model. Compare specific models: a newer small model can outperform an older larger one on some tasks.</p></div>
          </div>
        </section>
        <section className="container max-w-4xl mx-auto px-4 py-12 border-t border-border">
          <h2 className="font-display text-2xl font-bold mb-6">A useful first experiment in SoupyLab</h2>
          <ol className="list-decimal pl-5 space-y-4 text-muted-foreground">
            <li>Open SLM Lab and load the free sample dataset, or bring examples from your own task. Keep a separate set of questions for evaluation.</li>
            <li>Pick a compatible model. Current text-training choices include {TRAINING_MODELS.filter(model => ["Qwen/Qwen3-0.6B", "google/gemma-3-270m-it", "meta-llama/Llama-3.2-1B-Instruct"].includes(model.id)).map(model => model.label).join(", ")}. Check each model’s license and hardware requirements.</li>
            <li>Export the training kit and run it on compatible hardware. Dataset preparation in the app is not the same as completing model training.</li>
            <li>Compare correct answers, failure cases, response time, and memory use in Local AI. Increase capacity only when your tests justify it.</li>
          </ol>
          <p className="mt-6 text-muted-foreground">For sensitive prompts, use the offline lock and a downloaded local model. Cloud-assisted dataset creation and cloud chat send input off-device; a small model does not make those steps local.</p>
          <div className="flex flex-wrap gap-3 mt-8"><Button asChild><Link to="/slm-lab">Open SLM Lab<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link to="/offline-llm">Offline model guide</Link></Button></div>
          <nav aria-label="Related guides" className="flex flex-wrap gap-5 mt-8 text-sm"><Link to="/train-your-own-llm" className="text-primary hover:underline">Training guide</Link><Link to="/trust" className="text-primary hover:underline">Trust & privacy</Link><Link to="/pricing" className="text-primary hover:underline">Pricing</Link></nav>
        </section>
      </main>
    </>
  );
}