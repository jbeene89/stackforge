import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Discussion {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export function useDiscussions(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["discussions", targetType, targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discussions" as any)
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch profile names for authors
      const userIds = [...new Set((data as any[]).map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      return (data as any[]).map((d: any) => ({
        ...d,
        author_name: nameMap.get(d.user_id) || "Unknown",
      })) as Discussion[];
    },
    enabled: !!targetId,
  });
}

export function useCreateDiscussion() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: { targetType: string; targetId: string; content: string; parentId?: string }) => {
      const { error } = await supabase.from("discussions" as any).insert({
        user_id: user!.id,
        target_type: args.targetType,
        target_id: args.targetId,
        parent_id: args.parentId || null,
        content: args.content,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_, args) => {
      qc.invalidateQueries({ queryKey: ["discussions", args.targetType, args.targetId] });
      toast.success("Comment posted");
    },
    onError: () => toast.error("Failed to post comment"),
  });
}

export function useDeleteDiscussion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (args: { id: string; targetType: string; targetId: string }) => {
      const { error } = await supabase.from("discussions" as any).delete().eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: (_, args) => {
      qc.invalidateQueries({ queryKey: ["discussions", args.targetType, args.targetId] });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });
}
