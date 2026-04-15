import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { useVisibleRefetchInterval } from "@/hooks/useVisibleRefetchInterval";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Repeat2, Bookmark, Bell, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CACHE } from "@/lib/queryConfig";

interface ActivityItem {
  id: string;
  type: string;
  actor_name: string;
  actor_avatar: string | null;
  created_at: string;
}

const ICON_MAP: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  like: { icon: Heart, color: "text-destructive", bg: "bg-destructive/10" },
  comment: { icon: MessageCircle, color: "text-primary", bg: "bg-primary/10" },
  follow: { icon: UserPlus, color: "text-chart-3", bg: "bg-chart-3/10" },
  repost: { icon: Repeat2, color: "text-chart-2", bg: "bg-chart-2/10" },
  bookmark: { icon: Bookmark, color: "text-chart-4", bg: "bg-chart-4/10" },
};

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  follow: { en: "followed you", ar: "بدأ بمتابعتك" },
  reaction: { en: "reacted to your post", ar: "تفاعل مع منشورك" },
  follow_request: { en: "wants to follow you", ar: "يريد متابعتك" },
  story_view: { en: "viewed your story", ar: "شاهد قصتك" },
};

export const ActivitySidebar = memo(function ActivitySidebar() {
  const { user } = useAuth();
  const isAr = useIsAr();

  const { data: activities = [] } = useQuery({
    queryKey: ["community-activity", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, title_ar, created_at, metadata")
        .eq("user_id", user.id)
        .in("type", ["reaction", "follow", "follow_request", "story_view"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data?.length) return [];

      const actorIds = data
        .map((n) => (n.metadata as any)?.follower_id || (n.metadata as any)?.reactor_id)
        .filter(Boolean);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", actorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((n): ActivityItem => {
        const meta = n.metadata as Record<string, string> | null;
        const actorId = meta?.follower_id || meta?.reactor_id || meta?.viewer_id;
        const profile = profileMap.get(actorId);
        return {
          id: n.id,
          type: n.type || "like",
          actor_name: profile?.full_name || "Someone",
          actor_avatar: profile?.avatar_url || null,
          created_at: n.created_at,
        };
      });
    },
    enabled: !!user,
    staleTime: CACHE.short.staleTime,
    refetchInterval: useVisibleRefetchInterval(1000 * 60 * 2),
  });

  if (!user || activities.length === 0) return null;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return isAr ? "الآن" : "now";
    if (mins < 60) return `${mins}${isAr ? "د" : "m"}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${isAr ? "س" : "h"}`;
    return `${Math.floor(hrs / 24)}${isAr ? "ي" : "d"}`;
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <h3 className="px-4 pt-3 pb-2 text-sm font-bold flex items-center gap-2">
        <Bell className="h-3.5 w-3.5 text-primary" />
        {isAr ? "النشاط" : "Activity"}
      </h3>
      <div className="divide-y divide-border/20">
        {activities.slice(0, 5).map((item) => {
          const config = ICON_MAP[item.type] || ICON_MAP.like;
          const Icon = config.icon;
          const label = TYPE_LABELS[item.type];
          return (
            <div key={item.id} className="flex items-start gap-2 px-4 py-2 hover:bg-muted/20 transition-colors">
              <div className="relative shrink-0 mt-0.5">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={item.actor_avatar || undefined} />
                  <AvatarFallback className="text-[12px] bg-muted">
                    {item.actor_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("absolute -bottom-0.5 -end-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center", config.bg)}>
                  <Icon className={cn("h-2 w-2", config.color)} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] leading-relaxed">
                  <span className="font-semibold">{item.actor_name}</span>{" "}
                  <span className="text-muted-foreground">
                    {label ? (isAr ? label.ar : label.en) : ""}
                  </span>
                </p>
                <p className="text-[12px] text-muted-foreground/60">{formatTime(item.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
