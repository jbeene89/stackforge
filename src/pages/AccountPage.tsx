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
import { Key, Plus, Trash2, Eye, EyeOff, Shield } from "lucide-react";
import ReferralSection from "@/components/ReferralSection";

interface ApiKey {
  id: string;
  provider: string;
  label: string | null;
  api_key_encrypted: string;
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

  const [name, setName] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddKey, setShowAddKey] = useState(false);
  const [newProvider, setNewProvider] = useState("openai");
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState(false);

  if (profile && !initialized) {
    setName(profile.display_name || "");
    setInitialized(true);
  }

  const fetchKeys = async () => {
    const { data } = await supabase
      .from("user_api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApiKeys(data as any);
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
    const { error } = await supabase.from("user_api_keys").insert({
      user_id: user!.id,
      provider: newProvider,
      label: newLabel || null,
      api_key_encrypted: newKey,
    } as any);
    if (error) {
      toast.error("Failed to save key");
    } else {
      toast.success("API key saved");
      setNewKey("");
      setNewLabel("");
      setShowAddKey(false);
      fetchKeys();
    }
    setSavingKey(false);
  };

  const handleDeleteKey = async (id: string) => {
    const { error } = await supabase.from("user_api_keys").delete().eq("id", id);
    if (!error) {
      toast.success("Key deleted");
      fetchKeys();
    }
  };

  const maskKey = (key: string) => key.slice(0, 8) + "•".repeat(Math.max(0, key.length - 12)) + key.slice(-4);

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold">Account Settings</h1>

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
                {visibleKeys.has(key.id) ? key.api_key_encrypted : maskKey(key.api_key_encrypted)}
              </span>
              {key.label && <span className="text-xs text-muted-foreground">({key.label})</span>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  const next = new Set(visibleKeys);
                  visibleKeys.has(key.id) ? next.delete(key.id) : next.add(key.id);
                  setVisibleKeys(next);
                }}
              >
                {visibleKeys.has(key.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteKey(key.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="glass rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Session</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <Button variant="destructive" size="sm" onClick={handleSignOut}>Sign Out</Button>
      </div>
    </div>
  );
}
