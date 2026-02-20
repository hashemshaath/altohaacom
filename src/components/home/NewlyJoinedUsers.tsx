import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { UserPlus, ArrowRight, ChefHat, MapPin } from "lucide-react";
import { SectionReveal } from "@/components/ui/section-reveal";
import { cn } from "@/lib/utils";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";

export function NewlyJoinedUsers() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();

  const { data: users = [] } = useQuery({
    queryKey: ["newly-joined-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, full_name_ar, avatar_url, country_code, city, specialization, specialization_ar, nationality, show_nationality, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });

  if (users.length === 0) return null;

  return (
    <section className="py-10 md:py-14" aria-labelledby="new-users-heading">
      <div className="container">
        <SectionReveal>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2 gap-1">
                <UserPlus className="h-3 w-3" />
                {isAr ? "انضموا حديثاً" : "Newly Joined"}
              </Badge>
              <h2 id="new-users-heading" className={cn("text-xl font-bold sm:text-2xl", !isAr && "font-serif")}>
                {isAr ? "أحدث الأعضاء في مجتمعنا" : "Welcome Our Newest Members"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr
                  ? "انضم إلى مجتمع متنامٍ من الطهاة والمحترفين حول العالم"
                  : "Join a growing community of chefs and professionals worldwide"}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/community">
                {isAr ? "عرض المجتمع" : "View Community"}
                <ArrowRight className="ms-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {users.map((user: any) => {
            const name = isAr && user.full_name_ar ? user.full_name_ar : user.full_name;
            const spec = isAr && user.specialization_ar ? user.specialization_ar : user.specialization;
            const initials = name
              ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            const nationalityEmoji = user.show_nationality !== false && user.nationality ? countryFlag(user.nationality) : "";
            const countryObj = allCountries.find((c) => c.code === user.country_code);
            const countryName = countryObj ? (isAr ? countryObj.name_ar || countryObj.name : countryObj.name) : user.country_code;
            const locationParts = [user.city, countryName].filter(Boolean).join(", ");

            return (
              <Link key={user.id} to={user.username ? `/${user.username}` : `/profile/${user.user_id}`} className="group block">
                <Card className="h-full border-border/50 p-3 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
                  <div className="relative mx-auto mb-3 w-fit">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-2 ring-background shadow-md transition-transform duration-300 group-hover:scale-105">
                      <AvatarImage src={user.avatar_url} alt={name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {nationalityEmoji && (
                      <span className="absolute -bottom-1 -end-1 text-base leading-none drop-shadow">{nationalityEmoji}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {name || (isAr ? "عضو جديد" : "New Member")}
                  </h3>
                  {spec && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <ChefHat className="h-3 w-3 shrink-0" />
                      <span className="truncate">{spec}</span>
                    </div>
                  )}
                  {user.country_code && (
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/70">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{countryFlag(user.country_code)} {locationParts}</span>
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
