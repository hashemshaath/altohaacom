import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import OrganizerAnalyticsTab from "./OrganizerAnalyticsTab";
import {
  Building2, Landmark, Eye, Star, MapPin, Globe, Mail, Phone,
  Calendar, CheckCircle2, ExternalLink, Ticket, TrendingUp,
  ArrowUpRight, Clock, Shield, UserCircle2, BarChart3,
} from "lucide-react";

interface Props {
  organizerId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function OrganizerDetailDrawer({ organizerId, open, onClose }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: org } = useQuery({
    queryKey: ["admin-organizer-detail", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("id, name, name_ar, slug, description, description_ar, logo_url, cover_image_url, email, phone, website, city, city_ar, country, country_ar, country_code, address, address_ar, status, is_verified, is_featured, organizer_number, founded_year, categories, services, services_ar, targeted_sectors, social_links, key_contacts, total_exhibitions, total_views, average_rating, company_id, entity_id, gallery_urls, metadata, created_by, created_at, updated_at")
        .eq("id", organizerId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizerId && open,
  });

  // Linked exhibitions
  const { data: exhibitions = [] } = useQuery({
    queryKey: ["admin-organizer-exhibitions", organizerId],
    queryFn: async () => {
      const { data: linked } = await supabase
        .from("exhibition_organizers")
        .select("exhibition_id, role")
        .eq("organizer_id", organizerId!);

      if (!linked?.length) {
        // Fallback: exhibitions by organizer_id or organizer_name
        const { data } = await supabase
          .from("exhibitions")
          .select("id, title, title_ar, slug, start_date, end_date, city, country, status, cover_image_url, view_count")
          .or(`organizer_id.eq.${organizerId},organizer_name.eq.${org?.name || ""}`)
          .order("start_date", { ascending: false })
          .limit(20);
        return (data || []).map((e: any) => ({ ...e, role: "organizer" }));
      }

      const exIds = linked.map(l => l.exhibition_id);
      const roleMap = Object.fromEntries(linked.map(l => [l.exhibition_id, l.role]));

      const { data: exh } = await supabase
        .from("exhibitions")
        .select("id, title, title_ar, slug, start_date, end_date, city, country, status, cover_image_url, view_count")
        .in("id", exIds)
        .order("start_date", { ascending: false });

      return (exh || []).map((e: any) => ({ ...e, role: roleMap[e.id] || "organizer" }));
    },
    enabled: !!organizerId && open,
  });

  // Ticket & review counts
  const { data: aggStats } = useQuery({
    queryKey: ["admin-organizer-agg", organizerId],
    queryFn: async () => {
      const exIds = exhibitions.map((e: any) => e.id).filter(Boolean);
      if (!exIds.length) return { tickets: 0, reviews: 0 };

      const [{ count: tickets }, { count: reviews }] = await Promise.all([
        supabase.from("exhibition_tickets").select("id", { count: "exact", head: true }).in("exhibition_id", exIds),
        supabase.from("exhibition_reviews").select("id", { count: "exact", head: true }).in("exhibition_id", exIds),
      ]);
      return { tickets: tickets || 0, reviews: reviews || 0 };
    },
    enabled: exhibitions.length > 0,
  });

  if (!org) return null;

  const name = isAr && org.name_ar ? org.name_ar : org.name;
  const kpis = [
    { icon: Landmark, label: isAr ? "المعارض" : "Events", value: org.total_exhibitions || exhibitions.length },
    { icon: Eye, label: isAr ? "المشاهدات" : "Views", value: (org.total_views || 0).toLocaleString() },
    { icon: Star, label: isAr ? "التقييم" : "Rating", value: org.average_rating ? org.average_rating.toFixed(1) : "—" },
    { icon: Ticket, label: isAr ? "التذاكر" : "Tickets", value: (aggStats?.tickets || 0).toLocaleString() },
  ];

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <div className="relative">
          {org.cover_image_url ? (
            <div className="h-32 overflow-hidden">
              <img src={org.cover_image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
          ) : (
            <div className="h-20 bg-gradient-to-br from-primary/10 to-transparent" />
          )}
          <div className="px-5 -mt-10 relative z-10">
            <div className="flex items-end gap-3">
              <Avatar className="h-16 w-16 rounded-2xl border-3 border-background shadow-lg">
                {org.logo_url && <AvatarImage src={org.logo_url} />}
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">{org.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-1.5">
                  <SheetHeader className="p-0">
                    <SheetTitle className="text-base truncate">{name}</SheetTitle>
                  </SheetHeader>
                  {org.is_verified && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                  {org.is_featured && <Star className="h-4 w-4 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {org.organizer_number && <Badge variant="outline" className="text-[9px] font-mono h-4">{org.organizer_number}</Badge>}
                  <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[9px] capitalize h-4">{org.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2 px-5 pt-4 pb-2">
          {kpis.map(k => (
            <div key={k.label} className="text-center p-2 rounded-xl bg-muted/50">
              <k.icon className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-sm font-bold">{k.value}</p>
              <p className="text-[9px] text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Tabs */}
        <div className="px-5 pb-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start mb-3">
              <TabsTrigger value="info" className="text-xs gap-1">
                <Building2 className="h-3 w-3" />{isAr ? "المعلومات" : "Info"}
              </TabsTrigger>
              <TabsTrigger value="exhibitions" className="text-xs gap-1">
                <Landmark className="h-3 w-3" />{isAr ? "المعارض" : "Events"}
                <Badge variant="secondary" className="text-[8px] h-3.5 px-1 ms-0.5">{exhibitions.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs gap-1">
                <BarChart3 className="h-3 w-3" />{isAr ? "التحليلات" : "Analytics"}
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1">
                <Clock className="h-3 w-3" />{isAr ? "النشاط" : "Activity"}
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-0">
              {/* Contact */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "التواصل" : "Contact"}</p>
                {org.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <a href={`mailto:${org.email}`} className="text-primary hover:underline truncate">{org.email}</a>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span dir="ltr">{org.phone}</span>
                  </div>
                )}
                {org.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <a href={org.website.startsWith("http") ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
                      {org.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "الموقع" : "Location"}</p>
                {(org.city || org.country) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{[org.city, org.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {org.address && <p className="text-xs text-muted-foreground ps-5">{org.address}</p>}
                {org.country_code && <Badge variant="outline" className="text-[9px] ms-5">{org.country_code}</Badge>}
              </div>

              <Separator />

              {/* Details */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "التفاصيل" : "Details"}</p>
                {org.founded_year && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{isAr ? "تأسس" : "Founded"} {org.founded_year}</span>
                  </div>
                )}
                {org.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{isAr && org.description_ar ? org.description_ar : org.description}</p>
                )}
                {org.services && org.services.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {org.services.map((s: string) => <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>)}
                  </div>
                )}
                {org.categories && org.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {org.categories.map((c: string) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}
                  </div>
                )}
              </div>

              <Separator />

              {/* Key Contacts */}
              {org.key_contacts && Array.isArray(org.key_contacts) && org.key_contacts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "جهات الاتصال" : "Key Contacts"}</p>
                  {(org.key_contacts as any[]).map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{c.name}</span>
                      {c.title && <span className="text-muted-foreground text-xs">• {c.title}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* View public page */}
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link to={`/organizers/${org.slug}`}>
                  <ExternalLink className="h-3.5 w-3.5 me-1.5" />
                  {isAr ? "عرض الصفحة العامة" : "View Public Page"}
                </Link>
              </Button>
            </TabsContent>

            {/* Exhibitions Tab */}
            <TabsContent value="exhibitions" className="space-y-3 mt-0">
              {exhibitions.length === 0 ? (
                <div className="text-center py-8">
                  <Landmark className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا توجد معارض مرتبطة" : "No linked exhibitions"}</p>
                </div>
              ) : (
                exhibitions.map((ex: any) => (
                  <Link key={ex.id} to={`/exhibitions/${ex.slug}`} className="group block">
                    <Card className="rounded-xl border-border/40 hover:border-primary/30 hover:shadow-sm transition-all">
                      <CardContent className="p-3 flex items-center gap-3">
                        {ex.cover_image_url ? (
                          <img src={ex.cover_image_url} alt="" className="h-12 w-18 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="h-12 w-18 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Landmark className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                            {isAr && ex.title_ar ? ex.title_ar : ex.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground">
                            {ex.start_date && format(new Date(ex.start_date), "dd MMM yyyy")}
                            {ex.city && ` • ${ex.city}`}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[8px] h-3.5 capitalize">{ex.role}</Badge>
                            <Badge variant={ex.status === "published" ? "default" : "secondary"} className="text-[8px] h-3.5 capitalize">{ex.status}</Badge>
                            {(ex.view_count || 0) > 0 && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <Eye className="h-2.5 w-2.5" />{ex.view_count}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </TabsContent>


            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <OrganizerAnalyticsTab organizerId={org.id} exhibitions={exhibitions} />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-3 mt-0">
              <div className="space-y-3">
                {[
                  { label: isAr ? "تاريخ الإنشاء" : "Created", value: org.created_at ? format(new Date(org.created_at), "dd MMM yyyy HH:mm") : "—" },
                  { label: isAr ? "آخر تحديث" : "Last Updated", value: org.updated_at ? format(new Date(org.updated_at), "dd MMM yyyy HH:mm") : "—" },
                  { label: isAr ? "رقم المنظم" : "Organizer Number", value: org.organizer_number || "—" },
                  { label: isAr ? "المعرف" : "Slug", value: org.slug || "—" },
                  { label: isAr ? "المعرف الفريد" : "ID", value: org.id?.slice(0, 8) + "..." },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground text-xs">{item.label}</span>
                    <span className="text-xs font-mono">{item.value}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Flags */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "العلامات" : "Flags"}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={org.is_verified ? "default" : "outline"} className="text-[10px] gap-1">
                    <Shield className="h-3 w-3" />{isAr ? (org.is_verified ? "موثق" : "غير موثق") : (org.is_verified ? "Verified" : "Not Verified")}
                  </Badge>
                  <Badge variant={org.is_featured ? "default" : "outline"} className="text-[10px] gap-1">
                    <Star className="h-3 w-3" />{isAr ? (org.is_featured ? "مميز" : "غير مميز") : (org.is_featured ? "Featured" : "Not Featured")}
                  </Badge>
                  <Badge variant={org.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">{org.status}</Badge>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
