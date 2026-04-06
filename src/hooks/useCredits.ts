import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cacheGetAll, cachePutAll, cachePut } from "@/lib/offlineCache";

export interface UserCredits {
  credits_balance: number;
  credits_used: number;
  monthly_allowance: number;
  tier: string;
  last_reset_at: string;
}

export function useCredits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-credits", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async (): Promise<UserCredits> => {
      try {
        const { data, error } = await supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", user!.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          const { data: inserted, error: insertErr } = await supabase
            .from("user_credits")
            .insert({ user_id: user!.id } as any)
            .select("*")
            .single();
          if (insertErr) throw insertErr;
          cachePut("user_credits", inserted as any).catch(() => {});
          return inserted as unknown as UserCredits;
        }

        cachePut("user_credits", data as any).catch(() => {});
        return data as unknown as UserCredits;
      } catch (e) {
        if (!navigator.onLine) {
          const cached = await cacheGetAll<any>("user_credits");
          const mine = cached.find(c => c.user_id === user!.id);
          if (mine) return mine as UserCredits;
        }
        throw e;
      }
    },
  });
}

export function useCreditTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["credit-transactions", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        cachePutAll("credit_transactions", data as any[]).catch(() => {});
        return data as any[];
      } catch (e) {
        if (!navigator.onLine) {
          const cached = await cacheGetAll<any>("credit_transactions");
          return cached
            .filter(t => t.user_id === user!.id)
            .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
            .slice(0, limit);
        }
        throw e;
      }
    },
  });
}
