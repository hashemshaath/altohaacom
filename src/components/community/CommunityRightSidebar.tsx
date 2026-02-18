import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/formatNumber";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdBanner } from "@/components/ads/AdBanner";
import {
  Search, TrendingUp, Hash,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const FALLBACK_TOPICS_EN = [
  { tag: "CookingCompetitions", count: 128 },
  { tag: "RamadanRecipes", count: 96 },
  { tag: "CulinaryArts", count: 74 },
  { tag: "ArabChefs", count: 52 },
];
const FALLBACK_TOPICS_AR = [
  { tag: "مسابقات_الطهي", count: 128 },
  { tag: "وصفات_رمضان", count: 96 },
  { tag: "فن_الطهي", count: 74 },
  { tag: "طهاة_العرب", count: 52 },
];

interface CommunityRightSidebarProps {
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
}

export function CommunityRightSidebar({ rightSidebarOpen, setRightSidebarOpen }: CommunityRightSidebarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: trendingTopics = [] } = useQuery({
    queryKey: ["community-trending", isAr],
    queryFn: async () => {
      const { data: posts } = await supabase
        .from("posts")
        .select("content")
        .is("reply_to_post_id", null)
        .eq("moderation_status", "approved")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!posts?.length) return isAr ? FALLBACK_TOPICS_AR : FALLBACK_TOPICS_EN;

      const tagCounts: Record<string, number> = {};
      posts.forEach((post) => {
        const matches = post.content?.match(/#([^\s#]+)/g);
        if (matches) {
          matches.forEach((m: string) => {
            const tag = m.replace("#", "");
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const sorted = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([tag, count]) => ({ tag, count }));

      if (sorted.length < 4) {
        const fallbacks = isAr ? FALLBACK_TOPICS_AR : FALLBACK_TOPICS_EN;
        const existing = new Set(sorted.map((s) => s.tag));
        fallbacks.forEach((f) => {
          if (!existing.has(f.tag) && sorted.length < 6) sorted.push(f);
        });
      }

      return sorted;
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <aside className={cn(
      "hidden xl:flex flex-col shrink-0 sticky top-[56px] self-start py-2 ps-1 transition-all duration-300 ease-in-out",
      rightSidebarOpen ? "w-[260px]" : "w-[48px]"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 mb-2 self-start rounded-full text-muted-foreground hover:text-foreground"
        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
      >
        {rightSidebarOpen
          ? (isAr ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />)
          : (isAr ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />)
        }
      </Button>

      {rightSidebarOpen && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث في المجتمع..." : "Search community..."}
              className="ps-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <h3 className="px-4 pt-3 pb-2 text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {isAr ? "الأكثر تداولاً" : "Trending"}
            </h3>
            <div className="divide-y divide-border">
              {trendingTopics.map((topic, i) => (
                <Link
                  key={i}
                  to={`/community?tag=${encodeURIComponent(topic.tag)}`}
                  className="block px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span>{isAr ? "رائج" : "Trending"}</span>
                    {i === 0 && <span className="ms-auto text-[9px] text-primary font-bold">{isAr ? "الأول" : "#1"}</span>}
                  </div>
                  <p className="text-sm font-bold mt-0.5 group-hover:text-primary transition-colors">#{topic.tag}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatNumber(topic.count)} {isAr ? "منشور" : "posts"}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <AdBanner placementSlug="sidebar" className="rounded-2xl overflow-hidden" />

          <div className="px-4">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {isAr ? "الشروط · الخصوصية · سياسة ملفات تعريف الارتباط · حول" : "Terms · Privacy · Cookie Policy · About"}
              <br />
              © {new Date().getFullYear()} Altohaa
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
