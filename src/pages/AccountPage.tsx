import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Key, Plus, Trash2, Shield, Megaphone, AlertTriangle, Info } from "lucide-react";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import ReferralSection from "@/components/ReferralSection";
import { TierBadge } from "@/components/TierBadge";
import { useCredits } from "@/hooks/useCredits";

import { CancelFlowDialog } from "@/components/CancelFlowDialog";
import DeveloperKeysSection from "@/components/DeveloperKeysSection";
import { Pause, Settings2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ApiKey {
  id: string;
  provider: string;
  label: string | null;
  masked_key: string;
  created_at: string;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google AI" },
  { value: "mistral", label: "Mistral" },
  { value: "cohere", label: "Cohere" },
  { value: "custom", label: "Custom" },
];

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const { data: credits } = useCredits();
  

  const [name, setName] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newProvider, setNewProvider] = useState("openai");
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  // visibleKeys removed — keys are encrypted and only shown masked
  const [savingKey, setSavingKey] = useState(false);
  const [cancelFlowOpen, setCancelFlowOpen] = useState(false);

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (profile && !initialized) {
    setName(profile.display_name || "");
    setInitialized(true);
  }

  const fetchKeys = async () => {
    const { data, error } = await supabase.functions.invoke("manage-api-keys", {
      method: "GET",
    });
    if (!error && data) setApiKeys(data as ApiKey[]);
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleSave = () => {
    updateProfile.mutate({ display_name: name });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
    toast.success("Signed out");
  };

  const handleAddKey = async () => {
    if (!newKey.trim()) return;
    setSavingKey(true);
    const { error } = await supabase.functions.invoke("manage-api-keys", {
      method: "POST",
      body: { provider: newProvider, label: newLabel || null, api_key: newKey },
    });
    if (error) {
      toast.error("Failed to save key");
    } else {
      toast.success("API key encrypted & saved");
      setNewKey("");
      setNewLabel("");
      setShowAddKey(false);
      fetchKeys();
    }
    setSavingKey(false);
  };

  const handleDeleteKey = async (id: string) => {
    const { error } = await supabase.functions.invoke("manage-api-keys", {
      method: "DELETE",
      body: { id },
    });
    if (!error) {
      toast.success("Key deleted");
      fetchKeys();
    }
  };

  // Keys are already masked server-side, no client masking needed

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        {credits && <TierBadge tier={credits.tier} size="md" />}
      </div>

      {/* Important Messages */}
      {announcements && announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Important Messages</h2>
          </div>
          {announcements.map((a: any) => (
            <div
              key={a.id}
              className={`rounded-lg border p-4 space-y-1 ${
                a.priority === "warning"
                  ? "border-forge-amber/40 bg-forge-amber/10"
                  : a.priority === "critical"
                  ? "border-destructive/40 bg-destructive/10"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {a.priority === "warning" || a.priority === "critical" ? (
                  <AlertTriangle className={`h-3.5 w-3.5 ${a.priority === "critical" ? "text-destructive" : "text-forge-amber"}`} />
                ) : (
                  <Info className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="font-medium text-sm">{a.title}</span>
              </div>
              <p className="text-xs text-muted-foreground pl-5.5">{a.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Separator />

      <TwoFactorSetup />

      <Separator />

      {/* BYOK Section */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">API Keys (BYOK)</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddKey(!showAddKey)}>
            <Plus className="h-3 w-3 mr-1" /> Add Key
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Bring your own API keys for AI providers. Keys are stored securely and used for your AI module runs.
        </p>

        {showAddKey && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Provider</Label>
                <select
                  value={newProvider}
                  onChange={e => setNewProvider(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label (optional)</Label>
                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Production key" className="h-9" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">API Key</Label>
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="sk-..." type="password" className="h-9 font-mono" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddKey} disabled={savingKey || !newKey.trim()}>
                {savingKey ? "Saving…" : "Save Key"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddKey(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {apiKeys.length === 0 && !showAddKey && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No API keys configured yet. Add one to use your own AI provider.
          </div>
        )}

        {apiKeys.map(key => (
          <div key={key.id} className="flex items-center justify-between border border-border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px]">{key.provider}</Badge>
              <span className="text-sm font-mono text-muted-foreground">
                {key.masked_key}
              </span>
              {key.label && <span className="text-xs text-muted-foreground">({key.label})</span>}
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-[hsl(var(--forge-emerald))]" />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteKey(key.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <DeveloperKeysSection />

      <Separator />

      <ReferralSection />

      <Separator />

      {/* Subscription Management */}
      {credits && credits.tier !== "free" && (
        <>
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h2 className="font-semibold font-display tracking-wide">Membership</h2>
              </div>
              <TierBadge tier={credits.tier} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">
              {credits.monthly_allowance} credits/month · {credits.credits_balance} remaining
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setCancelFlowOpen(true)}>
                <Pause className="h-3 w-3 mr-1.5" />
                Pause or Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { data } = await supabase.functions.invoke("customer-portal");
                  if (data?.url) window.open(data.url, "_blank");
                }}
              >
                Manage Billing
              </Button>
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold font-display tracking-wide">Session</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <Button variant="destructive" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>

      <CancelFlowDialog
        open={cancelFlowOpen}
        onOpenChange={setCancelFlowOpen}
        tier={credits?.tier || "free"}
        onStatusChange={() => {/* credits auto-refresh */}}
      />
    </div>
  );
}
