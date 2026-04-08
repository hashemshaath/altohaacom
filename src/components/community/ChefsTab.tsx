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
        return new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime();
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
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((chef) => {
          const displayName = isAr
            ? (chef.display_name_ar || chef.full_name_ar || chef.display_name || chef.full_name)
            : (chef.display_name || chef.full_name);
          const displaySpec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;
          const cityName = chef.city || extractCity(chef.location);
          const flag = chef.country_code ? countryFlag(chef.country_code) : "";

          return (
            <div
              key={chef.user_id}
              className="group rounded-2xl border border-border/25 bg-card/80 backdrop-blur-sm p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 active:scale-[0.98]"
            >
              <div className="flex flex-col items-center text-center gap-3">
                {/* Avatar */}
                <Link to={`/${chef.username || chef.user_id}`} className="relative">
                  <Avatar className="h-16 w-16 sm:h-[72px] sm:w-[72px] ring-[3px] ring-border/20 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/25 group-hover:shadow-lg">
                    <AvatarImage src={chef.avatar_url || undefined} alt={displayName || ""} />
                    <AvatarFallback className="bg-primary/8 text-primary font-bold text-xl">
                      {(displayName || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {chef.is_verified && (
                    <div className="absolute -bottom-1 -end-1 h-5.5 w-5.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md text-[11px] ring-2 ring-card">
                      ✓
                    </div>
                  )}
                </Link>

                {/* Name & Info */}
                <div className="min-w-0 w-full space-y-1.5 flex-1">
                  <Link to={`/${chef.username || chef.user_id}`} className="block">
                    <h3 className="font-bold text-[13px] sm:text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {displayName || "Chef"}
                      <ChefBadge userId={chef.user_id} />
                    </h3>
                  </Link>

                  {chef.experience_level && (
                    <Badge variant="secondary" className="capitalize text-[11px] px-2.5 py-0.5 rounded-lg font-semibold">
                      {chef.experience_level}
                    </Badge>
                  )}

                  {displaySpec && (
                    <p className="flex items-center justify-center gap-1 text-[11px] sm:text-[12px] text-muted-foreground leading-snug line-clamp-1">
                      <ChefHat className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      <span className="truncate">{displaySpec}</span>
                    </p>
                  )}

                  {(cityName || flag) && (
                    <p className="flex items-center justify-center gap-1.5 text-[11px] sm:text-[12px] text-muted-foreground/70">
                      {flag && <span className="text-sm leading-none">{flag}</span>}
                      {cityName && <span className="truncate">{cityName}</span>}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {user && (
                  <div className="flex items-center gap-2 w-full mt-auto pt-1">
                    <MessageButton userId={chef.user_id} variant="outline" size="sm" />
                    <FollowButton userId={chef.user_id} userName={displayName || undefined} fullWidth />
                  </div>
                )}
              </div>
            </div>
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
