import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Search, MapPin, ChefHat } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { FollowButton } from "./FollowButton";
import { ChefBadge } from "./ChefBadge";
import { MessageButton } from "./MessageButton";

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
  country_code: string | null;
  is_verified: boolean;
}

type SortOption = "name" | "newest" | "verified";

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
        .select("user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url, specialization, specialization_ar, experience_level, location, country_code, is_verified, created_at")
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
      // Default: name
      const nameA = (isAr ? a.full_name_ar : null) || a.full_name || "";
      const nameB = (isAr ? b.full_name_ar : null) || b.full_name || "";
      return nameA.localeCompare(nameB, isAr ? "ar" : "en");
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "ابحث عن طهاة..." : "Search chefs..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 rounded-xl border-border/50 bg-muted/20"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[160px] rounded-xl">
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
      <p className="text-xs text-muted-foreground">
        {isAr ? `${filtered.length} طاهٍ` : `${filtered.length} chef${filtered.length !== 1 ? "s" : ""}`}
      </p>

      {/* Chefs Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((chef) => {
          const displayName = isAr
            ? (chef.display_name_ar || chef.full_name_ar || chef.display_name || chef.full_name)
            : (chef.display_name || chef.full_name);
          const displaySpec = isAr && chef.specialization_ar ? chef.specialization_ar : chef.specialization;

          return (
            <Card
              key={chef.user_id}
              className="group border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-border/50 active:scale-[0.98] h-full"
            >
              <CardContent className="p-3 sm:p-4 h-full">
                <div className="flex flex-col items-center text-center gap-2 h-full">
                  <Link to={`/${chef.username || chef.user_id}`} className="shrink-0 relative">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/15 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/30 group-hover:shadow-lg">
                      <AvatarImage src={chef.avatar_url || undefined} alt={displayName || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {(displayName || "C")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {chef.is_verified && (
                      <div className="absolute -bottom-0.5 -end-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm text-[10px]">
                        ✓
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 w-full flex-1 space-y-0.5">
                    <Link to={`/${chef.username || chef.user_id}`} className="block">
                      <h3
                        className={`font-bold group-hover:text-primary transition-colors leading-tight text-center break-words ${
                          (displayName || "Chef").length > 16 ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"
                        }`}
                      >
                        {displayName || "Chef"}
                        <ChefBadge userId={chef.user_id} />
                      </h3>
                    </Link>

                    {chef.experience_level && (
                      <Badge variant="secondary" className="capitalize text-[10px] px-2 h-4">
                        {chef.experience_level}
                      </Badge>
                    )}

                    {displaySpec && (
                      <p className="flex items-center justify-center gap-1 truncate text-[11px] text-muted-foreground">
                        <ChefHat className="h-3 w-3 shrink-0" />
                        {displaySpec}
                      </p>
                    )}

                    {chef.location && (
                      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {chef.country_code ? `${countryFlag(chef.country_code)} ` : ""}
                        {chef.location}
                      </p>
                    )}
                  </div>

                  {user && (
                    <div className="flex items-center gap-1.5 w-full mt-auto pt-1">
                      <FollowButton userId={chef.user_id} userName={displayName || undefined} fullWidth />
                      <MessageButton userId={chef.user_id} variant="outline" size="sm" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <User className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? (isAr ? "لا توجد نتائج للبحث" : "No results found")
                : (isAr ? "اكتشف الطهاة في المجتمع" : "Discover chefs in the community")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
