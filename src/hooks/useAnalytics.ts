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
      const { data, error } = await supabase.functions.invoke("analytics-query", {
        body: { days },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data as AnalyticsData;
    },
    refetchInterval: 60_000,
  });
}
