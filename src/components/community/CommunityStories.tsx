import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const CommunityStories = memo(function CommunityStories() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: profiles = [] } = useQuery({
    queryKey: ["community-stories-profiles", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, display_name, display_name_ar, avatar_url, username")
        .eq("account_status", "active")
        .neq("user_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(12);
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-story-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name, full_name")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  if (profiles.length === 0 && !user) return null;

  return (
    <div className="border-b border-border/10 bg-background">
      <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 py-3 touch-pan-x">
        {/* My story */}
        {user && (
          <button className="flex flex-col items-center gap-1 flex-shrink-0 touch-manipulation active:scale-[0.95]">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-border/20">
                <AvatarImage src={myProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted/40 text-muted-foreground text-sm font-semibold">
                  {(myProfile?.display_name || myProfile?.full_name || "Y")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -end-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center ring-2 ring-background">
                <Plus className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground/70 font-medium w-14 text-center truncate">
              {isAr ? "قصتك" : "Your Story"}
            </span>
          </button>
        )}

        {/* Other stories */}
        {profiles.slice(0, 8).map((p) => {
          const name = isAr
            ? (p.display_name_ar || p.full_name_ar || p.display_name || p.full_name)
            : (p.display_name || p.full_name);
          return (
            <button
              key={p.user_id}
              className="flex flex-col items-center gap-1 flex-shrink-0 touch-manipulation active:scale-[0.95]"
            >
              <Avatar className="h-14 w-14 ring-2 ring-primary/30 p-0.5">
                <AvatarImage src={p.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                  {(name || "C")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground/70 font-medium w-14 text-center truncate">
                {name?.split(" ")[0] || "Chef"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
