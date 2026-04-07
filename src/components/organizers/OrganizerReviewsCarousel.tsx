import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageSquareQuote } from "lucide-react";

interface Props {
  isAr: boolean;
}

export const OrganizerReviewsCarousel = memo(function OrganizerReviewsCarousel({ isAr }: Props) {
  const { data: reviews = [] } = useQuery({
    queryKey: ["organizer-page-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibition_reviews")
        .select("id, rating, content, created_at, user_id, exhibition_id")
        .gte("rating", 4)
        .not("content", "is", null)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;

      // Get user profiles for each review
      if (!data || data.length === 0) return [];
      const userIds = [...new Set(data.map(r => r.user_id).filter(Boolean))];
      const exIds = [...new Set(data.map(r => r.exhibition_id).filter(Boolean))];

      const [profilesRes, exhibitionsRes] = await Promise.all([
        userIds.length > 0
          ? supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds)
          : { data: [] },
        exIds.length > 0
          ? supabase.from("exhibitions").select("id, title, title_ar, organizer_id").in("id", exIds)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
      const exMap = new Map((exhibitionsRes.data || []).map(e => [e.id, e]));

      // Get organizer names
      const orgIds = [...new Set((exhibitionsRes.data || []).map(e => e.organizer_id).filter(Boolean))];
      let orgMap = new Map();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase.from("organizers").select("id, name, name_ar").in("id", orgIds);
        orgMap = new Map((orgs || []).map(o => [o.id, o]));
      }

      return data.map(r => {
        const profile = profileMap.get(r.user_id);
        const exhibition = exMap.get(r.exhibition_id);
        const organizer = exhibition ? orgMap.get(exhibition.organizer_id) : null;
        return {
          ...r,
          user_name: profile?.full_name || (isAr ? "مستخدم" : "User"),
          avatar_url: profile?.avatar_url,
          exhibition_title: exhibition ? (isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title) : "",
          organizer_name: organizer ? (isAr && organizer.name_ar ? organizer.name_ar : organizer.name) : "",
        };
      });
    },
    staleTime: 1000 * 60 * 10,
  });

  if (reviews.length < 2) return null;

  return (
    <section className="rounded-2xl border border-border/40 bg-card p-5">
      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
        <MessageSquareQuote className="h-5 w-5 text-primary" />
        {isAr ? "آخر التقييمات" : "Recent Reviews"}
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="snap-start shrink-0 w-[260px] rounded-xl border border-border/30 bg-muted/20 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 rounded-lg">
                {r.avatar_url && <AvatarImage src={r.avatar_url} />}
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[12px] font-bold">
                  {r.user_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{r.user_name}</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2.5 w-2.5 ${i < r.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">
              "{r.content}"
            </p>

            {(r.exhibition_title || r.organizer_name) && (
              <div className="pt-2 border-t border-border/20">
                {r.exhibition_title && (
                  <p className="text-[12px] text-muted-foreground truncate">{r.exhibition_title}</p>
                )}
                {r.organizer_name && (
                  <p className="text-[12px] text-primary/70 font-medium truncate">{isAr ? "بواسطة" : "by"} {r.organizer_name}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
});
