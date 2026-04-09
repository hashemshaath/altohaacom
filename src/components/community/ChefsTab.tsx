import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Search, ChefHat } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { FollowButton } from "./FollowButton";
import { ChefBadge } from "./ChefBadge";
import { MessageButton } from "./MessageButton";
import { cn } from "@/lib/utils";

interface ChefProfile {
  user_id: string;
  full_name: string | null;
  full_name_ar: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  username: string | null;
  avatar_url: string | null;
  specialization: string | null;
  specialization_ar: string | null;
  experience_level: string | null;
  location: string | null;
  city: string | null;
  country_code: string | null;
  is_verified: boolean;
}

type SortOption = "name" | "newest" | "verified";

/** Extract city from a full location string (take first segment before dash/comma) */
function extractCity(location: string | null): string {
  if (!location) return "";
  const cleaned = location.split(/[–\-,]/)[0].trim();
  return cleaned;
}

export const ChefsTab = memo(function ChefsTab() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");

  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ["community-chefs", user?.id],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, specialization, specialization_ar, experience_level, location, city, country_code, is_verified, created_at")
        .eq("account_status", "active")
        .neq("user_id", user?.id || "")
        .order("is_verified", { ascending: false })
        .order("full_name", { ascending: true })
        .limit(60);

      if (error) {
        console.error("Error fetching chefs:", error);
        return [];
      }

      return (profiles || []) as (ChefProfile & { created_at: string })[];
    },
    staleTime: 1000 * 60 * 3,
  });

  const filtered = chefs
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.full_name?.toLowerCase().includes(q) ||
        c.full_name_ar?.includes(q) ||
        c.specialization?.toLowerCase().includes(q) ||
        c.specialization_ar?.includes(q) ||
        c.location?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "verified") {
        if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const nameA = (isAr ? a.full_name_ar : null) || a.full_name || "";
      const nameB = (isAr ? b.full_name_ar : null) || b.full_name || "";
      return nameA.localeCompare(nameB, isAr ? "ar" : "en");
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-11 w-full max-w-md rounded-xl" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[240px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder={isAr ? "ابحث عن طهاة..." : "Search chefs..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 h-11 rounded-xl border-border/40 bg-muted/15 text-base focus-visible:ring-primary/30"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-11 rounded-xl border-border/40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{isAr ? "الاسم" : "Name"}</SelectItem>
            <SelectItem value="newest">{isAr ? "الأحدث" : "Newest"}</SelectItem>
            <SelectItem value="verified">{isAr ? "الموثقون أولاً" : "Verified First"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-[13px] text-muted-foreground font-medium">
        {isAr ? `${filtered.length} طاهٍ` : `${filtered.length} chef${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Chefs Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((chef) => {
          const displayName = isAr
            ? (chef.display_name_ar || chef.full_name_ar || chef.display_name || chef.full_name)
            : (chef.display_name || chef.full_name);
          const displaySpec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
          const cityName = chef.city || extractCity(chef.location);
          const flag = chef.country_code ? countryFlag(chef.country_code) : "";

          return (
            <Link
              key={chef.user_id}
              to={`/${chef.username || chef.user_id}`}
              className="group relative flex flex-col items-center rounded-2xl border border-border/20 bg-card p-4 pt-5 text-center transition-all duration-200 hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5"
            >
              {/* Avatar */}
              <div className="relative mb-2.5">
                <Avatar className="h-14 w-14 ring-2 ring-primary/10 transition-transform duration-200 group-hover:ring-primary/30">
                  <AvatarImage src={chef.avatar_url || undefined} alt={displayName || ""} />
                  <AvatarFallback className="bg-primary/8 text-primary font-bold text-base">
                    {(displayName || "C")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {chef.is_verified && (
                  <div className="absolute -bottom-0.5 -end-0.5 h-4.5 w-4.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] ring-2 ring-card">
                    ✓
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="font-semibold text-sm leading-snug truncate w-full group-hover:text-primary transition-colors">
                {displayName || "Chef"}
              </h3>
              <ChefBadge userId={chef.user_id} />

              {/* Spec */}
              {displaySpec && (
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate w-full">{displaySpec}</p>
              )}

              {/* Location */}
              {(cityName || flag) && (
                <p className="text-[11px] text-muted-foreground/60 mt-0.5 flex items-center gap-1 justify-center">
                  {flag && <span className="text-xs">{flag}</span>}
                  {cityName && <span className="truncate max-w-[80px]">{cityName}</span>}
                </p>
              )}

              {/* Follow */}
              {user && (
                <div className="mt-3 w-full" onClick={(e) => e.preventDefault()}>
                  <FollowButton userId={chef.user_id} userName={displayName || undefined} />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-border/30">
            <User className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-foreground/70 mb-1">
            {searchQuery
              ? (isAr ? "لا توجد نتائج للبحث" : "No results found")
              : (isAr ? "اكتشف الطهاة في المجتمع" : "Discover chefs in the community")}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {searchQuery
              ? (isAr ? "جرب كلمات بحث مختلفة" : "Try different search terms")
              : (isAr ? "سيظهر الطهاة هنا عند انضمامهم" : "Chefs will appear here as they join")}
          </p>
        </div>
      )}
    </div>
  );
});
