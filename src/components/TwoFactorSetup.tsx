import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type MfaFactor = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
};

export function TwoFactorSetup() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFactors = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error && data) {
      setFactors(data.totp || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const isEnabled = factors.some((f) => f.status === "verified");

  const handleEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator App",
    });
    if (error) {
      toast.error(error.message);
      setEnrolling(false);
      return;
    }
    if (data) {
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    setVerifying(true);
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      toast.error(challengeError.message);
      setVerifying(false);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: verifyCode,
    });
    if (verifyError) {
      toast.error("Invalid code. Please try again.");
      setVerifying(false);
      return;
    }
    toast.success("2FA enabled successfully!");
    setEnrolling(false);
    setQrCode("");
    setSecret("");
    setVerifyCode("");
    fetchFactors();
    setVerifying(false);
  };

  const handleUnenroll = async (id: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("2FA removed");
    fetchFactors();
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading security settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEnabled ? (
            <ShieldCheck className="h-4 w-4 text-forge-emerald" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-forge-amber" />
          )}
          <h2 className="font-semibold">Two-Factor Authentication</h2>
          {isEnabled ? (
            <Badge className="bg-forge-emerald/20 text-forge-emerald border-forge-emerald/30 text-[10px]">
              Enabled
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-forge-amber border-forge-amber/30">
              Recommended
            </Badge>
          )}
        </div>
      </div>

      {!isEnabled && !enrolling && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Add an extra layer of security to your account. Use an authenticator app like Google Authenticator or Authy to generate verification codes.
          </p>
          <Button variant="outline" size="sm" onClick={handleEnroll}>
            Set Up 2FA
          </Button>
        </div>
      )}

      {enrolling && qrCode && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Scan this QR code with your authenticator app, then enter the 6-digit code below.
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white rounded-lg p-2 w-fit">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded font-mono">
                {secret}
              </code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copySecret}>
                {copied ? <Check className="h-3 w-3 text-forge-emerald" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Verification Code</Label>
            <div className="flex gap-2">
              <Input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="h-9 w-32 font-mono text-center tracking-widest"
                maxLength={6}
              />
              <Button
                size="sm"
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || verifying}
              >
                {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEnrolling(false);
                  setQrCode("");
                  setSecret("");
                  setVerifyCode("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {isEnabled && (
        <div className="space-y-3">
          {factors
            .filter((f) => f.status === "verified")
            .map((f) => (
              <div key={f.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-forge-emerald" />
                  <span className="text-sm">{f.friendly_name || "Authenticator App"}</span>
                  <Badge variant="outline" className="text-[10px]">TOTP</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive"
                  onClick={() => handleUnenroll(f.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
