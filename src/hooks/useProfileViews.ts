import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDeviceType } from "@/lib/deviceType";
import { getBrowser } from "@/lib/analyticsUtils";
import { MS_PER_DAY, MS_PER_WEEK } from "@/lib/constants";

/**
 * Records a profile view and provides analytics data for the profile owner.
 */
export function useRecordProfileView(profileUserId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tracked = useRef(false);

  useEffect(() => {
    if (!profileUserId || tracked.current) return;
    // Don't record if viewing own profile
    if (user?.id === profileUserId) return;
    tracked.current = true;

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const record = async () => {
      try {
        const deviceType = getDeviceType();
        const browser = getBrowser();
        
        // Determine viewer type
        let viewerType = "individual";
        let companyId: string | null = null;
        if (user?.id) {
          try {
            const { data } = await supabase.rpc("get_user_company_id", { p_user_id: user.id });
            if (data && Array.isArray(data) && data.length > 0) {
              viewerType = "company";
              companyId = data[0];
            }
          } catch {
            // Not a company user, continue as individual
          }
        }

        if (cancelled) return;

        await supabase.from("profile_views").insert({
          profile_user_id: profileUserId,
          viewer_user_id: user?.id || null,
          viewer_user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          device_type: deviceType,
          browser,
          viewer_type: viewerType,
          company_id: companyId,
        });

        // Refetch the profile to reflect the updated view_count from the trigger
        if (!cancelled) {
          timerId = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["publicProfile"] });
          }, 500);
        }
      } catch {
        // Non-critical — profile view recording can fail silently
      }
    };

    record();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [profileUserId, user?.id, queryClient]);
}

export function useProfileAnalytics(profileUserId: string | undefined) {
  return useQuery({
    queryKey: ["profile-analytics", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - MS_PER_WEEK).toISOString();

      const { data: allViews } = await supabase
        .from("profile_views")
        .select("id, created_at, viewer_user_id, viewer_ip, device_type, browser, viewer_type, referrer")
        .eq("profile_user_id", profileUserId)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });

      const views = allViews || [];

      // Total views
      const totalViews = views.length;
      const last7Days = views.filter(v => v.created_at >= sevenDaysAgo).length;

      // Unique visitors (by viewer_user_id or viewer_ip)
      const uniqueVisitors = new Set(views.map(v => v.viewer_user_id || v.viewer_ip || v.id)).size;

      // By device type
      const deviceBreakdown = views.reduce((acc, v) => {
        const d = v.device_type || "unknown";
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // By browser
      const browserBreakdown = views.reduce((acc, v) => {
        const b = v.browser || "unknown";
        acc[b] = (acc[b] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // By viewer type (individual vs company)
      const viewerTypeBreakdown = views.reduce((acc, v) => {
        const t = v.viewer_type || "individual";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Daily views for chart
      const dailyViews: { date: string; views: number }[] = [];
      const dayMap = new Map<string, number>();
      views.forEach(v => {
        const day = v.created_at.split("T")[0];
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });
      // Fill in missing days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * MS_PER_DAY);
        const key = d.toISOString().split("T")[0];
        dailyViews.push({ date: key, views: dayMap.get(key) || 0 });
      }

      // By referrer
      const referrerBreakdown = views.reduce((acc, v) => {
        let ref = "Direct";
        if (v.referrer) {
          try {
            ref = new URL(v.referrer).hostname;
          } catch {
            ref = v.referrer;
          }
        }
        acc[ref] = (acc[ref] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Time of day distribution
      const hourlyBreakdown = new Array(24).fill(0);
      views.forEach(v => {
        const hour = new Date(v.created_at).getHours();
        hourlyBreakdown[hour]++;
      });

      return {
        totalViews,
        last7Days,
        uniqueVisitors,
        deviceBreakdown,
        browserBreakdown,
        viewerTypeBreakdown,
        dailyViews,
        referrerBreakdown,
        hourlyBreakdown,
      };
    },
    enabled: !!profileUserId,
    ...CACHE.medium,
  });
}
