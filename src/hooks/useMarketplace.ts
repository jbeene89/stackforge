import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MarketplaceTemplate {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  type: string;
  tier: string;
  price_credits: number;
  source_id: string | null;
  template_data: any;
  tags: string[];
  downloads: number;
  status: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

const TIER_PRICES: Record<string, number> = {
  small: 5,
  medium: 15,
  large: 30,
};

export function useMarketplaceTemplates(type?: string) {
  return useQuery({
    queryKey: ["marketplace-templates", type],
    queryFn: async () => {
      // Use the public view which excludes template_data
      let query = supabase
        .from("marketplace_templates_public" as any)
        .select("*")
        .order("downloads", { ascending: false });

      if (type && type !== "all") {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get creator names
      const creatorIds = [...new Set((data as any[]).map((d: any) => d.creator_id))];
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("user_id, display_name")
        .in("user_id", creatorIds);

      const nameMap = new Map((profiles as any[])?.map((p: any) => [p.user_id, p.display_name]) || []);

      return (data as any[]).map((d: any) => ({
        ...d,
        template_data: null, // Not included in public view
        creator_name: nameMap.get(d.creator_id) || "Anonymous",
      })) as MarketplaceTemplate[];
    },
  });
}

export function useMyListings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_templates" as any)
        .select("*")
        .eq("creator_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as MarketplaceTemplate[];
    },
  });
}

export function useMyPurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_purchases" as any)
        .select("*")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function usePublishTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: {
      name: string;
      description: string;
      type: "module" | "stack" | "project";
      tier: "small" | "medium" | "large";
      source_id?: string;
      template_data: any;
      tags?: string[];
    }) => {
      const { error } = await supabase.from("marketplace_templates" as any).insert({
        creator_id: user!.id,
        name: args.name,
        description: args.description,
        type: args.type,
        tier: args.tier,
        price_credits: TIER_PRICES[args.tier],
        source_id: args.source_id || null,
        template_data: args.template_data,
        tags: args.tags || [],
        status: "published",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace-templates"] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Template published to marketplace!");
    },
    onError: () => toast.error("Failed to publish template"),
  });
}

export function usePurchaseTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase.functions.invoke("purchase-template", {
        body: { template_id: templateId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-credits"] });
      qc.invalidateQueries({ queryKey: ["my-purchases"] });
      qc.invalidateQueries({ queryKey: ["marketplace-templates"] });
      toast.success("Template purchased! Credits deducted.");
    },
    onError: (err: Error) => toast.error(err.message || "Purchase failed"),
  });
}

export function useReferralStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["referral-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: referrals } = await supabase
        .from("referrals" as any)
        .select("*")
        .eq("referrer_id", user!.id);

      const { data: earnings } = await supabase
        .from("referral_earnings" as any)
        .select("*")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });

      // Fetch the user's unique referral code from their profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user!.id)
        .single();

      const totalEarned = (earnings as any[] || []).reduce((sum: number, e: any) => sum + e.amount, 0);

      return {
        referralCount: (referrals as any[] || []).length,
        totalEarned,
        earnings: (earnings as any[] || []),
        referralCode: (profile as any)?.referral_code || "",
      };
    },
  });
}

export { TIER_PRICES };
