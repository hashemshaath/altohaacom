import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, Award, MapPin, Globe, Mail, Phone, Calendar, Star, TrendingUp, Eye } from "lucide-react";

interface Props {
  entityId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function EstablishmentDetailDrawer({ entityId, open, onClose }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: entity } = useQuery({
    queryKey: ["entity-detail", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culinary_entities")
        .select("*")
        .eq("id", entityId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!entityId && open,
  });

  const { data: followers } = useQuery({
    queryKey: ["entity-followers-count", entityId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("entity_followers")
        .select("*", { count: "exact", head: true })
        .eq("entity_id", entityId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!entityId && open,
  });

  const { data: associations } = useQuery({
    queryKey: ["entity-chef-associations", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_establishment_associations")
        .select("*, profiles:user_id(full_name, full_name_ar, avatar_url, username)")
        .eq("establishment_id", entityId!)
        .order("start_date", { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!entityId && open,
  });

  if (!entity) return null;

  const completeness = calculateCompleteness(entity);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" side={isAr ? "left" : "right"}>
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={entity.logo_url || ""} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-lg">
                {(entity.name || "E")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-start truncate">{isAr && entity.name_ar ? entity.name_ar : entity.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={entity.status === "active" ? "default" : "secondary"} className="text-xs">
                  {entity.status}
                </Badge>
                {entity.is_verified && <Badge variant="outline" className="text-xs gap-1"><Star className="h-3 w-3" /> {isAr ? "موثق" : "Verified"}</Badge>}
                <span className="text-xs text-muted-foreground">{entity.entity_number}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <MiniKPI icon={Users} label={isAr ? "متابعون" : "Followers"} value={followers || 0} />
          <MiniKPI icon={Award} label={isAr ? "طهاة" : "Chefs"} value={associations?.length || 0} />
          <MiniKPI icon={TrendingUp} label={isAr ? "اكتمال" : "Complete"} value={`${completeness}%`} />
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="info">{isAr ? "معلومات" : "Info"}</TabsTrigger>
            <TabsTrigger value="chefs">{isAr ? "الطهاة" : "Chefs"}</TabsTrigger>
            <TabsTrigger value="activity">{isAr ? "النشاط" : "Activity"}</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            {entity.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "الوصف" : "Description"}</p>
                <p className="text-sm">{isAr && entity.description_ar ? entity.description_ar : entity.description}</p>
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              {entity.city && <InfoRow icon={MapPin} label={isAr ? "المدينة" : "City"} value={`${entity.city}${entity.country ? `, ${entity.country}` : ""}`} />}
              {entity.email && <InfoRow icon={Mail} label={isAr ? "البريد" : "Email"} value={entity.email} />}
              {entity.phone && <InfoRow icon={Phone} label={isAr ? "الهاتف" : "Phone"} value={entity.phone} />}
              {entity.website && <InfoRow icon={Globe} label={isAr ? "الموقع" : "Website"} value={entity.website} />}
              {entity.founded_year && <InfoRow icon={Calendar} label={isAr ? "سنة التأسيس" : "Founded"} value={String(entity.founded_year)} />}
              {entity.member_count && <InfoRow icon={Users} label={isAr ? "الأعضاء" : "Members"} value={String(entity.member_count)} />}
            </div>
            {entity.mission && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "الرسالة" : "Mission"}</p>
                  <p className="text-sm">{isAr && entity.mission_ar ? entity.mission_ar : entity.mission}</p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="chefs" className="mt-4 space-y-3">
            {!associations?.length ? (
              <p className="text-sm text-muted-foreground text-center py-8">{isAr ? "لا يوجد طهاة مرتبطين" : "No associated chefs"}</p>
            ) : associations.map((a: any) => (
              <Card key={a.id} className="border-border/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={a.profiles?.avatar_url || ""} />
                    <AvatarFallback>{(a.profiles?.full_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{isAr && a.profiles?.full_name_ar ? a.profiles.full_name_ar : a.profiles?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{a.role_title || a.association_type} {a.is_current && <Badge variant="outline" className="text-[10px] ms-1">{isAr ? "حالي" : "Current"}</Badge>}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="activity" className="mt-4 space-y-3">
            <InfoRow icon={Calendar} label={isAr ? "تاريخ الإنشاء" : "Created"} value={entity.created_at ? new Date(entity.created_at).toLocaleDateString() : "—"} />
            <InfoRow icon={Eye} label={isAr ? "مرئي" : "Visible"} value={entity.is_visible ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")} />
            {entity.internal_notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "ملاحظات داخلية" : "Internal Notes"}</p>
                <p className="text-sm">{entity.internal_notes}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function MiniKPI({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-2.5 text-center">
      <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function calculateCompleteness(entity: any): number {
  const fields = ["name", "description", "type", "country", "city", "email", "phone", "website", "logo_url", "founded_year", "mission", "president_name"];
  const filled = fields.filter(f => entity[f] != null && entity[f] !== "").length;
  return Math.round((filled / fields.length) * 100);
}
