import { forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import {
  FileText, Briefcase, GraduationCap, Award, Trophy, MapPin,
  Calendar, Globe, Star, Users, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ProfileOverviewTabProps {
  profile: any;
  userId: string;
}

export function ProfileOverviewTab({ profile, userId }: ProfileOverviewTabProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: qrCode } = useEntityQRCode("user", profile?.username || undefined, "account");

  // Career records (latest 3)
  const { data: careerRecords = [] } = useQuery({
    queryKey: ["profile-career-summary", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_career_records")
        .select("*")
        .eq("user_id", userId)
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false })
        .limit(4);
      return data || [];
    },
    enabled: !!userId,
  });

  // Entity memberships
  const { data: memberships = [] } = useQuery({
    queryKey: ["profile-memberships-summary", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url)")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(4);
      return data || [];
    },
    enabled: !!userId,
  });

  // Certificates (latest 3)
  const { data: certificates = [] } = useQuery({
    queryKey: ["profile-certs-summary", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("certificates")
        .select("id, type, event_name, event_name_ar, achievement, achievement_ar, issued_at, verification_code")
        .eq("recipient_id", userId)
        .eq("status", "issued" as any)
        .eq("visibility", "public")
        .order("issued_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!userId,
  });

  // Competitions (latest 3)
  const { data: competitions = [] } = useQuery({
    queryKey: ["profile-comps-summary", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_registrations")
        .select("id, status, competition_id, competitions(title, title_ar, competition_start, cover_image_url)")
        .eq("participant_id", userId)
        .order("registered_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!userId,
  });

  const formatDate = (d: string | null) => {
    if (!d) return isAr ? "الحالي" : "Present";
    return format(new Date(d), "MMM yyyy", { locale: isAr ? ar : undefined });
  };

  const workRecords = careerRecords.filter((r: any) => r.record_type === "work");
  const eduRecords = careerRecords.filter((r: any) => r.record_type === "education");

  return (
    <div className="space-y-6">
      {/* About / Bio */}
      {(profile?.bio || profile?.bio_ar) && (
        <section>
          <SectionHeader icon={FileText} label={isAr ? "النبذة" : "About"} />
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap" dir={isAr ? "rtl" : "ltr"}>
                {isAr ? (profile?.bio_ar || profile?.bio) : profile?.bio}
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Professional Experience */}
      {workRecords.length > 0 && (
        <section>
          <SectionHeader icon={Briefcase} label={isAr ? "الخبرة المهنية" : "Experience"} linkTo="/profile?tab=career" linkLabel={isAr ? "عرض الكل" : "View all"} />
          <Card>
            <CardContent className="pt-4 pb-4 space-y-0 divide-y">
              {workRecords.map((r: any) => (
                <div key={r.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{isAr ? (r.title_ar || r.title) : r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.entity_name || (isAr ? (r.department_ar || r.department) : r.department)}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>{formatDate(r.start_date)} – {r.is_current ? (isAr ? "حالياً" : "Present") : formatDate(r.end_date)}</span>
                      {r.location && (
                        <>
                          <MapPin className="h-2.5 w-2.5 ms-1" />
                          <span>{r.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {r.is_current && <Badge variant="secondary" className="text-[9px] h-5 self-start">{isAr ? "حالي" : "Current"}</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Education */}
      {eduRecords.length > 0 && (
        <section>
          <SectionHeader icon={GraduationCap} label={isAr ? "التعليم" : "Education"} linkTo="/profile?tab=career" linkLabel={isAr ? "عرض الكل" : "View all"} />
          <Card>
            <CardContent className="pt-4 pb-4 space-y-0 divide-y">
              {eduRecords.map((r: any) => (
                <div key={r.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-2/10 mt-0.5">
                    <GraduationCap className="h-4 w-4 text-chart-2" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{isAr ? (r.title_ar || r.title) : r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.entity_name || (isAr ? (r.field_of_study_ar || r.field_of_study) : r.field_of_study)}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <Calendar className="h-2.5 w-2.5" />
                      <span>{formatDate(r.start_date)} – {formatDate(r.end_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Entity Memberships */}
      {memberships.length > 0 && (
        <section>
          <SectionHeader icon={Users} label={isAr ? "العضويات" : "Memberships"} linkTo="/profile?tab=career" linkLabel={isAr ? "عرض الكل" : "View all"} />
          <Card>
            <CardContent className="pt-4 pb-4 space-y-0 divide-y">
              {memberships.map((m: any) => (
                <div key={m.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-3/10 mt-0.5 overflow-hidden">
                    {m.culinary_entities?.logo_url ? (
                      <img src={m.culinary_entities.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-4 w-4 text-chart-3" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : m.culinary_entities?.name}
                    </p>
                    {m.title && <p className="text-xs text-muted-foreground truncate">{isAr ? (m.title_ar || m.title) : m.title}</p>}
                  </div>
                  <Badge variant="outline" className="text-[9px] h-5 self-start capitalize">{m.membership_type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <section>
          <SectionHeader icon={Award} label={isAr ? "الشهادات" : "Certificates"} linkTo="/profile?tab=certificates" linkLabel={isAr ? "عرض الكل" : "View all"} />
          <Card>
            <CardContent className="pt-4 pb-4 space-y-0 divide-y">
              {certificates.map((c: any) => (
                <div key={c.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-4/10 mt-0.5">
                    <Award className="h-4 w-4 text-chart-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{isAr ? (c.achievement_ar || c.achievement || c.event_name_ar || c.event_name) : (c.achievement || c.event_name)}</p>
                    <p className="text-xs text-muted-foreground truncate">{isAr ? (c.event_name_ar || c.event_name) : c.event_name}</p>
                    {c.issued_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(c.issued_at)}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[9px] h-5 self-start capitalize">{c.type?.replace("_", " ")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Competitions */}
      {competitions.length > 0 && (
        <section>
          <SectionHeader icon={Trophy} label={isAr ? "المسابقات" : "Competitions"} linkTo="/profile?tab=certificates" linkLabel={isAr ? "عرض الكل" : "View all"} />
          <Card>
            <CardContent className="pt-4 pb-4 space-y-0 divide-y">
              {(competitions as any[]).map((reg) => (
                <Link key={reg.id} to={`/competitions/${reg.competition_id}`} className="flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-accent/30 -mx-4 px-4 rounded-lg transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-1/10 mt-0.5 overflow-hidden">
                    {reg.competitions?.cover_image_url ? (
                      <img src={reg.competitions.cover_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Trophy className="h-4 w-4 text-chart-1" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {isAr ? (reg.competitions?.title_ar || reg.competitions?.title) : reg.competitions?.title}
                    </p>
                    {reg.competitions?.competition_start && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(reg.competitions.competition_start)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Social Media */}
      {(profile?.instagram || profile?.twitter || profile?.facebook || profile?.linkedin || profile?.youtube || profile?.tiktok || profile?.snapchat || profile?.website) && (
        <section>
          <SectionHeader icon={Globe} label={isAr ? "التواصل" : "Links"} />
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {profile?.website && <SocialBadge label="Web" value={profile.website} />}
                {profile?.instagram && <SocialBadge label="IG" value={profile.instagram} />}
                {profile?.twitter && <SocialBadge label="X" value={profile.twitter} />}
                {profile?.facebook && <SocialBadge label="FB" value={profile.facebook} />}
                {profile?.linkedin && <SocialBadge label="LI" value={profile.linkedin} />}
                {profile?.youtube && <SocialBadge label="YT" value={profile.youtube} />}
                {profile?.tiktok && <SocialBadge label="TT" value={profile.tiktok} />}
                {profile?.snapchat && <SocialBadge label="SC" value={profile.snapchat} />}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* QR Code */}
      {qrCode && (
        <section>
          <Card>
            <CardContent className="pt-5 pb-4 flex justify-center">
              <QRCodeDisplay
                code={qrCode.code}
                label={isAr ? "رمز QR للحساب" : "My QR Code"}
                size={130}
                vCardData={{
                  fullName: profile?.full_name || "",
                  phone: profile?.phone || undefined,
                  website: profile?.website || undefined,
                  location: profile?.location || undefined,
                  accountNumber: profile?.account_number || undefined,
                  profileUrl: profile?.username ? `https://altohaacom.lovable.app/${profile.username}` : undefined,
                }}
              />
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

// ── Helpers ──

const SectionHeader = forwardRef<HTMLDivElement, { icon: any; label: string; linkTo?: string; linkLabel?: string }>(
  ({ icon: Icon, label, linkTo, linkLabel }, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-between mb-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {label}
        </h3>
        {linkTo && (
          <Link to={linkTo} className="flex items-center gap-0.5 text-xs text-primary hover:underline">
            {linkLabel} <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";

function SocialBadge({ label, value }: { label: string; value: string }) {
  return (
    <Badge variant="outline" className="text-[10px] gap-1 font-normal">
      <span className="font-semibold">{label}</span> {value}
    </Badge>
  );
}
