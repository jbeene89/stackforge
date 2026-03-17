import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type CaptureType = "text" | "voice" | "photo";

interface MobileCapture {
  id: string;
  user_id: string;
  dataset_id: string | null;
  type: string;
  title: string;
  content: string;
  file_path: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  processed_at: string | null;
}

export function useMobileCaptures() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: captures = [], isLoading } = useQuery({
    queryKey: ["mobile-captures", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mobile_captures" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as MobileCapture[];
    },
    enabled: !!user,
  });

  const uploadFile = async (file: Blob, fileName: string): Promise<string | null> => {
    if (!user) return null;
    const path = `${user.id}/${Date.now()}_${fileName}`;
    const { error } = await supabase.storage
      .from("mobile-captures")
      .upload(path, file, { contentType: file.type });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    return path;
  };

  const addCapture = useMutation({
    mutationFn: async (params: {
      type: CaptureType;
      title: string;
      content: string;
      file?: Blob;
      fileName?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      let filePath: string | null = null;
      if (params.file && params.fileName) {
        filePath = await uploadFile(params.file, params.fileName);
        if (!filePath) throw new Error("File upload failed");
      }

      const { data, error } = await supabase
        .from("mobile_captures" as any)
        .insert({
          user_id: user.id,
          type: params.type,
          title: params.title,
          content: params.content,
          file_path: filePath,
          status: "queued",
          metadata: params.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MobileCapture;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-captures"] });
      toast({ title: "Captured!", description: "Queued for pipeline processing." });
    },
    onError: (err: Error) => {
      toast({ title: "Capture failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteCapture = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mobile_captures" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-captures"] });
    },
  });

  return { captures, isLoading, addCapture, deleteCapture };
}
