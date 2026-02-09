import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, Globe, ExternalLink, Bell, BellOff,
  Clock, Users, Tag, Building, Phone, Mail, ArrowLeft,
  Share2, Ticket, Trophy
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { format, isPast, isFuture, isWithinInterval, formatDistanceToNow } from "date-fns";

interface ScheduleDay {
  day?: string;
  items?: ScheduleItem[];
  // Flat format fallback
  time?: string;
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
}

interface ScheduleItem {
  time?: string;
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
}

interface Speaker {
  name?: string;
  name_ar?: string;
  title?: string;
  title_ar?: string;
  role?: string;
  role_ar?: string;
  topic?: string;
  topic_ar?: string;
  image_url?: string;
}

interface Section {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
}

export default function ExhibitionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const { data: exhibition, isLoading } = useQuery({
    queryKey: ["exhibition", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["exhibition-follow", exhibition?.id, user?.id],
    queryFn: async () => {
      if (!user || !exhibition) return false;
      const { data } = await supabase
        .from("exhibition_followers")
        .select("id")
        .eq("exhibition_id", exhibition.id)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!exhibition,
  });

  const { data: followerCount } = useQuery({
    queryKey: ["exhibition-followers-count", exhibition?.id],
    queryFn: async () => {
      if (!exhibition) return 0;
      const { count } = await supabase
        .from("exhibition_followers")
        .select("id", { count: "exact", head: true })
        .eq("exhibition_id", exhibition.id);
      return count || 0;
    },
    enabled: !!exhibition,
  });

  // Fetch linked competitions
  const { data: linkedCompetitions } = useQuery({
    queryKey: ["exhibition-competitions", exhibition?.id],
    queryFn: async () => {
      if (!exhibition) return [];
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, status, competition_start, competition_end, cover_image_url, city, country, is_virtual")
        .eq("exhibition_id", exhibition.id)
        .order("competition_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!exhibition,
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!user || !exhibition) throw new Error("Not authenticated");
      if (isFollowing) {
        await supabase
          .from("exhibition_followers")
          .delete()
          .eq("exhibition_id", exhibition.id)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("exhibition_followers")
          .insert({ exhibition_id: exhibition.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exhibition-follow"] });
      queryClient.invalidateQueries({ queryKey: ["exhibition-followers-count"] });
      toast({
        title: isFollowing
          ? (isAr ? "تم إلغاء المتابعة" : "Unfollowed")
          : (isAr ? "تم المتابعة" : "Following"),
        description: isFollowing
          ? (isAr ? "لن تتلقى إشعارات بعد الآن" : "You won't receive updates anymore")
          : (isAr ? "ستتلقى إشعارات حول هذا الحدث" : "You'll receive updates about this event"),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-8 h-72 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-16 text-center">
          <p className="text-xl text-muted-foreground">{isAr ? "الحدث غير موجود" : "Event not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/exhibitions">{isAr ? "العودة للفعاليات" : "Back to Events"}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const title = isAr && exhibition.title_ar ? exhibition.title_ar : exhibition.title;
  const description = isAr && exhibition.description_ar ? exhibition.description_ar : exhibition.description;
  const venue = isAr && exhibition.venue_ar ? exhibition.venue_ar : exhibition.venue;
  const organizer = isAr && exhibition.organizer_name_ar ? exhibition.organizer_name_ar : exhibition.organizer_name;

  const now = new Date();
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);
  const isHappening = isWithinInterval(now, { start, end });
  const isUpcoming = isFuture(start);
  const hasEnded = isPast(end);

  const schedule = (exhibition.schedule as ScheduleDay[]) || [];
  const speakers = (exhibition.speakers as Speaker[]) || [];
  const sections = (exhibition.sections as Section[]) || [];
  const targetAudience = (exhibition.target_audience as string[]) || [];
  const tags = (exhibition.tags as string[]) || [];
  const socialLinks = (exhibition.social_links as Record<string, string>) || {};

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={title}
        description={description || `${title} - Event on Altohaa`}
        ogImage={exhibition.cover_image_url || undefined}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: title,
          description: description || undefined,
          startDate: exhibition.start_date,
          endDate: exhibition.end_date,
          location: exhibition.is_virtual
            ? { "@type": "VirtualLocation" }
            : { "@type": "Place", name: venue || undefined, address: { "@type": "PostalAddress", addressLocality: exhibition.city, addressCountry: exhibition.country } },
          image: exhibition.cover_image_url || undefined,
          organizer: organizer ? { "@type": "Organization", name: organizer } : undefined,
        }}
      />
      <Header />

      <main className="container flex-1 py-8">
        {/* Breadcrumb */}
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/exhibitions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isAr ? "العودة للفعاليات" : "Back to Events"}
          </Link>
        </Button>

        {/* Hero Image */}
        <div className="mb-8 overflow-hidden rounded-xl">
          {exhibition.cover_image_url ? (
            <img
              src={exhibition.cover_image_url}
              alt={title}
              className="h-56 w-full object-cover md:h-72 lg:h-80"
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 md:h-72 lg:h-80">
              <span className="text-6xl">🏛️</span>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Title & Status */}
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {isHappening && <Badge className="bg-chart-3/20 text-chart-3">{isAr ? "🔴 يحدث الآن" : "🔴 Happening Now"}</Badge>}
                {isUpcoming && <Badge className="bg-primary/20 text-primary">{isAr ? "قادم" : "Upcoming"}</Badge>}
                {hasEnded && <Badge className="bg-muted text-muted-foreground">{isAr ? "انتهى" : "Ended"}</Badge>}
              </div>
              <h1 className="font-serif text-3xl font-bold md:text-4xl">{title}</h1>
              {organizer && (
                <p className="mt-2 text-muted-foreground">
                  {isAr ? "المنظم:" : "Organized by:"} <span className="font-medium text-foreground">{organizer}</span>
                </p>
              )}
            </div>

            {/* Description */}
            {description && (
              <div className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert">
                <p className="whitespace-pre-line">{description}</p>
              </div>
            )}

            {/* Countdown / Status */}
            {isUpcoming && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="font-medium">
                    {isAr ? "يبدأ " : "Starts "}
                    {formatDistanceToNow(start, { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sections */}
            {sections.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold">{isAr ? "الأقسام" : "Sections"}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {sections.map((section, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {isAr && section.name_ar ? section.name_ar : section.name}
                        </CardTitle>
                      </CardHeader>
                      {(section.description || section.description_ar) && (
                        <CardContent className="pt-0 text-sm text-muted-foreground">
                          {isAr && section.description_ar ? section.description_ar : section.description}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Schedule */}
            {schedule.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold">{isAr ? "الجدول الزمني" : "Schedule"}</h2>
                <div className="space-y-6">
                  {schedule.map((dayOrItem, i) => {
                    // Grouped by day format: { day: "Day 1", items: [...] }
                    if (dayOrItem.items && dayOrItem.items.length > 0) {
                      return (
                        <div key={i}>
                          {dayOrItem.day && (
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                              {dayOrItem.day}
                            </h3>
                          )}
                          <div className="space-y-3">
                            {dayOrItem.items.map((item, j) => (
                              <div key={j} className="flex gap-4 rounded-lg border p-4">
                                {item.time && (
                                  <div className="shrink-0 font-mono text-sm font-medium text-primary">{item.time}</div>
                                )}
                                <div>
                                  <p className="font-medium">{isAr && item.title_ar ? item.title_ar : item.title}</p>
                                  {(item.description || item.description_ar) && (
                                    <p className="text-sm text-muted-foreground">
                                      {isAr && item.description_ar ? item.description_ar : item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    // Flat format fallback
                    return (
                      <div key={i} className="flex gap-4 rounded-lg border p-4">
                        <div className="shrink-0 font-mono text-sm text-primary">{dayOrItem.time || dayOrItem.day}</div>
                        <div>
                          <p className="font-medium">{isAr && dayOrItem.title_ar ? dayOrItem.title_ar : dayOrItem.title}</p>
                          {(dayOrItem.description || dayOrItem.description_ar) && (
                            <p className="text-sm text-muted-foreground">
                              {isAr && dayOrItem.description_ar ? dayOrItem.description_ar : dayOrItem.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Linked Competitions */}
            {linkedCompetitions && linkedCompetitions.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Trophy className="h-5 w-5 text-primary" />
                  {isAr ? "المسابقات المرتبطة" : "Competitions"}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {linkedCompetitions.map((comp) => {
                    const compTitle = isAr && comp.title_ar ? comp.title_ar : comp.title;
                    const compStart = new Date(comp.competition_start);
                    const compEnd = new Date(comp.competition_end);
                    const compNow = new Date();
                    const compIsLive = isWithinInterval(compNow, { start: compStart, end: compEnd });
                    const compIsPast = isPast(compEnd);

                    return (
                      <Link key={comp.id} to={`/competitions/${comp.id}`} className="block">
                        <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
                          {comp.cover_image_url && (
                            <img src={comp.cover_image_url} alt={compTitle} className="h-32 w-full object-cover" />
                          )}
                          <CardContent className="p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <Badge variant={compIsLive ? "default" : compIsPast ? "secondary" : "outline"} className="text-xs">
                                {compIsLive ? (isAr ? "جارية" : "Live") : compIsPast ? (isAr ? "انتهت" : "Ended") : (isAr ? "قادمة" : "Upcoming")}
                              </Badge>
                            </div>
                            <h4 className="font-semibold line-clamp-2">{compTitle}</h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                              <Calendar className="mr-1 inline h-3 w-3" />
                              {format(compStart, "MMM d, yyyy")}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {speakers.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold">{isAr ? "المتحدثون" : "Speakers"}</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {speakers.map((speaker, i) => (
                    <Card key={i} className="text-center">
                      <CardContent className="pt-6">
                        {speaker.image_url ? (
                          <img src={speaker.image_url} alt={speaker.name} className="mx-auto mb-3 h-20 w-20 rounded-full object-cover" />
                        ) : (
                          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl">👤</div>
                        )}
                        <p className="font-semibold">{isAr && speaker.name_ar ? speaker.name_ar : speaker.name}</p>
                        {(speaker.title || speaker.title_ar || speaker.role || speaker.role_ar) && (
                          <p className="text-sm text-muted-foreground">
                            {isAr && (speaker.title_ar || speaker.role_ar) ? (speaker.title_ar || speaker.role_ar) : (speaker.title || speaker.role)}
                          </p>
                        )}
                        {(speaker.topic || speaker.topic_ar) && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {isAr && speaker.topic_ar ? speaker.topic_ar : speaker.topic}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Target Audience */}
            {targetAudience.length > 0 && (
              <section>
                <h2 className="mb-3 text-xl font-semibold">{isAr ? "الفئة المستهدفة" : "Target Audience"}</h2>
                <div className="flex flex-wrap gap-2">
                  {targetAudience.map((audience) => (
                    <Badge key={audience} variant="outline" className="py-1.5">{audience}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {exhibition.gallery_urls && exhibition.gallery_urls.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold">{isAr ? "معرض الصور" : "Gallery"}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {exhibition.gallery_urls.map((url, i) => (
                    <img key={i} src={url} alt={`${title} ${i + 1}`} className="rounded-lg object-cover aspect-video" />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                {/* Registration / Tickets */}
                {exhibition.registration_url && !hasEnded && (
                  <Button className="w-full" asChild>
                    <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
                      <Ticket className="mr-2 h-4 w-4" />
                      {isAr ? "سجل الآن" : "Register Now"}
                    </a>
                  </Button>
                )}

                {/* Follow for updates */}
                {user && (
                  <Button
                    variant={isFollowing ? "outline" : "secondary"}
                    className="w-full"
                    onClick={() => toggleFollow.mutate()}
                    disabled={toggleFollow.isPending}
                  >
                    {isFollowing ? (
                      <><BellOff className="mr-2 h-4 w-4" />{isAr ? "إلغاء المتابعة" : "Unfollow"}</>
                    ) : (
                      <><Bell className="mr-2 h-4 w-4" />{isAr ? "تابع للإشعارات" : "Follow for Updates"}</>
                    )}
                  </Button>
                )}

                {/* Website */}
                {exhibition.website_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={exhibition.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {isAr ? "الموقع الرسمي" : "Official Website"}
                    </a>
                  </Button>
                )}

                <p className="text-center text-xs text-muted-foreground">
                  <Users className="mb-0.5 mr-1 inline h-3 w-3" />
                  {followerCount} {isAr ? "متابع" : "followers"}
                </p>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isAr ? "تفاصيل الحدث" : "Event Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{isAr ? "التاريخ" : "Date"}</p>
                    <p className="text-muted-foreground">
                      {format(start, "EEEE, MMM d, yyyy")}
                      {" – "}
                      {format(end, "EEEE, MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {exhibition.registration_deadline && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{isAr ? "آخر موعد للتسجيل" : "Registration Deadline"}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(exhibition.registration_deadline), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}

                {exhibition.is_virtual ? (
                  <div className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{isAr ? "حدث افتراضي" : "Virtual Event"}</p>
                      {exhibition.virtual_link && !hasEnded && (
                        <a href={exhibition.virtual_link} target="_blank" rel="noopener noreferrer"
                          className="text-primary underline">{isAr ? "رابط الدخول" : "Join Link"}</a>
                      )}
                    </div>
                  </div>
                ) : venue && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{isAr ? "الموقع" : "Location"}</p>
                      <p className="text-muted-foreground">
                        {venue}
                        {exhibition.city && <><br />{exhibition.city}</>}
                        {exhibition.country && `, ${exhibition.country}`}
                      </p>
                      {exhibition.map_url && (
                        <a href={exhibition.map_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline">{isAr ? "عرض الخريطة" : "View Map"}</a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{isAr ? "التذاكر" : "Tickets"}</p>
                    <p className="text-muted-foreground">
                      {exhibition.is_free
                        ? (isAr ? "دخول مجاني" : "Free Entry")
                        : (isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price || (isAr ? "راجع الموقع" : "See website"))}
                    </p>
                  </div>
                </div>

                {exhibition.max_attendees && (
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="font-medium">{isAr ? "السعة" : "Capacity"}</p>
                      <p className="text-muted-foreground">{exhibition.max_attendees.toLocaleString()} {isAr ? "مقعد" : "attendees"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info */}
            {organizer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{isAr ? "المنظم" : "Organizer"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{organizer}</span>
                  </div>
                  {exhibition.organizer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${exhibition.organizer_email}`} className="text-primary underline">
                        {exhibition.organizer_email}
                      </a>
                    </div>
                  )}
                  {exhibition.organizer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{exhibition.organizer_phone}</span>
                    </div>
                  )}
                  {exhibition.organizer_website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={exhibition.organizer_website} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {isAr ? "الموقع" : "Website"}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="mr-1 h-3 w-3" />{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Share */}
            <Card>
              <CardContent className="pt-6">
                <p className="mb-3 text-sm font-medium">{isAr ? "شارك هذا الحدث" : "Share this event"}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
                  }}>
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    {isAr ? "نسخ الرابط" : "Copy Link"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
