import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, Repeat2, Bookmark, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: string;
  actor_name: string;
  actor_avatar: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

const ICON_MAP: Record<string, { icon: any; color: string; bg: string }> = {
  like: { icon: Heart, color: "text-destructive", bg: "bg-destructive/10" },
  comment: { icon: MessageCircle, color: "text-primary", bg: "bg-primary/10" },
  follow: { icon: UserPlus, color: "text-chart-3", bg: "bg-chart-3/10" },
  repost: { icon: Repeat2, color: "text-chart-2", bg: "bg-chart-2/10" },
  bookmark: { icon: Bookmark, color: "text-chart-4", bg: "bg-chart-4/10" },
};

export function ActivitySidebar() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: activities = [], isLoading } = useQuery({
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
        const meta = n.metadata as any;
        const actorId = meta?.follower_id || meta?.reactor_id || meta?.viewer_id;
        const profile = profileMap.get(actorId);
        return {
          id: n.id,
          type: n.type || "like",
          actor_name: profile?.full_name || "Someone",
          actor_avatar: profile?.avatar_url || null,
          created_at: n.created_at,
          metadata: meta || {},
        };
      });
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <h3 className="px-4 pt-3 pb-2 text-base font-bold flex items-center gap-2">
        <Bell className="h-4 w-4 text-primary" />
        {isAr ? "النشاط" : "Activity"}
      </h3>
      <div className="divide-y divide-border">
        {activities.slice(0, 6).map((item) => {
          const config = ICON_MAP[item.type] || ICON_MAP.like;
          const Icon = config.icon;
          return (
            <div key={item.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors">
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.actor_avatar || undefined} />
                  <AvatarFallback className="text-[10px] bg-muted">
                    {item.actor_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("absolute -bottom-0.5 -end-0.5 h-4 w-4 rounded-full flex items-center justify-center", config.bg)}>
                  <Icon className={cn("h-2.5 w-2.5", config.color)} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed">
                  <span className="font-semibold">{item.actor_name}</span>{" "}
                  <span className="text-muted-foreground">
                    {item.type === "follow" && (isAr ? "بدأ بمتابعتك" : "followed you")}
                    {item.type === "reaction" && (isAr ? "تفاعل مع منشورك" : "reacted to your post")}
                    {item.type === "follow_request" && (isAr ? "يريد متابعتك" : "wants to follow you")}
                    {item.type === "story_view" && (isAr ? "شاهد قصتك" : "viewed your story")}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(item.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
