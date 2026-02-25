import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompetitionHistory } from "@/components/profile/CompetitionHistory";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { ProfileCertificates } from "@/components/profile/ProfileCertificates";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { SEOHead } from "@/components/SEOHead";
import { useFollowStats, useIsFollowing, useToggleFollow, useFollowersList, useFollowPrivacy, usePendingFollowRequest } from "@/hooks/useFollow";
import { useUserSpecialties } from "@/hooks/useSpecialties";
import { useRecordProfileView } from "@/hooks/useProfileViews";
import { SectionReveal } from "@/components/ui/section-reveal";
import {
  User, Award, BadgeCheck, ArrowLeft, Calendar, Briefcase, GraduationCap, Building2,
  ExternalLink, Trophy, Medal, ImageIcon, MapPin, Globe, Tv, Gavel, Users,
} from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import { toEnglishDigits } from "@/lib/formatNumber";
import type { Database } from "@/integrations/supabase/types";

import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { PublicProfileStats } from "@/components/public-profile/PublicProfileStats";
import { PublicProfileSchedule } from "@/components/public-profile/PublicProfileSchedule";
import { PublicProfileAbout } from "@/components/public-profile/PublicProfileAbout";
import { PublicProfileSidebar } from "@/components/public-profile/PublicProfileSidebar";
import { PublicProfileGallery } from "@/components/public-profile/PublicProfileGallery";
import { PublicProfileEmptySection } from "@/components/public-profile/PublicProfileEmptySection";
import { PublicProfileAchievements } from "@/components/public-profile/PublicProfileAchievements";
import { ProfileActivityTimeline } from "@/components/profile/ProfileActivityTimeline";
import { CollapsibleProfileSection } from "@/components/public-profile/CollapsibleProfileSection";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

const formatDate = (date: string | null, isAr: boolean) => {
  if (!date) return "";
  return toEnglishDigits(new Date(date).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
};

const containsArabic = (text?: string | null) => !!text && /[\u0600-\u06FF]/.test(text);
const containsLatin = (text?: string | null) => !!text && /[A-Za-z]/.test(text);

const pickLocalizedText = (isAr: boolean, arText?: string | null, enText?: string | null) => {
  const ar = (arText || "").trim();
  const en = (enText || "").trim();

  if (isAr) {
    if (ar) return ar;
    // Fallback: if EN field contains Arabic text, use it
    if (en && containsArabic(en)) return en;
    // Last resort: show whatever is available
    return en || "";
  }

  if (en && !containsArabic(en)) return en;
  // Fallback: if EN field has Arabic, try AR field for Latin text
  if (ar && containsLatin(ar)) return ar;
  // Last resort: show whatever is available
  return en || ar || "";
};

const formatPeriodRange = (startDate: string | null, endDate: string | null, isCurrent: boolean, isAr: boolean) => {
  const start = formatDate(startDate, isAr);
  const end = formatDate(endDate, isAr);

  if (isCurrent) return `${start || (isAr ? "غير محدد" : "Unknown")} – ${isAr ? "الحالي" : "Present"}`;
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return isAr ? "غير محدد" : "Not specified";
};




export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();
  const [followListOpen, setFollowListOpen] = useState<"followers" | "following" | null>(null);
  

  const getCountryName = (code: string | null) => {
    if (!code) return null;
    const c = allCountries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  };

  const { data: profile, isLoading, error, refetch: refetchProfile } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_public").select("*").eq("username", username?.toLowerCase()).maybeSingle();
      if (error) throw error;
      if (data) return data;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username || "");
      if (isUuid) {
        const { data: byId, error: err2 } = await supabase.from("profiles_public").select("*").eq("user_id", username).maybeSingle();
        if (err2) throw err2;
        if (byId) return byId;
      }
      throw new Error("Profile not found");
    },
    enabled: !!username,
  });

  useRecordProfileView(profile?.user_id);

  const { data: qrCode } = useEntityQRCode("user", profile?.username || undefined, "account");
  const { data: roles } = useQuery({
    queryKey: ["publicProfileRoles", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", profile!.user_id);
      return data?.map(r => r.role) as AppRole[] || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: careerRecords = [] } = useQuery({
    queryKey: ["public-career-records", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_career_records").select("*")
        .eq("user_id", profile!.user_id)
        .order("is_current", { ascending: false })
        .order("end_date", { ascending: false, nullsFirst: true })
        .order("start_date", { ascending: false });
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["public-memberships", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("entity_memberships")
        .select("*, culinary_entities(name, name_ar, logo_url, type)")
        .eq("user_id", profile!.user_id).eq("status", "active");
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: userAwards = [] } = useQuery({
    queryKey: ["public-user-awards", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_global_awards")
        .select("*, global_awards_system(*)").eq("user_id", profile!.user_id).eq("is_public", true);
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: followStats } = useFollowStats(profile?.user_id);
  const { data: isFollowing } = useIsFollowing(profile?.user_id);
  const toggleFollow = useToggleFollow(profile?.user_id);
  const { data: followersList = [] } = useFollowersList(followListOpen ? profile?.user_id : undefined, followListOpen || "followers");
  const { data: userSpecialties = [] } = useUserSpecialties(profile?.user_id);
  const { data: followPrivacy } = useFollowPrivacy(profile?.user_id);
  const { data: pendingRequest } = usePendingFollowRequest(profile?.user_id);

  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["user-media-gallery", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.storage.from("user-media").list(`${profile!.user_id}`, { limit: 20 });
      return (data || []).filter(f => f.name !== ".emptyFolderPlaceholder").map(f => {
        const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(`${profile!.user_id}/${f.name}`);
        return { name: f.name, url: urlData.publicUrl };
      });
    },
    enabled: !!profile?.user_id,
  });

  const isOwnProfile = user?.id === profile?.user_id;
  const visibility = profile?.section_visibility || {};
  const isVisible = (section: string) => visibility[section] !== false;

  // ── LOADING STATE ──
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <div className="h-48 sm:h-60 md:h-72 bg-gradient-to-br from-primary/15 via-primary/5 to-chart-3/8 animate-pulse" />
        <main className="px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full -mt-20 pb-8">
          <div className="rounded-2xl bg-card/90 backdrop-blur-xl border border-border/25 p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
              <Skeleton className="h-28 w-28 md:h-36 md:w-36 rounded-full -mt-20 md:-mt-24 ring-4 ring-background" />
              <div className="flex-1 space-y-2.5 w-full">
                <Skeleton className="h-7 w-48 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-24 mx-auto md:mx-0" />
                <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
              </div>
            </div>
          </div>
          <Skeleton className="h-14 rounded-2xl mt-4" />
          <div className="grid md:grid-cols-[1fr_300px] gap-6 mt-6">
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <Skeleton className="h-52 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── ERROR STATE ──
  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <div className="rounded-2xl bg-muted/60 p-5"><User className="h-10 w-10 text-muted-foreground/40" /></div>
          <h1 className="font-serif text-xl font-bold">{isAr ? "المستخدم غير موجود" : "User not found"}</h1>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            {isAr ? "الملف الشخصي غير موجود أو تم حذفه." : "This profile doesn't exist or has been removed."}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/"><ArrowLeft className="me-1.5 h-3.5 w-3.5" />{isAr ? "الرئيسية" : "Go Home"}</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = isAr
    ? (profile.display_name_ar || profile.full_name_ar || profile.display_name || profile.full_name || "طاهٍ")
    : (profile.display_name || profile.full_name || profile.display_name_ar || profile.full_name_ar || "Chef");
  const bio = pickLocalizedText(isAr, profile.bio_ar, profile.bio);
  const specialization = pickLocalizedText(isAr, profile.specialization_ar, profile.specialization);

  const socialLinks = [
    { key: "instagram", value: profile.instagram, label: "Instagram" },
    { key: "twitter", value: profile.twitter, label: "X / Twitter" },
    { key: "facebook", value: profile.facebook, label: "Facebook" },
    { key: "linkedin", value: profile.linkedin, label: "LinkedIn" },
    { key: "youtube", value: profile.youtube, label: "YouTube" },
    { key: "website", value: profile.website, label: isAr ? "الموقع" : "Website" },
  ].filter(s => s.value);

  const educationRecords = careerRecords.filter((r: any) => r.record_type === "education");

  // Split "work" records into sub-categories based on description patterns
  const allWorkRecords = careerRecords.filter((r: any) => r.record_type === "work");
  const isJudging = (r: any) => /Role:\s*Judge|Head.?Judge/i.test(r.description || "") || /Role:\s*Judge|Head.?Judge/i.test(r.description_ar || "");
  const isMediaInWork = (r: any) => /^📺|^📻|^🎙️|^📰|^📖|^🌐|TV\b|Radio\b|Podcast\b|interview/i.test(r.description || "");
  const isParticipation = (r: any) => /Role:\s*(Organizer|Participant)/i.test(r.description || "");

  const judgingRecords = allWorkRecords.filter(isJudging);
  const mediaInWorkRecords = allWorkRecords.filter((r: any) => !isJudging(r) && isMediaInWork(r));
  const participationRecords = allWorkRecords.filter((r: any) => !isJudging(r) && !isMediaInWork(r) && isParticipation(r));
  const workRecords = allWorkRecords.filter((r: any) => !isJudging(r) && !isMediaInWork(r) && !isParticipation(r));

  const mediaRecords = [
    ...careerRecords.filter((r: any) => r.record_type === "media"),
    ...mediaInWorkRecords,
  ];
  const certificationRecords = careerRecords.filter((r: any) => r.record_type === "certification");
  const currentWork = workRecords.find((r: any) => r.is_current) || workRecords[0];

  const roleLabels: Record<string, { en: string; ar: string }> = {
    chef: { en: "Chef", ar: "طاهٍ" }, judge: { en: "Judge", ar: "حكم" },
    organizer: { en: "Organizer", ar: "منظم" }, student: { en: "Student", ar: "طالب" },
    sponsor: { en: "Sponsor", ar: "راعي" }, supervisor: { en: "Supervisor", ar: "مشرف" },
  };

  const profileUrl = `https://altoha.com/${profile.username}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={`${displayName} (@${profile.username}) - Altoha`}
        description={bio || `${displayName}'s professional culinary profile on Altoha`}
      />
      <Header />

      {/* ═══ HERO ═══ */}
      <PublicProfileHero
        profile={profile} displayName={displayName} currentWork={currentWork}
        roles={roles || []} roleLabels={roleLabels} userAwards={userAwards}
        isAr={isAr} isOwnProfile={isOwnProfile} isFollowing={isFollowing}
        pendingRequest={pendingRequest} followPrivacy={followPrivacy}
        toggleFollow={toggleFollow} user={user} getCountryName={getCountryName}
        userSpecialties={userSpecialties}
      />

      {/* ═══ STATS BAR ═══ */}
      <div className="px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full mt-4">
        <SectionReveal delay={100}>
          <PublicProfileStats
            profile={profile} followStats={followStats} socialLinks={socialLinks}
            isAr={isAr} isVisible={isVisible} onFollowClick={setFollowListOpen}
          />
        </SectionReveal>
      </div>

      {/* ═══ MAIN CONTENT (2-column layout) ═══ */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full mt-4 sm:mt-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
          {/* ── LEFT COLUMN (Main Content) ── */}
          <div className="space-y-5 min-w-0">
            {/* About */}
            {isVisible("bio") && (
              <SectionReveal delay={150}>
                <CollapsibleProfileSection
                  icon={User}
                  label={isAr ? "نبذة" : "About"}
                  defaultOpen={true}
                  isEmpty={!bio && !specialization}
                >
                  {(bio || specialization) ? (
                    <PublicProfileAbout
                      profile={profile} bio={bio} specialization={specialization}
                      userSpecialties={userSpecialties} isAr={isAr}
                    />
                  ) : (
                    <PublicProfileEmptySection
                      icon={User}
                      label={isAr ? "نبذة" : "About"}
                      description={isAr ? "لم يتم إضافة نبذة بعد" : "No bio added yet"}
                      isAr={isAr}
                    />
                  )}
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Schedule */}
            {profile.user_id && (
              <SectionReveal delay={200}>
                <PublicProfileSchedule userId={profile.user_id} isAr={isAr} />
              </SectionReveal>
            )}

            {/* Achievements */}
            {profile.user_id && (
              <SectionReveal delay={225}>
                <PublicProfileAchievements userId={profile.user_id} isAr={isAr} />
              </SectionReveal>
            )}

            {/* Experience */}
            {isVisible("career") && (
              <SectionReveal delay={250}>
                <CollapsibleProfileSection
                  icon={Briefcase}
                  label={isAr ? "الخبرة المهنية" : "Professional Experience"}
                  count={workRecords.length}
                  defaultOpen={true}
                  isEmpty={workRecords.length === 0}
                >
                  {workRecords.length > 0 ? (
                    <div className="space-y-2.5">
                      {workRecords.map((record: any) => (
                        <Card key={record.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/8 group-hover/card:scale-110 transition-transform duration-300">
                                <Briefcase className="h-4 w-4 text-chart-3 group-hover/card:text-chart-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-sm">{pickLocalizedText(isAr, record.title_ar, record.title) || "—"}</h4>
                                  {record.is_current && <Badge className="bg-chart-3/10 text-chart-3 text-[10px] h-5">{isAr ? "حالي" : "Current"}</Badge>}
                                </div>
                                {(record.entity_name || record.entity_name_ar) && (
                                  record.entity_id ? (
                                    <Link to={`/entities/${record.entity_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                      {pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}<ExternalLink className="h-2.5 w-2.5" />
                                    </Link>
                                  ) : <p className="text-xs text-muted-foreground mt-0.5">{pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatPeriodRange(record.start_date, record.end_date, !!record.is_current, isAr)}</span>
                                  {record.employment_type && <Badge variant="outline" className="text-[9px] h-4">{record.employment_type}</Badge>}
                                  {record.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{record.location}</span>}
                                </div>
                                {pickLocalizedText(isAr, record.description_ar, record.description) && (
                                  <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed" dir={isAr ? "rtl" : "ltr"}>
                                    {pickLocalizedText(isAr, record.description_ar, record.description)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <PublicProfileEmptySection
                      icon={Briefcase}
                      label={isAr ? "الخبرة المهنية" : "Professional Experience"}
                      description={isAr ? "لم يتم إضافة خبرة مهنية بعد" : "No experience added yet"}
                      isAr={isAr}
                    />
                  )}
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Judging */}
            {isVisible("career") && judgingRecords.length > 0 && (
              <SectionReveal delay={275}>
                <CollapsibleProfileSection
                  icon={Gavel}
                  label={isAr ? "التحكيم" : "Judging"}
                  count={judgingRecords.length}
                  defaultOpen={true}
                >
                  <div className="space-y-2.5">
                    {judgingRecords.map((record: any) => (
                      <Card key={record.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-5/8 group-hover/card:scale-110 transition-transform duration-300">
                              <Gavel className="h-4 w-4 text-chart-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{pickLocalizedText(isAr, record.title_ar, record.title) || "—"}</h4>
                              {(record.entity_name || record.entity_name_ar) && (
                                record.entity_id ? (
                                  <Link to={`/entities/${record.entity_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                    {pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}<ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                ) : <p className="text-xs text-muted-foreground mt-0.5">{pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatPeriodRange(record.start_date, record.end_date, !!record.is_current, isAr)}</span>
                                {record.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{record.location}</span>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Participation & Events */}
            {isVisible("career") && participationRecords.length > 0 && (
              <SectionReveal delay={285}>
                <CollapsibleProfileSection
                  icon={Users}
                  label={isAr ? "المشاركات والفعاليات" : "Participation & Events"}
                  count={participationRecords.length}
                  defaultOpen={false}
                >
                  <div className="space-y-2.5">
                    {participationRecords.map((record: any) => (
                      <Card key={record.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-1/8 group-hover/card:scale-110 transition-transform duration-300">
                              <Users className="h-4 w-4 text-chart-1" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{pickLocalizedText(isAr, record.title_ar, record.title) || "—"}</h4>
                              {(record.entity_name || record.entity_name_ar) && (
                                record.entity_id ? (
                                  <Link to={`/entities/${record.entity_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                    {pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}<ExternalLink className="h-2.5 w-2.5" />
                                  </Link>
                                ) : <p className="text-xs text-muted-foreground mt-0.5">{pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatPeriodRange(record.start_date, record.end_date, !!record.is_current, isAr)}</span>
                                {record.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{record.location}</span>}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Education */}
            {isVisible("education") && (
              <SectionReveal delay={300}>
                <CollapsibleProfileSection
                  icon={GraduationCap}
                  label={isAr ? "التعليم" : "Education"}
                  count={educationRecords.length}
                  defaultOpen={true}
                  isEmpty={educationRecords.length === 0}
                >
                  {educationRecords.length > 0 ? (
                    <div className="space-y-2.5">
                      {educationRecords.map((record: any) => (
                        <Card key={record.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/8 group-hover/card:scale-110 transition-transform duration-300">
                                <GraduationCap className="h-4 w-4 text-chart-2 group-hover/card:text-chart-2" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm">{pickLocalizedText(isAr, record.title_ar, record.title) || "—"}</h4>
                                {(record.entity_name || record.entity_name_ar) && (
                                  record.entity_id ? (
                                    <Link to={`/entities/${record.entity_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                      {pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}<ExternalLink className="h-2.5 w-2.5" />
                                    </Link>
                                  ) : <p className="text-xs text-muted-foreground mt-0.5">{pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatPeriodRange(record.start_date, record.end_date, !!record.is_current, isAr)}</span>
                                  {record.education_level && <Badge variant="outline" className="text-[9px] h-4">{record.education_level}</Badge>}
                                  {pickLocalizedText(isAr, record.field_of_study_ar, record.field_of_study) && <span>{pickLocalizedText(isAr, record.field_of_study_ar, record.field_of_study)}</span>}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <PublicProfileEmptySection
                      icon={GraduationCap}
                      label={isAr ? "التعليم" : "Education"}
                      description={isAr ? "لم يتم إضافة تعليم بعد" : "No education added yet"}
                      isAr={isAr}
                    />
                  )}
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Media Appearances */}
            {isVisible("career") && mediaRecords.length > 0 && (
              <SectionReveal delay={325}>
                <CollapsibleProfileSection
                  icon={Tv}
                  label={isAr ? "الظهور الإعلامي" : "Media Appearances"}
                  count={mediaRecords.length}
                  defaultOpen={true}
                >
                  <div className="space-y-2.5">
                    {mediaRecords.map((record: any) => (
                      <Card key={record.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/8 group-hover/card:scale-110 transition-transform duration-300">
                              <Tv className="h-4 w-4 text-chart-4 group-hover/card:text-chart-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{pickLocalizedText(isAr, record.title_ar, record.title) || "—"}</h4>
                              {(record.entity_name || record.entity_name_ar) && (
                                <p className="text-xs text-muted-foreground mt-0.5">{pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatPeriodRange(record.start_date, record.end_date, !!record.is_current, isAr)}</span>
                                {record.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{record.location}</span>}
                              </div>
                              {pickLocalizedText(isAr, record.description_ar, record.description) && (
                                <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed" dir={isAr ? "rtl" : "ltr"}>
                                  {pickLocalizedText(isAr, record.description_ar, record.description)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Career Certifications */}
            {isVisible("career") && certificationRecords.length > 0 && (
              <SectionReveal delay={340}>
                <CollapsibleProfileSection
                  icon={Award}
                  label={isAr ? "الشهادات المهنية" : "Professional Certifications"}
                  count={certificationRecords.length}
                  defaultOpen={true}
                >
                  <div className="space-y-2.5">
                    {certificationRecords.map((record: any) => (
                      <Card key={record.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-5/8 group-hover/card:scale-110 transition-transform duration-300">
                              <Award className="h-4 w-4 text-chart-5 group-hover/card:text-chart-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">{pickLocalizedText(isAr, record.title_ar, record.title) || "—"}</h4>
                              {(record.entity_name || record.entity_name_ar) && (
                                <p className="text-xs text-muted-foreground mt-0.5">{pickLocalizedText(isAr, record.entity_name_ar, record.entity_name)}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatPeriodRange(record.start_date, record.end_date, !!record.is_current, isAr)}</span>
                              </div>
                              {pickLocalizedText(isAr, record.description_ar, record.description) && (
                                <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed" dir={isAr ? "rtl" : "ltr"}>
                                  {pickLocalizedText(isAr, record.description_ar, record.description)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Memberships */}
            {isVisible("memberships") && (
              <SectionReveal delay={350}>
                <CollapsibleProfileSection
                  icon={Building2}
                  label={isAr ? "العضويات والجهات" : "Memberships & Entities"}
                  count={memberships.length}
                  defaultOpen={true}
                  isEmpty={memberships.length === 0}
                >
                  {memberships.length > 0 ? (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {memberships.map((m: any) => (
                        <Card key={m.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                          <CardContent className="p-4 flex items-center gap-3">
                            {m.culinary_entities?.logo_url ? (
                              <img src={m.culinary_entities.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover border" />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs truncate">
                                {isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : (m.culinary_entities?.name || m.culinary_entities?.name_ar)}
                              </h4>
                              {m.title && <p className="text-[11px] text-muted-foreground truncate">{isAr ? (m.title_ar || m.title) : m.title}</p>}
                              <Badge variant="outline" className="text-[9px] mt-1 h-4">{m.membership_type}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <PublicProfileEmptySection
                      icon={Building2}
                      label={isAr ? "العضويات والجهات" : "Memberships & Entities"}
                      description={isAr ? "لم يتم إضافة عضويات بعد" : "No memberships added yet"}
                      isAr={isAr}
                    />
                  )}
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Certificates */}
            {isVisible("certificates") && (
              <SectionReveal delay={400}>
                <CollapsibleProfileSection
                  icon={Award}
                  label={isAr ? "الشهادات" : "Certificates"}
                  defaultOpen={true}
                >
                  <ProfileCertificates userId={profile.user_id} isOwner={isOwnProfile} />
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Competitions */}
            {isVisible("competitions") && (
              <SectionReveal delay={450}>
                <CollapsibleProfileSection
                  icon={Trophy}
                  label={isAr ? "المسابقات" : "Competitions"}
                  defaultOpen={false}
                >
                  <CompetitionHistory userId={profile.user_id} />
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Badges */}
            {isVisible("badges") && (
              <SectionReveal delay={500}>
                <CollapsibleProfileSection
                  icon={Medal}
                  label={isAr ? "الأوسمة" : "Badges"}
                  defaultOpen={false}
                >
                  <UserBadgesDisplay userId={profile.user_id} />
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Gallery */}
            <SectionReveal delay={550}>
              <CollapsibleProfileSection
                icon={ImageIcon}
                label={isAr ? "الألبوم" : "Gallery"}
                count={mediaFiles.length}
                defaultOpen={mediaFiles.length > 0}
                isEmpty={mediaFiles.length === 0}
              >
                {mediaFiles.length > 0 ? (
                  <PublicProfileGallery mediaFiles={mediaFiles} isAr={isAr} />
                ) : (
                  <PublicProfileEmptySection
                    icon={ImageIcon}
                    label={isAr ? "الألبوم" : "Gallery"}
                    description={isAr ? "لم يتم إضافة صور بعد" : "No photos added yet"}
                    isAr={isAr}
                  />
                )}
              </CollapsibleProfileSection>
            </SectionReveal>
          </div>

          {/* ── RIGHT COLUMN (Sidebar) ── */}
          <div className="hidden md:block">
            <div className="sticky top-20 space-y-4">
              <SectionReveal delay={200} direction="right">
                <PublicProfileSidebar
                  profile={profile} qrCode={qrCode} isAr={isAr}
                  isVisible={isVisible} getCountryName={getCountryName}
                  profileUrl={profileUrl} t={t}
                />
              </SectionReveal>
              <SectionReveal delay={300} direction="right">
                <ProfileActivityTimeline userId={profile.user_id} />
              </SectionReveal>
            </div>
          </div>

          {/* Mobile sidebar */}
          <div className="md:hidden">
            <PublicProfileSidebar
              profile={profile} qrCode={qrCode} isAr={isAr}
              isVisible={isVisible} getCountryName={getCountryName}
              profileUrl={profileUrl} t={t}
            />
          </div>
        </div>
      </main>


      {/* ── Follow List Dialog ── */}
      <Dialog open={!!followListOpen} onOpenChange={() => setFollowListOpen(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-serif">{followListOpen === "followers" ? (isAr ? "المتابعون" : "Followers") : (isAr ? "يتابع" : "Following")}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-1">
              {followersList.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground/60">{isAr ? "لا يوجد" : "No users yet"}</p>
              ) : (
                followersList.map((p: any) => (
                  <Link key={p.user_id} to={`/${p.username}`} onClick={() => setFollowListOpen(null)}
                    className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/40 transition-all duration-200">
                    <Avatar className="h-10 w-10 ring-2 ring-border/20">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{(p.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">{p.display_name || p.full_name || "Unknown"}</p>
                        {p.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">@{p.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
