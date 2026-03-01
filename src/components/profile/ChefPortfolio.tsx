import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Award, ChefHat, MapPin, Calendar, Globe, Star, Trophy, BookOpen, Image, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId?: string;
}

export default function ChefPortfolio({ userId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const targetId = userId || user?.id;

  const { data: profile } = useQuery({
    queryKey: ["portfolio-profile", targetId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", targetId!).single();
      return data;
    },
    enabled: !!targetId,
  });

  const { data: career = [] } = useQuery({
    queryKey: ["portfolio-career", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chef_establishment_associations")
        .select("*, establishments(name, name_ar)")
        .eq("user_id", targetId!)
        .order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!targetId,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["portfolio-recipes", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .eq("author_id", targetId!)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!targetId,
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ["portfolio-competitions", targetId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_registrations")
        .select("*, competitions(title, title_ar, competition_start, country_code, cover_image_url)")
        .eq("participant_id", targetId!)
        .order("registered_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!targetId,
  });

  const { data: followers } = useQuery({
    queryKey: ["portfolio-followers", targetId],
    queryFn: async () => {
      const { count } = await supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", targetId!);
      return count || 0;
    },
    enabled: !!targetId,
  });

  if (!profile) return null;

  const stats = [
    { icon: Heart, label: isAr ? "متابع" : "Followers", value: followers || 0 },
    { icon: ChefHat, label: isAr ? "وصفة" : "Recipes", value: recipes.length },
    { icon: Trophy, label: isAr ? "مسابقة" : "Competitions", value: competitions.length },
    { icon: Briefcase, label: isAr ? "خبرة" : "Experience", value: career.length },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
            <Avatar className="h-20 w-20 border-4 border-background rounded-2xl shadow-lg">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                {(profile.full_name || "C")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-2">
              <h2 className="text-xl font-bold">{isAr && profile.full_name_ar ? profile.full_name_ar : profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile.specialization || (isAr ? "طاهٍ" : "Chef")}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {profile.country_code && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.country_code}</span>}
                {profile.specialization && <Badge variant="outline" className="text-[10px]">{profile.specialization}</Badge>}
                {profile.years_of_experience && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{profile.years_of_experience} {isAr ? "سنة" : "yrs"}</span>}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {profile.bio && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{isAr && profile.bio_ar ? profile.bio_ar : profile.bio}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="career">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="career" className="gap-1"><Briefcase className="h-3.5 w-3.5" />{isAr ? "المسيرة" : "Career"}</TabsTrigger>
          <TabsTrigger value="dishes" className="gap-1"><ChefHat className="h-3.5 w-3.5" />{isAr ? "الأطباق" : "Dishes"}</TabsTrigger>
          <TabsTrigger value="awards" className="gap-1"><Trophy className="h-3.5 w-3.5" />{isAr ? "الجوائز" : "Awards"}</TabsTrigger>
        </TabsList>

        <TabsContent value="career" className="mt-4 space-y-3">
          {!career.length ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">{isAr ? "لا توجد سجلات مهنية" : "No career records"}</p></CardContent></Card>
          ) : career.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{isAr && c.title_ar ? c.title_ar : c.title}</p>
                  <p className="text-xs text-muted-foreground">{isAr && c.organization_ar ? c.organization_ar : c.organization}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {c.start_date} — {c.is_current ? (isAr ? "حالي" : "Present") : c.end_date || "—"}
                  </p>
                  {c.description && <p className="text-xs mt-2 text-muted-foreground line-clamp-2">{c.description}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="dishes" className="mt-4">
          {!recipes.length ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">{isAr ? "لا توجد وصفات" : "No recipes"}</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recipes.map((r: any) => (
                <Card key={r.id} className="overflow-hidden group cursor-pointer">
                  <div className="aspect-[4/3] bg-muted">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ChefHat className="h-8 w-8 text-muted-foreground/30" /></div>
                    )}
                  </div>
                  <CardContent className="p-2.5">
                    <p className="text-sm font-medium line-clamp-1">{isAr && r.title_ar ? r.title_ar : r.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {r.cuisine_type && <Badge variant="outline" className="text-[9px]">{r.cuisine_type}</Badge>}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Heart className="h-3 w-3" />{r.save_count || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="awards" className="mt-4 space-y-3">
          {!competitions.length ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">{isAr ? "لا توجد مسابقات" : "No competitions"}</p></CardContent></Card>
          ) : competitions.map((c: any) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{isAr && c.competitions?.title_ar ? c.competitions.title_ar : c.competitions?.title || "—"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={c.status === "approved" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                    {c.competitions?.country_code && <span className="text-[10px] text-muted-foreground">{c.competitions.country_code}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
