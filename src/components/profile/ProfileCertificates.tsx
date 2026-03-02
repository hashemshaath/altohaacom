import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Calendar, MapPin, Trophy, ShieldCheck, Eye, EyeOff, Lock, Share2, Link2, MessageSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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

  const handleShareAsPost = async (cert: any) => {
    if (!user) return;
    const eventName = isAr && cert.event_name_ar ? cert.event_name_ar : cert.event_name;
    const achievement = isAr && cert.achievement_ar ? cert.achievement_ar : cert.achievement;
    const typeLabel = typeLabels[cert.type] ? (isAr ? typeLabels[cert.type].ar : typeLabels[cert.type].en) : cert.type;

    const content = isAr
      ? `🏆 حصلت على شهادة ${typeLabel}${achievement ? ` - ${achievement}` : ""}${eventName ? `\nفي ${eventName}` : ""}\n\n🔗 رمز التحقق: ${cert.verification_code}\n\n#شهادة #إنجاز #طهاة`
      : `🏆 Earned a ${typeLabel} certificate${achievement ? ` - ${achievement}` : ""}${eventName ? `\nat ${eventName}` : ""}\n\n🔗 Verification: ${cert.verification_code}\n\n#certificate #achievement #culinary`;

    const { data: insertedPost, error } = await supabase.from("posts").insert({
      author_id: user.id,
      content,
      visibility: "public",
    }).select("id").single();

    if (!error && insertedPost) {
      toast({ title: isAr ? "تمت مشاركة الشهادة ✓" : "Certificate shared ✓" });
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-content`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: JSON.stringify({ post_id: insertedPost.id, content, user_id: user.id }),
          });
        }
      } catch {}
    } else if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleCopyLink = (cert: any) => {
    const url = `${window.location.origin}/verify?code=${cert.verification_code}`;
    navigator.clipboard.writeText(url);
    toast({ title: isAr ? "تم نسخ الرابط ✓" : "Link copied ✓" });
  };

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
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
          <Award className="h-4 w-4 text-primary" />
        </div>
        <h2 className={`text-base font-bold ${language !== "ar" ? "font-serif" : ""}`}>{isAr ? "الشهادات" : "Certificates"}</h2>
        <Badge variant="secondary" className="text-[10px] h-5 rounded-xl">{certificates.length}</Badge>
        <div className="flex-1 h-px bg-border/25" />
      </div>

      {certificates.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-border/30 bg-muted/10">
          <CardContent className="py-8 px-6 flex flex-col items-center justify-center text-center gap-2.5">
            <div className="h-11 w-11 rounded-full bg-muted/40 flex items-center justify-center">
              <Award className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-xs text-muted-foreground/50">{isAr ? "لا توجد شهادات لعرضها" : "No certificates to display"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {certificates.map((cert) => {
            const config = getTypeConfig(cert.type);
            const IconComp = config.icon;
            const eventName = isAr && cert.event_name_ar ? cert.event_name_ar : cert.event_name;
            const achievement = isAr && cert.achievement_ar ? cert.achievement_ar : cert.achievement;
            const location = isAr && cert.event_location_ar ? cert.event_location_ar : cert.event_location;

            return (
              <Card key={cert.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/30 ${config.color}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] h-5 rounded-xl">{getTypeLabel(cert.type)}</Badge>
                        <span className="text-[10px] font-mono text-muted-foreground/60">{cert.verification_code}</span>
                      </div>
                      {achievement && (
                        <p className="text-sm font-semibold mt-1 truncate">{achievement}</p>
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
                    <div className="flex items-center gap-1">
                      {/* Share button */}
                      {isOwner && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-muted-foreground hover:text-primary">
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleShareAsPost(cert)}>
                              <MessageSquare className="h-3.5 w-3.5 me-2" />
                              {isAr ? "مشاركة كمنشور" : "Share as post"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(cert)}>
                              <Link2 className="h-3.5 w-3.5 me-2" />
                              {isAr ? "نسخ رابط التحقق" : "Copy verification link"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {/* Visibility selector */}
                      {isOwner && (
                        <Select
                          value={cert.visibility || "public"}
                          onValueChange={(v) => visibilityMutation.mutate({ certId: cert.id, visibility: v })}
                        >
                          <SelectTrigger className="w-auto h-7 text-[10px] gap-1 border-none bg-muted/30 rounded-xl">
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}