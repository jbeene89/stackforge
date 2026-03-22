import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Checks for a pending referral code in localStorage and processes it.
 * Call this on any page the user may land on after email confirmation.
 */
export function usePendingReferral() {
  const { user } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (!user || processed.current) return;
    const code = localStorage.getItem("pending_referral_code");
    if (!code) return;

    processed.current = true;
    localStorage.removeItem("pending_referral_code");

    supabase.functions.invoke("process-referral", {
      body: { referral_code: code },
    }).then(({ data }) => {
      if (data?.success) {
        toast.success(data.message || "Referral bonus applied!");
      }
    }).catch(() => {});
  }, [user]);
}
