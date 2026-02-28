import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { deriveExhibitionStatus, EXHIBITION_STATUS_LEGEND } from "@/lib/exhibitionStatus";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Mail, Phone, Globe, MapPin, Calendar, Eye, Landmark,
  Ticket, Users, TrendingUp, ExternalLink, Newspaper, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

export default function OrganizerDetail() {
  const { name } = useParams<{ name: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const decodedName = decodeURIComponent(name || "");

  // Fetch all exhibitions by this organizer
  const { data, isLoading } = useQuery({
    queryKey: ["organizer-detail", decodedName],
    queryFn: async () => {
      const { data: exhibitions, error } = await supabase
        .from("exhibitions")
        .select("*")
        .eq("organizer_name", decodedName)
        .order("start_date", { ascending: false });
      if (error) throw error;

      // Fetch related articles/news
      const { data: articles } = await supabase
        .from("articles")
        .select("id, title, title_ar, slug, excerpt, excerpt_ar, featured_image_url, published_at, type, status")
        .eq("status", "published")
        .or(`content.ilike.%${decodedName}%,title.ilike.%${decodedName}%`)
        .order("published_at", { ascending: false })
        .limit(10);

      return { exhibitions: exhibitions || [], articles: articles || [] };
    },
    enabled: !!decodedName,
  });

  const exhibitions = data?.exhibitions || [];
  const articles = data?.articles || [];

  // Derive organizer info from first exhibition
  const org = exhibitions[0] || null;
  const orgName = isAr && org?.organizer_name_ar ? org.organizer_name_ar : org?.organizer_name || decodedName;
  const orgLogo = org?.organizer_logo_url || (org as any)?.logo_url;

  // Stats
  const totalExhibitions = exhibitions.length;
  const totalViews = exhibitions.reduce((s, e) => s + (e.view_count || 0), 0);
  const countries = [...new Set(exhibitions.map(e => e.country).filter(Boolean))];
  const cities = [...new Set(exhibitions.map(e => e.city).filter(Boolean))];
  const types = [...new Set(exhibitions.map(e => e.type))];

  // Group exhibitions by year
  const byYear: Record<string, typeof exhibitions> = {};
  exhibitions.forEach(e => {
    const year = new Date(e.start_date).getFullYear().toString();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(e);
  });
  const sortedYears = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-5xl py-8 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-5xl py-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{isAr ? "لم يتم العثور على المنظم" : "Organizer not found"}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title={`${orgName} — ${isAr ? "المنظم" : "Organizer"}`} description={`${isAr ? "صفحة المنظم" : "Organizer profile"}: ${orgName}`} />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <div className="border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-5xl py-8">
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20 rounded-xl border-2 border-border shadow-md">
                {orgLogo ? <AvatarImage src={orgLogo} alt={orgName} /> : null}
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl font-bold">
                  {orgName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">{orgName}</h1>
                {org.organizer_name_ar && !isAr && (
                  <p className="text-sm text-muted-foreground mt-0.5" dir="rtl">{org.organizer_name_ar}</p>
                )}
                {org.organizer_name && isAr && (
                  <p className="text-sm text-muted-foreground mt-0.5">{org.organizer_name}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {countries.map(c => (
                    <Badge key={c} variant="secondary" className="text-[10px]">
                      <MapPin className="h-2.5 w-2.5 me-1" />{c}
                    </Badge>
                  ))}
                  {types.map(t => (
                    <Badge key={t} variant="outline" className="text-[10px] capitalize">{t.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { icon: Landmark, label: isAr ? "المعارض" : "Exhibitions", value: totalExhibitions },
                { icon: Eye, label: isAr ? "المشاهدات" : "Total Views", value: totalViews.toLocaleString() },
                { icon: MapPin, label: isAr ? "المدن" : "Cities", value: cities.length },
                { icon: Calendar, label: isAr ? "السنوات" : "Years Active", value: sortedYears.length },
              ].map(s => (
                <Card key={s.label} className="border-border/40">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <s.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="container max-w-5xl py-6 space-y-6">
          <Tabs defaultValue="exhibitions" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="exhibitions" className="gap-1.5">
                <Landmark className="h-3.5 w-3.5" />
                {isAr ? "المعارض والفعاليات" : "Exhibitions & Events"}
                <Badge variant="secondary" className="ms-1 text-[9px] h-4 px-1.5">{totalExhibitions}</Badge>
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {isAr ? "معلومات المنظم" : "Organizer Info"}
              </TabsTrigger>
              {articles.length > 0 && (
                <TabsTrigger value="news" className="gap-1.5">
                  <Newspaper className="h-3.5 w-3.5" />
                  {isAr ? "الأخبار" : "News"}
                  <Badge variant="secondary" className="ms-1 text-[9px] h-4 px-1.5">{articles.length}</Badge>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Exhibitions Tab */}
            <TabsContent value="exhibitions" className="space-y-6 mt-4">
              {sortedYears.map(year => (
                <div key={year}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-bold">{year}</h3>
                    <Badge variant="outline" className="text-[10px]">{byYear[year].length} {isAr ? "فعالية" : "events"}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {byYear[year].map(ex => {
                      const derived = deriveExhibitionStatus({
                        dbStatus: ex.status,
                        startDate: ex.start_date,
                        endDate: ex.end_date,
                        registrationDeadline: ex.registration_deadline,
                      });
                      return (
                        <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group">
                          <Card className="overflow-hidden hover:shadow-md transition-all border-border/40 hover:border-primary/30">
                            {ex.cover_image_url && (
                              <div className="relative h-36 overflow-hidden">
                                <img
                                  src={ex.cover_image_url}
                                  alt={isAr && ex.title_ar ? ex.title_ar : ex.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 end-2">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm ${derived.color}`}>
                                    {derived.status === "started" ? (
                                      <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                                      </span>
                                    ) : (
                                      <span className={`h-2 w-2 rounded-full ${derived.dot}`} />
                                    )}
                                    {isAr ? derived.labelAr : derived.label}
                                  </span>
                                </div>
                              </div>
                            )}
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                    {isAr && ex.title_ar ? ex.title_ar : ex.title}
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {format(new Date(ex.start_date), "dd MMM yyyy")}
                                    {ex.end_date && ` → ${format(new Date(ex.end_date), "dd MMM yyyy")}`}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                              </div>

                              <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                                {ex.city && (
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="h-2.5 w-2.5" />{ex.city}{ex.country ? `, ${ex.country}` : ""}
                                  </span>
                                )}
                                {(ex.view_count || 0) > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Eye className="h-2.5 w-2.5" />{ex.view_count}
                                  </span>
                                )}
                                {ex.max_attendees && (
                                  <span className="flex items-center gap-0.5">
                                    <Users className="h-2.5 w-2.5" />{ex.max_attendees}
                                  </span>
                                )}
                              </div>

                              {!ex.cover_image_url && (
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${derived.color}`}>
                                  <span className={`h-2 w-2 rounded-full ${derived.dot}`} />
                                  {isAr ? derived.labelAr : derived.label}
                                </span>
                              )}

                              <div className="flex flex-wrap gap-1">
                                <Badge variant="secondary" className="text-[9px] capitalize">{ex.type.replace(/_/g, " ")}</Badge>
                                {ex.is_free && <Badge variant="outline" className="text-[9px]">{isAr ? "مجاني" : "Free"}</Badge>}
                                {ex.is_virtual && <Badge variant="outline" className="text-[9px]">{isAr ? "افتراضي" : "Virtual"}</Badge>}
                                {(ex as any).edition_year && <Badge variant="outline" className="text-[9px]">{(ex as any).edition_year}</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Organizer Info Tab */}
            <TabsContent value="info" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Contact Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {isAr ? "معلومات التواصل" : "Contact Information"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {org.organizer_email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`mailto:${org.organizer_email}`} className="text-primary hover:underline truncate">
                          {org.organizer_email}
                        </a>
                      </div>
                    )}
                    {org.organizer_phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`tel:${org.organizer_phone}`} className="text-primary hover:underline">
                          {org.organizer_phone}
                        </a>
                      </div>
                    )}
                    {org.organizer_website && (
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a
                          href={org.organizer_website.startsWith("http") ? org.organizer_website : `https://${org.organizer_website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate flex items-center gap-1"
                        >
                          {org.organizer_website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {!org.organizer_email && !org.organizer_phone && !org.organizer_website && (
                      <p className="text-sm text-muted-foreground">{isAr ? "لا توجد معلومات تواصل" : "No contact information available"}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Locations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {isAr ? "الدول والمدن" : "Countries & Cities"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {countries.length > 0 ? (
                      <>
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "الدول" : "Countries"}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {countries.map(c => (
                              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{isAr ? "المدن" : "Cities"}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cities.map(c => (
                              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{isAr ? "لا توجد مواقع" : "No locations available"}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Event Types & Services */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {isAr ? "أنواع الفعاليات" : "Event Types & Services"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {types.map(t => {
                      const count = exhibitions.filter(e => e.type === t).length;
                      return (
                        <div key={t} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{t.replace(/_/g, " ")}</span>
                          <Badge variant="outline" className="text-[10px]">{count}</Badge>
                        </div>
                      );
                    })}
                    <Separator className="my-2" />
                    <div className="space-y-1.5">
                      {exhibitions.some(e => (e as any).includes_competitions) && (
                        <Badge variant="secondary" className="text-[10px] me-1">{isAr ? "مسابقات" : "Competitions"}</Badge>
                      )}
                      {exhibitions.some(e => (e as any).includes_training) && (
                        <Badge variant="secondary" className="text-[10px] me-1">{isAr ? "تدريب" : "Training"}</Badge>
                      )}
                      {exhibitions.some(e => (e as any).includes_seminars) && (
                        <Badge variant="secondary" className="text-[10px] me-1">{isAr ? "ندوات" : "Seminars"}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Venues */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-primary" />
                      {isAr ? "الأماكن" : "Venues"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[...new Set(exhibitions.map(e => isAr && e.venue_ar ? e.venue_ar : e.venue).filter(Boolean))].map(v => (
                        <div key={v} className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{v}</span>
                        </div>
                      ))}
                      {exhibitions.every(e => !e.venue) && (
                        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد أماكن" : "No venues listed"}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* News Tab */}
            {articles.length > 0 && (
              <TabsContent value="news" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {articles.map(article => (
                    <Link key={article.id} to={`/news/${article.slug}`} className="group">
                      <Card className="overflow-hidden hover:shadow-md transition-all border-border/40 hover:border-primary/30">
                        {article.featured_image_url && (
                          <img src={article.featured_image_url} alt="" className="w-full h-32 object-cover" />
                        )}
                        <CardContent className="p-3">
                          <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                            {isAr && article.title_ar ? article.title_ar : article.title}
                          </h4>
                          {(article.excerpt || article.excerpt_ar) && (
                            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                              {isAr && article.excerpt_ar ? article.excerpt_ar : article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[9px] capitalize">{article.type}</Badge>
                            {article.published_at && (
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(article.published_at), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
