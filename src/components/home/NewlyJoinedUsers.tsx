import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDisplayName } from "@/lib/getDisplayName";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { UserPlus, ChefHat, MapPin } from "lucide-react";
import { StaggeredList } from "@/components/ui/staggered-list";
import { cn } from "@/lib/utils";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { localizeCity } from "@/lib/localizeLocation";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { SectionHeader } from "./SectionHeader";
import { FilterChip } from "./FilterChip";
import { useSectionConfig } from "@/components/home/SectionKeyContext";

export function NewlyJoinedUsers() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const sectionConfig = useSectionConfig();

  const itemCount = sectionConfig?.item_count || 12;
  const showFilters = sectionConfig?.show_filters ?? true;
  const showViewAll = sectionConfig?.show_view_all ?? true;
  const sectionTitle = sectionConfig
    ? (isAr ? sectionConfig.title_ar || "أحدث الأعضاء في مجتمعنا" : sectionConfig.title_en || "Welcome Our Newest Members")
    : (isAr ? "أحدث الأعضاء في مجتمعنا" : "Welcome Our Newest Members");
  const sectionSubtitle = sectionConfig
    ? (isAr ? sectionConfig.subtitle_ar || "" : sectionConfig.subtitle_en || "")
    : (isAr ? "انضم إلى مجتمع متنامٍ من الطهاة والمحترفين حول العالم" : "Join a growing community of chefs and professionals worldwide");

  const { data: users = [] } = useQuery({
    queryKey: ["newly-joined-users", itemCount],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url, country_code, city, specialization, specialization_ar, nationality, show_nationality, created_at")
        .order("created_at", { ascending: false })
        .limit(itemCount);
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });

  const countries = useMemo(() => {
    const m = new Map<string, number>();
    users.forEach((u: any) => {
      if (u.country_code) m.set(u.country_code, (m.get(u.country_code) || 0) + 1);
    });
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));
  }, [users]);

  const filtered = useMemo(() => {
    if (!countryFilter) return users;
    return users.filter((u: any) => u.country_code === countryFilter);
  }, [users, countryFilter]);

  if (users.length === 0) return null;

  return (
    <section aria-labelledby="new-users-heading" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        <SectionHeader
          icon={UserPlus}
          badge={isAr ? "انضموا حديثاً" : "Newly Joined"}
          title={sectionTitle}
          subtitle={sectionSubtitle}
          dataSource="profiles"
          itemCount={filtered.length}
          viewAllHref={showViewAll ? "/community" : undefined}
          viewAllLabel={isAr ? "عرض المجتمع" : "View Community"}
          isAr={isAr}
          filters={showFilters && countries.length > 1 ? (
            <>
              <FilterChip label={isAr ? "الكل" : "All"} active={!countryFilter} count={users.length} onClick={() => setCountryFilter(null)} />
              {countries.map(({ code, count }) => {
                const co = allCountries.find((c: any) => c.code === code);
                const name = co ? (isAr ? co.name_ar || co.name : co.name) : code;
                return (
                  <FilterChip
                    key={code}
                    label={`${countryFlag(code)} ${name}`}
                    active={countryFilter === code}
                    count={count}
                    onClick={() => setCountryFilter(countryFilter === code ? null : code)}
                  />
                );
              })}
            </>
          ) : undefined}
        />

        <StaggeredList className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6" stagger={60}>
          {filtered.map((user: any) => {
            const name = getDisplayName(user, isAr);
            const spec = isAr && user.specialization_ar ? user.specialization_ar : user.specialization;
            const initials = name
              ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            const nationalityEmoji = user.show_nationality !== false && user.nationality ? countryFlag(user.nationality) : "";
            const countryObj = allCountries.find((c) => c.code === user.country_code);
            const countryName = countryObj ? (isAr ? countryObj.name_ar || countryObj.name : countryObj.name) : user.country_code;
            const locationParts = [localizeCity(user.city || "", isAr), countryName].filter(Boolean).join(", ");

            return (
              <Link key={user.id} to={user.username ? `/${user.username}` : `/profile/${user.user_id}`} className="group block">
                <Card className="h-full border-border/40 rounded-2xl p-3 text-center transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20">
                  <div className="relative mx-auto mb-2.5 w-fit">
                    <Avatar className="h-11 w-11 sm:h-14 sm:w-14 ring-2 ring-background shadow-md transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage src={user.avatar_url} alt={name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {nationalityEmoji && (
                      <span className="absolute -bottom-1 -end-1 text-sm leading-none drop-shadow">{nationalityEmoji}</span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                    {name || (isAr ? "عضو جديد" : "New Member")}
                  </h3>
                  {spec && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
                      <ChefHat className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                      <span className="truncate">{spec}</span>
                    </div>
                  )}
                  {user.country_code && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground/70">
                      <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" />
                      <span className="truncate">{countryFlag(user.country_code)} {locationParts}</span>
                    </div>
                  )}
                  {user.created_at && (
                    <p className="mt-1 text-[9px] text-muted-foreground/50">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: isAr ? ar : undefined })}
                    </p>
                  )}
                </Card>
              </Link>
            );
          })}
        </StaggeredList>
      </div>
    </section>
  );
}
