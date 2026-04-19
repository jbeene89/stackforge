import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Download, Loader2, Sparkles, ShieldCheck, Upload, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

interface UploadedFile { name: string; text: string; size: number; }

export default function QuickPairsPage() {
  const { user } = useAuth();
  const { data: credits } = useCredits();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pasted, setPasted] = useState("");
  const [urls, setUrls] = useState("");
  const [format, setFormat] = useState<"instruction" | "dpo">("instruction");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "credits">("stripe");

  const [quote, setQuote] = useState<{ price_cents: number; price_credits: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");

  // Estimate pairs: ~1 pair per 600 chars of source material (capped reasonable bounds)
  const totalChars = files.reduce((s, f) => s + f.text.length, 0) + pasted.length + urls.length * 2000;
  const urlCount = urls.split(/\s+/).filter(u => /^https?:\/\//.test(u)).length;
  const estimatedPairs = totalChars > 0 ? Math.min(500, Math.max(20, Math.floor(totalChars / 600))) : 0;
  const ready = !!user && (files.length > 0 || pasted.length > 100 || urlCount > 0);

  const config = {
    estimated_pairs: estimatedPairs,
    file_count: files.length,
    url_count: urlCount,
    format,
    sources: urls.split(/\s+/).filter(u => /^https?:\/\//.test(u)),
    file_texts: files.map(f => f.text),
  };
  const configForQuote = {
    estimated_pairs: estimatedPairs,
    file_count: files.length,
    url_count: urlCount,
  };

  // Live quote
  useEffect(() => {
    if (!ready) { setQuote(null); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.functions.invoke("quick-checkout", {
        body: { action: "quote", flow: "pairs", config: configForQuote },
      });
      if (data?.price_cents != null) setQuote(data);
    }, 350);
    return () => clearTimeout(t);
  }, [estimatedPairs, files.length, urlCount, ready]);

  // Post-payment
  useEffect(() => {
    const paid = params.get("paid");
    const jobId = params.get("job");
    if (paid && jobId && user) {
      (async () => {
        setBusy(true);
        await supabase.functions.invoke("quick-checkout", { body: { action: "confirm", job_id: jobId } });
        const { data } = await supabase.functions.invoke("quick-generate", { body: { job_id: jobId } });
        if (data?.url) {
          setDownloadUrl(data.url);
          setDownloadName(data.filename);
          toast.success("Your training pairs are ready!");
        } else {
          toast.error("Generation failed", { description: data?.error });
        }
        setBusy(false);
      })();
    }
  }, [params, user]);

  async function handleFiles(list: FileList | null) {
    if (!list) return;
    const next: UploadedFile[] = [...files];
    for (const f of Array.from(list)) {
      if (f.size > 2 * 1024 * 1024) {
        toast.error(`${f.name} too big (max 2MB)`); continue;
      }
      const text = await f.text();
      next.push({ name: f.name, text, size: f.size });
    }
    setFiles(next);
  }

  async function handleBuy() {
    if (!user) { navigate("/signup?next=/quick-pairs"); return; }
    if (!quote) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("quick-checkout", {
        body: { action: "checkout", flow: "pairs", config, payment_method: paymentMethod },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (paymentMethod === "credits" && data?.paid) {
        const { data: gen } = await supabase.functions.invoke("quick-generate", { body: { job_id: data.job_id } });
        if (gen?.url) {
          setDownloadUrl(gen.url);
          setDownloadName(gen.filename);
          toast.success("Done!");
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Compile Training Pairs — Pay Once, Own Forever | SoupyLab"
        description="Drop in your sources. We turn them into clean JSONL training pairs. Pay one exact price. Download. Use anywhere."
      />
      <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 font-display font-bold">
            <FileText className="h-4 w-4 text-primary" /> Compile Training Pairs
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {downloadUrl ? (
          <Card className="p-8 border-forge-emerald/40 bg-forge-emerald/5 text-center space-y-4">
            <Sparkles className="h-12 w-12 mx-auto text-forge-emerald" />
            <h1 className="text-2xl font-display font-bold">Your training pairs are ready</h1>
            <p className="text-muted-foreground">Clean JSONL. Drop straight into any fine-tune pipeline.</p>
            <Button asChild size="lg" className="gradient-primary glow-primary">
              <a href={downloadUrl} download={downloadName}>
                <Download className="mr-2 h-5 w-5" /> Download {downloadName}
              </a>
            </Button>
          </Card>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-display font-bold">
                Upload sources. Get <span className="gradient-text">clean training pairs</span>.
              </h1>
              <p className="text-muted-foreground">
                Files, pasted text, or URLs — see the exact total before you pay.
              </p>
            </div>

            <Card className="p-6 space-y-5">
              <div className="space-y-2">
                <Label>Upload files (TXT, MD, JSONL — max 2MB each)</Label>
                <input
                  ref={fileInputRef} type="file" multiple
                  accept=".txt,.md,.jsonl,.json,.csv"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border hover:border-primary/40 rounded-lg p-6 text-center text-sm text-muted-foreground hover:text-foreground transition"
                >
                  <Upload className="h-6 w-6 mx-auto mb-2" />
                  Click to upload, or drag files here
                </button>
                {files.length > 0 && (
                  <div className="space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded px-2 py-1">
                        <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024).toFixed(1)}KB)</span></span>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paste">Or paste raw text</Label>
                <Textarea id="paste" rows={4} placeholder="Paste any source material…"
                  value={pasted} onChange={(e) => setPasted(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urls">Or list URLs (one per line)</Label>
                <Textarea id="urls" rows={2} placeholder="https://example.com/article-1&#10;https://example.com/article-2"
                  value={urls} onChange={(e) => setUrls(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Output format</Label>
                <RadioGroup value={format} onValueChange={(v: any) => setFormat(v)} className="grid grid-cols-2 gap-2">
                  <label className={`border rounded-lg p-3 text-sm cursor-pointer ${format === "instruction" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="instruction" className="sr-only" />
                    <div className="font-semibold">Instruction</div>
                    <div className="text-xs text-muted-foreground">{`{instruction, input, output}`}</div>
                  </label>
                  <label className={`border rounded-lg p-3 text-sm cursor-pointer ${format === "dpo" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="dpo" className="sr-only" />
                    <div className="font-semibold">DPO</div>
                    <div className="text-xs text-muted-foreground">{`{prompt, chosen, rejected}`}</div>
                  </label>
                </RadioGroup>
              </div>
            </Card>

            {ready && (
              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-display font-bold">
                  <Lock className="h-4 w-4" /> Sample preview (locked until paid)
                </div>
                <div
                  className="relative rounded-lg bg-muted/40 p-4 text-xs font-mono leading-relaxed select-none"
                  onCopy={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                  <div className="filter blur-[3px] pointer-events-none">
                    {`{"instruction": "Summarize the key risk factors in this clause...", "input": "", "output": "1. Auto-renewal trap..."}\n{"instruction": "Rewrite this paragraph for an 8th-grade reader...", "input": "", "output": "When you sign up..."}\n{"instruction": "Extract every named entity...", "input": "", "output": "[\\"Acme Corp\\", \\"Q4 2024\\", ...]"}\n{"instruction": "Generate a counter-argument...", "input": "", "output": "While the clause appears..."}`}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center text-foreground/70 text-xs font-sans font-semibold">
                    {estimatedPairs} pairs estimated · pay to unlock
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 space-y-4 border-primary/30">
              <div className="font-display font-bold">Exact total</div>
              {quote ? (
                <div className="text-center py-2">
                  <div className="text-5xl font-display font-bold gradient-text">
                    ${(quote.price_cents / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    or {quote.price_credits} credits {credits ? `(you have ${credits.credits_balance})` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {estimatedPairs} pairs · {files.length} file{files.length !== 1 ? "s" : ""} · {urlCount} URL{urlCount !== 1 ? "s" : ""}
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {ready ? "Calculating…" : "Add sources to see your price"}
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

              <Button size="lg" className="w-full gradient-primary glow-primary text-base font-bold"
                onClick={handleBuy} disabled={!ready || !quote || busy}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> :
                  user ? `Buy & Download — $${quote ? (quote.price_cents / 100).toFixed(2) : "—"}` : "Sign up to buy"}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> One-time payment</span>
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> No subscription</span>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
