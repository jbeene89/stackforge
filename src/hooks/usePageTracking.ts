import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function getSessionId(): string {
  let sid = sessionStorage.getItem("sf_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("sf_session_id", sid);
  }
  return sid;
}

export function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    // Avoid duplicate tracking for same path
    if (path === lastPath.current) return;
    lastPath.current = path;

    const trackView = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("page_views").insert({
          page_path: path,
          referrer: document.referrer || "",
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          session_id: getSessionId(),
          user_id: user?.id || null,
        } as any);
      } catch (e) {
        // Silently fail — analytics should never block the app
        console.warn("Page tracking failed:", e);
      }
    };

    trackView();
  }, [location.pathname]);
}
