import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/TierBadge";
import { Users, Search, ChevronRight, Mail, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface UserRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserCreditsRow {
  user_id: string;
  tier: string;
  credits_balance: number;
  credits_used: number;
  monthly_allowance: number;
}

export default function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      if (search.length < 2) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        return (data || []) as UserRow[];
      }
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, created_at")
        .ilike("display_name", `%${search}%`)
        .limit(50);
      return (data || []) as UserRow[];
    },
  });

  // Fetch credits for all visible users
  const userIds = users?.map((u) => u.user_id) || [];
  const { data: allCredits } = useQuery({
    queryKey: ["admin-user-credits", userIds],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("user_id, tier, credits_balance, credits_used, monthly_allowance")
        .in("user_id", userIds);
      return (data || []) as UserCreditsRow[];
    },
  });

  const creditsMap = new Map(allCredits?.map((c) => [c.user_id, c]));

  // Selected user detail
  const selectedProfile = users?.find((u) => u.user_id === selectedUser);
  const selectedCredits = selectedUser ? creditsMap.get(selectedUser) : null;

  const { data: selectedProjects } = useQuery({
    queryKey: ["admin-user-projects", selectedUser],
    enabled: !!selectedUser,
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, status, type, created_at")
        .eq("user_id", selectedUser!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: selectedDatasets } = useQuery({
    queryKey: ["admin-user-datasets", selectedUser],
    enabled: !!selectedUser,
    queryFn: async () => {
      const { data } = await supabase
        .from("training_datasets")
        .select("id, name, sample_count, status, created_at")
        .eq("user_id", selectedUser!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-[hsl(var(--forge-emerald))]" />
        <h1 className="text-2xl font-bold font-display tracking-wide">User Management</h1>
        <Badge variant="outline" className="text-[10px]">{users?.length || 0} users</Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name…"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User list */}
        <div className="lg:col-span-1 space-y-1 max-h-[70vh] overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground p-4">Loading…</p>}
          {users?.map((user) => {
            const creds = creditsMap.get(user.user_id);
            const active = selectedUser === user.user_id;
            return (
              <button
                key={user.user_id}
                onClick={() => setSelectedUser(user.user_id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  active
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {user.display_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{user.display_name || "Unknown"}</span>
                    {creds && <TierBadge tier={creds.tier} size="sm" showFlair={false} />}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {creds ? `${creds.credits_balance} credits` : "No credits data"}
                  </span>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        {/* User detail */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Select a user to view details
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile card */}
              <div className="glass rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                    {selectedProfile?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedProfile?.display_name || "Unknown"}</h2>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Joined {selectedProfile?.created_at ? format(new Date(selectedProfile.created_at), "MMM d, yyyy") : "—"}
                    </div>
                  </div>
                  {selectedCredits && <TierBadge tier={selectedCredits.tier} size="md" className="ml-auto" />}
                </div>
              </div>

              {/* Credits info */}
              {selectedCredits && (
                <div className="glass rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" /> Credits
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold">{selectedCredits.credits_balance}</p>
                      <p className="text-[10px] text-muted-foreground">Balance</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedCredits.credits_used}</p>
                      <p className="text-[10px] text-muted-foreground">Used</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{selectedCredits.monthly_allowance}</p>
                      <p className="text-[10px] text-muted-foreground">Monthly Allowance</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Projects */}
              <div className="glass rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">Projects ({selectedProjects?.length || 0})</h3>
                {selectedProjects?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No projects</p>
                ) : (
                  <div className="space-y-2">
                    {selectedProjects?.slice(0, 10).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                        <span className="text-sm font-medium">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px]">{p.type}</Badge>
                          <Badge variant={p.status === "deployed" ? "default" : "secondary"} className="text-[9px]">{p.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Datasets */}
              <div className="glass rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">Datasets ({selectedDatasets?.length || 0})</h3>
                {selectedDatasets?.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No datasets</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDatasets?.slice(0, 10).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2">
                        <span className="text-sm font-medium">{d.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px]">{d.sample_count} samples</Badge>
                          <Badge variant="secondary" className="text-[9px]">{d.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
