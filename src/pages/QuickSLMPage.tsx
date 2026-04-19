import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu, Download, Loader2, Sparkles, ShieldCheck, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

const BASE_MODELS = [
  { id: "llama-3.2-3b", label: "Llama 3.2 3B (recommended)" },
  { id: "phi-3-mini", label: "Phi-3 Mini 3.8B" },
  { id: "qwen2.5-3b", label: "Qwen 2.5 3B" },
];

export default function QuickSLMPage() {
  const { user } = useAuth();
  const { data: credits } = useCredits();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [baseModel, setBaseModel] = useState("llama-3.2-3b");
  const [domain, setDomain] = useState("");
  const [useCase, setUseCase] = useState("");
  const [size, setSize] = useState<"small" | "medium" | "large">("small");
  const [depth, setDepth] = useState<"shallow" | "standard" | "deep">("shallow");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "credits">("stripe");

  const [quote, setQuote] = useState<{ price_cents: number; price_credits: number } | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [busy, setBusy] = useState(false);

  // Post-payment state
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("");

  const config = { base_model: baseModel, domain, use_case: useCase, size, depth };
  const ready = !!user && domain.trim().length > 1 && useCase.trim().length > 5;

  // Live quote
  useEffect(() => {
    if (!ready) { setQuote(null); return; }
    setLoadingQuote(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.functions.invoke("quick-checkout", {
        body: { action: "quote", flow: "slm", config },
      });
      if (data?.price_cents != null) setQuote(data);
      setLoadingQuote(false);
    }, 350);
    return () => clearTimeout(t);
  }, [baseModel, domain, useCase, size, depth, ready]);

  // Handle ?paid=1&job=...
  useEffect(() => {
    const paid = params.get("paid");
    const jobId = params.get("job");
    if (paid && jobId && user) {
      (async () => {
        setBusy(true);
        await supabase.functions.invoke("quick-checkout", {
          body: { action: "confirm", job_id: jobId },
        });
        const { data } = await supabase.functions.invoke("quick-generate", {
          body: { job_id: jobId },
        });
        if (data?.url) {
          setDownloadUrl(data.url);
          setDownloadName(data.filename);
          toast.success("Your SLM bundle is ready!");
        } else {
          toast.error("Generation failed", { description: data?.error });
        }
        setBusy(false);
      })();
    }
  }, [params, user]);

  async function handleBuy() {
    if (!user) {
      navigate("/signup?next=/quick-slm");
      return;
    }
    if (!quote) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("quick-checkout", {
        body: { action: "checkout", flow: "slm", config, payment_method: paymentMethod },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (paymentMethod === "credits" && data?.paid) {
        const { data: gen } = await supabase.functions.invoke("quick-generate", {
          body: { job_id: data.job_id },
        });
        if (gen?.url) {
          setDownloadUrl(gen.url);
          setDownloadName(gen.filename);
          toast.success("Your SLM bundle is ready!");
        }
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast.error(e.message || "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  async function downloadAsZip() {
    if (!downloadUrl) return;
    const r = await fetch(downloadUrl);
    const text = await r.text();
    let bundle: Record<string, string>;
    try { bundle = JSON.parse(text); } catch { 
      // Not a bundle, direct download
      const a = document.createElement("a");
      a.href = downloadUrl; a.download = downloadName; a.click();
      return;
    }
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const [name, content] of Object.entries(bundle)) {
      zip.file(name, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = downloadName.replace(".json", ".zip"); a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Make a Specific SLM — Pay Once, Own Forever | SoupyLab"
        description="Spec out your specialist Small Language Model in 30 seconds. Pay one exact price. Download a ready-to-train bundle. No subscription."
      />
      <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 font-display font-bold">
            <Brain className="h-4 w-4 text-primary" /> Make Specific SLM
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {downloadUrl ? (
          <Card className="p-8 border-forge-emerald/40 bg-forge-emerald/5 text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-forge-emerald" />
            <h1 className="text-2xl font-display font-bold">Your SLM bundle is ready</h1>
            <p className="text-muted-foreground">
              You own this 100%. Drop it on your machine, run <code className="text-xs bg-muted px-1 py-0.5 rounded">python train.py</code>, and you have your specialist.
            </p>
            <Button size="lg" onClick={downloadAsZip} className="gradient-primary glow-primary">
              <Download className="mr-2 h-5 w-5" /> Download ZIP
            </Button>
          </Card>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-display font-bold">
                One <span className="gradient-text">specific SLM</span>. One price. Yours forever.
              </h1>
              <p className="text-muted-foreground">
                Pick the base, name the specialty, set the depth — see the exact total before you pay.
              </p>
            </div>

            <Card className="p-6 space-y-5">
              <div className="space-y-2">
                <Label>Base model</Label>
                <RadioGroup value={baseModel} onValueChange={setBaseModel} className="grid sm:grid-cols-3 gap-2">
                  {BASE_MODELS.map(m => (
                    <label key={m.id} className={`border rounded-lg p-3 text-sm cursor-pointer transition-all ${baseModel === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <RadioGroupItem value={m.id} className="sr-only" />
                      <div className="font-semibold">{m.label}</div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Specialty / domain *</Label>
                <Input id="domain" placeholder="e.g. legal contract review, dermatology Q&A, F1 race strategy"
                  value={domain} onChange={(e) => setDomain(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="useCase">What should it do? *</Label>
                <Textarea id="useCase" rows={3}
                  placeholder="Describe the exact behavior you want. Example: Given a contract clause, flag risk level (low/med/high) and suggest a softer rewrite."
                  value={useCase} onChange={(e) => setUseCase(e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specialist size</Label>
                  <RadioGroup value={size} onValueChange={(v: any) => setSize(v)} className="space-y-1.5">
                    {[["small", "Small (focused)"], ["medium", "Medium (+$6)"], ["large", "Large (+$15)"]].map(([v, l]) => (
                      <label key={v} className={`flex items-center gap-2 border rounded p-2 text-sm cursor-pointer ${size === v ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value={v} /> {l}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Training depth</Label>
                  <RadioGroup value={depth} onValueChange={(v: any) => setDepth(v)} className="space-y-1.5">
                    {[["shallow", "Shallow — ~20 pairs"], ["standard", "Standard — ~40 pairs (+$4)"], ["deep", "Deep — ~80 pairs (+$12)"]].map(([v, l]) => (
                      <label key={v} className={`flex items-center gap-2 border rounded p-2 text-sm cursor-pointer ${depth === v ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value={v} /> {l}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 border-primary/30">
              <div className="flex items-center justify-between">
                <div className="font-display font-bold">Exact total</div>
                {loadingQuote && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {quote ? (
                <div className="text-center py-2">
                  <div className="text-5xl font-display font-bold gradient-text">
                    ${(quote.price_cents / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    or {quote.price_credits} credits {credits ? `(you have ${credits.credits_balance})` : ""}
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {ready ? "Calculating…" : "Fill in domain + behavior to see your price"}
                </div>
              )}

              {quote && (
                <RadioGroup value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)} className="grid grid-cols-2 gap-2">
                  <label className={`border rounded-lg p-3 text-sm cursor-pointer ${paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="stripe" className="sr-only" />
                    <div className="font-semibold">Pay ${(quote.price_cents / 100).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">Card via Stripe</div>
                  </label>
                  <label className={`border rounded-lg p-3 text-sm cursor-pointer ${paymentMethod === "credits" ? "border-primary bg-primary/5" : "border-border"} ${(credits?.credits_balance ?? 0) < quote.price_credits ? "opacity-50" : ""}`}>
                    <RadioGroupItem value="credits" className="sr-only" disabled={(credits?.credits_balance ?? 0) < quote.price_credits} />
                    <div className="font-semibold">Use {quote.price_credits} credits</div>
                    <div className="text-xs text-muted-foreground">
                      {(credits?.credits_balance ?? 0) >= quote.price_credits ? "Instant" : "Not enough credits"}
                    </div>
                  </label>
                </RadioGroup>
              )}

              <Button
                size="lg"
                className="w-full gradient-primary glow-primary text-base font-bold"
                onClick={handleBuy}
                disabled={!ready || !quote || busy}
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> :
                  user ? `Buy & Download — $${quote ? (quote.price_cents / 100).toFixed(2) : "—"}` : "Sign up to buy"}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> One-time payment</span>
                <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> You own the weights</span>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
