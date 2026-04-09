import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Code2, Plus, Copy, Check, Ban, AlertTriangle } from "lucide-react";

interface DevKey {
  id: string;
  key_prefix: string;
  label: string;
  revoked: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function DeveloperKeysSection() {
  const [keys, setKeys] = useState<DevKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    const { data, error } = await supabase.functions.invoke("developer-keys", {
      method: "GET",
    });
    if (!error && data) setKeys(data as DevKey[]);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("developer-keys", {
      method: "POST",
      body: { label },
    });
    if (error) {
      toast.error("Failed to generate key");
    } else if (data?.key) {
      setNewRawKey(data.key);
      setLabel("");
      setShowCreate(false);
      fetchKeys();
      toast.success("API key generated — copy it now, it won't be shown again!");
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase.functions.invoke("developer-keys", {
      method: "DELETE",
      body: { id },
    });
    if (!error) {
      toast.success("Key revoked");
      fetchKeys();
    }
  };

  const handleCopy = async () => {
    if (!newRawKey) return;
    await navigator.clipboard.writeText(newRawKey);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Developer API Keys</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowCreate(!showCreate);
            setNewRawKey(null);
          }}
        >
          <Plus className="h-3 w-3 mr-1" /> Generate Key
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Generate <code className="text-[10px] bg-muted px-1 rounded">sk_</code> prefixed API keys for MCP servers and external integrations. Keys are hashed — the raw value is shown only once.
      </p>

      {/* Newly generated key banner */}
      {newRawKey && (
        <div className="border border-forge-amber/40 bg-forge-amber/10 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-forge-amber" />
            <span className="text-sm font-medium">Copy your key now — it won't be shown again</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background/80 rounded px-3 py-2 break-all select-all border">
              {newRawKey}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setNewRawKey(null)}>
            I've saved it — dismiss
          </Button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Life Card MCP, Production"
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? "Generating…" : "Generate Key"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Key list */}
      {keys.length === 0 && !showCreate && !newRawKey && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Code2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No developer keys yet. Generate one to connect external apps.
        </div>
      )}

      {keys.map((k) => (
        <div
          key={k.id}
          className={`flex items-center justify-between border rounded-lg p-3 ${
            k.revoked ? "border-destructive/20 opacity-60" : "border-border"
          }`}
        >
          <div className="flex items-center gap-3">
            <code className="text-sm font-mono text-muted-foreground">
              {k.key_prefix}…
            </code>
            {k.label && (
              <span className="text-xs text-muted-foreground">({k.label})</span>
            )}
            {k.revoked && (
              <Badge variant="destructive" className="text-[10px]">
                Revoked
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {new Date(k.created_at).toLocaleDateString()}
            </span>
            {!k.revoked && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive"
                onClick={() => handleRevoke(k.id)}
                title="Revoke key"
              >
                <Ban className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
