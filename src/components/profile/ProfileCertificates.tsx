import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Calendar, MapPin, Trophy, ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProfileCertificatesProps {
  userId: string;
  isOwner?: boolean;
}

const typeIcons: Record<string, { icon: typeof Award; color: string }> = {
  winner_gold: { icon: Trophy, color: "text-chart-4" },
  winner_silver: { icon: Trophy, color: "text-muted-foreground" },
  winner_bronze: { icon: Trophy, color: "text-chart-2" },
  participation: { icon: Award, color: "text-primary" },
  appreciation: { icon: Award, color: "text-chart-3" },
  organizer: { icon: ShieldCheck, color: "text-chart-5" },
  judge: { icon: ShieldCheck, color: "text-destructive" },
  sponsor: { icon: ShieldCheck, color: "text-chart-1" },
  volunteer: { icon: Award, color: "text-accent-foreground" },
};

const typeLabels: Record<string, { en: string; ar: string }> = {
  participation: { en: "Participation", ar: "مشاركة" },
  winner_gold: { en: "Gold", ar: "ذهبي" },
  winner_silver: { en: "Silver", ar: "فضي" },
  winner_bronze: { en: "Bronze", ar: "برونزي" },
  appreciation: { en: "Appreciation", ar: "تقدير" },
  organizer: { en: "Organizer", ar: "منظم" },
  judge: { en: "Judge", ar: "حكم" },
  sponsor: { en: "Sponsor", ar: "راعي" },
  volunteer: { en: "Volunteer", ar: "متطوع" },
};

export function ProfileCertificates({ userId, isOwner = false }: ProfileCertificatesProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ["profile-certificates", userId, isOwner],
    queryFn: async () => {
      let query = supabase
        .from("certificates")
        .select("id, certificate_number, verification_code, type, status, event_name, event_name_ar, event_date, event_location, event_location_ar, achievement, achievement_ar, issued_at, visibility")
        .eq("recipient_id", userId)
        .eq("status", "issued" as any)
        .order("issued_at", { ascending: false });

      // Non-owners only see public certificates
      if (!isOwner) {
        query = query.eq("visibility", "public");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const visibilityMutation = useMutation({
    mutationFn: async ({ certId, visibility }: { certId: string; visibility: string }) => {
      const { error } = await supabase
        .from("certificates")
        .update({ visibility })
        .eq("id", certId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-certificates"] });
      toast({ title: isAr ? "تم تحديث الإعدادات" : "Visibility updated" });
    },
  });

  if (isLoading) return null;
  if (certificates.length === 0 && !isOwner) return null;

  const getTypeConfig = (type: string) => typeIcons[type] || { icon: Award, color: "text-muted-foreground" };
  const getTypeLabel = (type: string) => {
    const l = typeLabels[type];
    return l ? (isAr ? l.ar : l.en) : type;
  };

  const visibilityIcon = (v: string) => {
    if (v === "public") return <Eye className="h-3 w-3" />;
    if (v === "followers") return <EyeOff className="h-3 w-3" />;
    return <Lock className="h-3 w-3" />;
  };

  return (
    <Card dir={isAr ? "rtl" : "ltr"}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-primary" />
          {isAr ? "الشهادات" : "Certificates"}
          <Badge variant="secondary" className="text-[10px] ms-1">{certificates.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isAr ? "لا توجد شهادات لعرضها" : "No certificates to display"}
          </p>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => {
              const config = getTypeConfig(cert.type);
              const IconComp = config.icon;
              const eventName = isAr && cert.event_name_ar ? cert.event_name_ar : cert.event_name;
              const achievement = isAr && cert.achievement_ar ? cert.achievement_ar : cert.achievement;
              const location = isAr && cert.event_location_ar ? cert.event_location_ar : cert.event_location;

              return (
                <div
                  key={cert.id}
                  className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 ${config.color}`}>
                    <IconComp className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{getTypeLabel(cert.type)}</Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">{cert.verification_code}</span>
                    </div>
                    {achievement && (
                      <p className="text-sm font-medium mt-1 truncate">{achievement}</p>
                    )}
                    {eventName && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{eventName}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      {cert.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />{cert.event_date}
                        </span>
                      )}
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />{location}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Select
                      value={cert.visibility || "public"}
                      onValueChange={(v) => visibilityMutation.mutate({ certId: cert.id, visibility: v })}
                    >
                      <SelectTrigger className="w-auto h-7 text-[10px] gap-1 border-none bg-muted/50">
                        {visibilityIcon(cert.visibility || "public")}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" />{isAr ? "عام" : "Public"}</span>
                        </SelectItem>
                        <SelectItem value="followers">
                          <span className="flex items-center gap-1.5"><EyeOff className="h-3 w-3" />{isAr ? "المتابعين" : "Followers"}</span>
                        </SelectItem>
                        <SelectItem value="private">
                          <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" />{isAr ? "خاص" : "Private"}</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
