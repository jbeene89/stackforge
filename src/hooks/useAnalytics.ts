import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalVisitors: number;
  totalPageViews: number;
  bounceRate: number;
  avgSessionDuration: string;
  topPages: { page: string; views: number }[];
  topSources: { source: string; visits: number }[];
  devices: { label: string; value: number }[];
}

export function useAnalytics(days = 7) {
  return useQuery({
    queryKey: ["site-analytics", days],
    queryFn: async (): Promise<AnalyticsData> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data: views, error } = await supabase
        .from("page_views")
        .select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false }) as any;

      if (error) throw error;
      const rows: any[] = views || [];

      // Unique sessions
      const sessions = new Set(rows.map((r) => r.session_id).filter(Boolean));
      const totalVisitors = sessions.size || rows.length;

      const totalPageViews = rows.length;

      // Bounce rate: sessions with only 1 page view
      const sessionPageCounts: Record<string, number> = {};
      rows.forEach((r) => {
        const sid = r.session_id || r.id;
        sessionPageCounts[sid] = (sessionPageCounts[sid] || 0) + 1;
      });
      const sessionIds = Object.keys(sessionPageCounts);
      const bounceSessions = sessionIds.filter((s) => sessionPageCounts[s] === 1).length;
      const bounceRate = sessionIds.length > 0 ? Math.round((bounceSessions / sessionIds.length) * 100) : 0;

      // Top pages
      const pageCounts: Record<string, number> = {};
      rows.forEach((r) => {
        pageCounts[r.page_path] = (pageCounts[r.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([page, views]) => ({ page, views }));

      // Top sources from referrer
      const sourceCounts: Record<string, number> = {};
      rows.forEach((r) => {
        let source = "Direct";
        if (r.referrer) {
          try {
            source = new URL(r.referrer).hostname || "Direct";
          } catch {
            source = r.referrer || "Direct";
          }
        }
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });
      const topSources = Object.entries(sourceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([source, visits]) => ({ source, visits }));

      // Devices
      const deviceCounts: Record<string, number> = {};
      rows.forEach((r) => {
        const d = r.device_type || "desktop";
        deviceCounts[d] = (deviceCounts[d] || 0) + 1;
      });
      const devices = Object.entries(deviceCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => ({ label, value }));

      return {
        totalVisitors,
        totalPageViews,
        bounceRate,
        avgSessionDuration: "—",
        topPages,
        topSources,
        devices,
      };
    },
    refetchInterval: 60_000,
  });
}
