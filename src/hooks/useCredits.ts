import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
    refetchInterval: 30000, // refresh every 30s
    queryFn: async (): Promise<UserCredits> => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits_balance, credits_used, monthly_allowance, tier, last_reset_at")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      // If no row yet (existing user before migration), create one
      if (!data) {
        const { data: inserted, error: insertErr } = await supabase
          .from("user_credits")
          .insert({ user_id: user!.id } as any)
          .select("credits_balance, credits_used, monthly_allowance, tier, last_reset_at")
          .single();
        if (insertErr) throw insertErr;
        return inserted as unknown as UserCredits;
      }

      return data as unknown as UserCredits;
    },
  });
}

export function useCreditTransactions(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["credit-transactions", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as any[];
    },
  });
}
