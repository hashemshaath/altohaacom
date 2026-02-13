import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Records a profile view and provides analytics data for the profile owner.
 */
export function useRecordProfileView(profileUserId: string | undefined) {
  const { user } = useAuth();

  useEffect(() => {
    if (!profileUserId) return;
    // Don't record if viewing own profile
    if (user?.id === profileUserId) return;

    const record = async () => {
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android/i.test(ua);
      const browser = /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : /Firefox/i.test(ua) ? "Firefox" : "Other";
      
      // Determine viewer type
      let viewerType = "individual";
      let companyId: string | null = null;
      if (user?.id) {
        const { data } = await supabase.rpc("get_user_company_id", { p_user_id: user.id });
        if (data && data.length > 0) {
          viewerType = "company";
          companyId = data[0];
        }
      }

      await supabase.from("profile_views").insert({
        profile_user_id: profileUserId,
        viewer_user_id: user?.id || null,
        viewer_user_agent: ua,
        referrer: document.referrer || null,
        device_type: isMobile ? "mobile" : "desktop",
        browser,
        viewer_type: viewerType,
        company_id: companyId,
      });
    };

    record();
  }, [profileUserId, user?.id]);
}

export function useProfileAnalytics(profileUserId: string | undefined) {
  return useQuery({
    queryKey: ["profile-analytics", profileUserId],
    queryFn: async () => {
      if (!profileUserId) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: allViews } = await supabase
        .from("profile_views")
        .select("*")
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
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
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
    staleTime: 1000 * 60 * 5,
  });
}
