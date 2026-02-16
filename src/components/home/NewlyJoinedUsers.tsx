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

export function NewlyJoinedUsers() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: users = [] } = useQuery({
    queryKey: ["newly-joined-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, full_name_ar, avatar_url, country_code, city, specialization, specialization_ar, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });

  if (users.length === 0) return null;

  return (
    <section className="py-12 md:py-16" aria-labelledby="new-users-heading">
      <div className="container">
        <SectionReveal>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-2 gap-1">
                <UserPlus className="h-3 w-3" />
                {isAr ? "انضموا حديثاً" : "Newly Joined"}
              </Badge>
              <h2 id="new-users-heading" className="font-serif text-2xl font-bold sm:text-3xl">
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {users.map((user: any) => {
            const name = isAr && user.full_name_ar ? user.full_name_ar : user.full_name;
            const spec = isAr && user.specialization_ar ? user.specialization_ar : user.specialization;
            const initials = name
              ? name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
              : "?";

            return (
              <Link key={user.id} to={`/profile/${user.id}`} className="group block">
                <Card className="h-full border-border/50 p-4 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20">
                  <Avatar className="mx-auto mb-3 h-16 w-16 ring-2 ring-background shadow-md transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={user.avatar_url} alt={name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
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
                      <span className="truncate">{user.city ? `${user.city}, ` : ""}{user.country_code}</span>
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
