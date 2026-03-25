import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pause, Play, Gift, HeartCrack, Sparkles, Clock, Shield } from "lucide-react";

type Step = "options" | "discount_offer" | "pause_offer" | "confirm_cancel" | "done";

interface SubStatus {
  is_paused: boolean;
  has_discount: boolean;
  discount_name: string | null;
  cancel_at_period_end: boolean;
  period_end: string;
  resumes_at: string | null;
  product_id: string;
}

// Pro product IDs (original + sale)
const PRO_PRODUCTS = ["prod_U7A4PumaFQmKPQ", "prod_UD4fLliAe5KKKE"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: string;
  onStatusChange?: () => void;
}

export function CancelFlowDialog({ open, onOpenChange, tier, onStatusChange }: Props) {
  const [step, setStep] = useState<Step>("options");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SubStatus | null>(null);

  const isPro = tier === "pro";

  useEffect(() => {
    if (open) {
      setStep("options");
      fetchStatus();
    }
  }, [open]);

  const fetchStatus = async () => {
    const { data } = await supabase.functions.invoke("manage-subscription", {
      body: { action: "status" },
    });
    if (data?.success) setStatus(data as SubStatus);
  };

  const invoke = async (action: string) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { action },
    });
    setLoading(false);
    if (error || !data?.success) {
      toast.error(data?.message || error?.message || "Something went wrong");
      return false;
    }
    toast.success(data.message);
    onStatusChange?.();
    return true;
  };

  const handlePause = async () => {
    const ok = await invoke("pause");
    if (ok) { setStep("done"); }
  };

  const handleResume = async () => {
    const ok = await invoke("resume");
    if (ok) { onOpenChange(false); }
  };

  const handleDiscount = async () => {
    const ok = await invoke("apply_retention_discount");
    if (ok) { setStep("done"); }
  };

  const handleCancel = async () => {
    const ok = await invoke("cancel");
    if (ok) { setStep("done"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "options" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HeartCrack className="h-5 w-5 text-destructive" />
                We'd hate to see you go
              </DialogTitle>
              <DialogDescription>
                Before you leave, consider these options — your data, modules, and trained models stay safe.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              {/* Pause option */}
              {!status?.is_paused && (
                <button
                  onClick={() => setStep("pause_offer")}
                  className="w-full text-left border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Pause className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Pause my membership</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Take a 30-day break — no charges, keep all your work
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {status?.is_paused && (
                <button
                  onClick={handleResume}
                  disabled={loading}
                  className="w-full text-left border border-border rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Play className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Resume membership</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {status.resumes_at
                          ? `Auto-resumes ${new Date(status.resumes_at).toLocaleDateString()}`
                          : "Pick up where you left off"}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Pro discount offer */}
              {isPro && !status?.has_discount && (
                <button
                  onClick={() => setStep("discount_offer")}
                  className="w-full text-left border border-border rounded-xl p-4 hover:border-[hsl(var(--forge-amber))]/50 hover:bg-[hsl(var(--forge-amber))]/5 transition-all relative overflow-hidden"
                >
                  <Badge className="absolute top-2 right-2 bg-destructive text-[10px]">EXCLUSIVE</Badge>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[hsl(var(--forge-amber))]/10 p-2">
                      <Gift className="h-4 w-4 text-[hsl(var(--forge-amber))]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Get 25% off for 3 months</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Stay on Pro at a reduced rate — only for loyal members
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {status?.has_discount && (
                <div className="border border-[hsl(var(--forge-emerald))]/30 rounded-xl p-4 bg-[hsl(var(--forge-emerald))]/5">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[hsl(var(--forge-emerald))]" />
                    <p className="text-sm font-medium">Active discount: {status.discount_name}</p>
                  </div>
                </div>
              )}

              {/* Cancel option */}
              <button
                onClick={() => setStep("confirm_cancel")}
                className="w-full text-left border border-border rounded-xl p-4 hover:border-destructive/50 hover:bg-destructive/5 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <HeartCrack className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-destructive">Cancel membership</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Access continues until your billing period ends
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "pause_offer" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pause className="h-5 w-5 text-primary" />
                Pause your membership
              </DialogTitle>
              <DialogDescription>
                Your subscription will be paused for 30 days. No charges during the pause. All your models, data, and credits are preserved.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Billing resumes automatically after 30 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Your trained models and data stay safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Resume anytime to pick up where you left off</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePause} disabled={loading} className="flex-1">
                  {loading ? "Pausing…" : "Pause for 30 days"}
                </Button>
                <Button variant="ghost" onClick={() => setStep("options")}>Back</Button>
              </div>
            </div>
          </>
        )}

        {step === "discount_offer" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-[hsl(var(--forge-amber))]" />
                Exclusive Pro Loyalty Offer
              </DialogTitle>
              <DialogDescription>
                As a valued Pro member, we'd like to offer you 25% off for the next 3 months.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="text-center py-4">
                <p className="text-muted-foreground line-through text-sm">$39.50/mo</p>
                <p className="text-3xl font-extrabold text-primary">$29.63<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <Badge className="mt-2 bg-destructive">SAVE 25% FOR 3 MONTHS</Badge>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1.5">
                <p>✓ Keep full Pro access (2,000 credits/mo)</p>
                <p>✓ Edge training, robotics, all premium features</p>
                <p>✓ Discount applied automatically to next 3 invoices</p>
                <p>✓ Reverts to normal pricing after — no surprise charges</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDiscount} disabled={loading} className="flex-1">
                  {loading ? "Applying…" : "Claim 25% Off"}
                </Button>
                <Button variant="ghost" onClick={() => setStep("options")}>Back</Button>
              </div>
            </div>
          </>
        )}

        {step === "confirm_cancel" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <HeartCrack className="h-5 w-5" />
                Confirm cancellation
              </DialogTitle>
              <DialogDescription>
                Your membership will remain active until the end of your current billing period
                {status?.period_end && ` (${new Date(status.period_end).toLocaleDateString()})`}.
                After that, you'll revert to the Free tier (50 credits/mo).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-sm space-y-1.5">
                <p className="font-medium text-destructive">What you'll lose:</p>
                <p>• {tier === "pro" ? "2,000" : "500"} monthly credits → 50 credits</p>
                {tier === "pro" && <p>• Access to Edge Training & Robotics</p>}
                <p>• Export Studio access</p>
                <p>• Priority support</p>
              </div>

              {isPro && !status?.has_discount && (
                <button
                  onClick={() => setStep("discount_offer")}
                  className="w-full border border-[hsl(var(--forge-amber))]/40 rounded-lg p-3 text-center hover:bg-[hsl(var(--forge-amber))]/5 transition-all"
                >
                  <p className="text-sm font-semibold text-[hsl(var(--forge-amber))]">
                    ✨ Wait — get 25% off for 3 months instead?
                  </p>
                </button>
              )}

              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleCancel} disabled={loading} className="flex-1">
                  {loading ? "Cancelling…" : "Yes, cancel membership"}
                </Button>
                <Button variant="outline" onClick={() => setStep("options")}>Keep membership</Button>
              </div>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>All set!</DialogTitle>
              <DialogDescription>
                Your changes have been applied. You can manage your subscription anytime from your account settings.
              </DialogDescription>
            </DialogHeader>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>Done</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
