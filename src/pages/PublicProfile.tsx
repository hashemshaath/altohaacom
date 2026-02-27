import { useParams, Link } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
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
import { SEOHead } from "@/components/SEOHead";
import { SectionReveal } from "@/components/ui/section-reveal";
import {
  User, Award, BadgeCheck, ArrowLeft, Briefcase, GraduationCap, Building2,
  ExternalLink, Trophy, Medal, ImageIcon, Tv, Gavel, Users, Heart,
} from "lucide-react";
import { useAllCountries } from "@/hooks/useCountries";
import { toEnglishDigits } from "@/lib/formatNumber";

import { PublicProfileHero } from "@/components/public-profile/PublicProfileHero";
import { PublicProfileStats } from "@/components/public-profile/PublicProfileStats";
import { PublicProfileSchedule } from "@/components/public-profile/PublicProfileSchedule";
import { PublicProfileAbout } from "@/components/public-profile/PublicProfileAbout";
import { PublicProfileSidebar } from "@/components/public-profile/PublicProfileSidebar";
import { PublicProfileGallery } from "@/components/public-profile/PublicProfileGallery";
import { PublicProfileEmptySection } from "@/components/public-profile/PublicProfileEmptySection";
import { PublicProfileAchievements } from "@/components/public-profile/PublicProfileAchievements";
import { ProfileActivityTimeline } from "@/components/profile/ProfileActivityTimeline";
import { PublicProfilePosts } from "@/components/public-profile/PublicProfilePosts";
import { CollapsibleProfileSection } from "@/components/public-profile/CollapsibleProfileSection";
import { CareerRecordCard } from "@/components/public-profile/CareerRecordCard";
import { usePublicProfileData } from "@/hooks/usePublicProfileData";

// ── Helpers ──
const containsArabic = (text?: string | null) => !!text && /[\u0600-\u06FF]/.test(text);
const containsLatin = (text?: string | null) => !!text && /[A-Za-z]/.test(text);

const pickLocalizedText = (isAr: boolean, arText?: string | null, enText?: string | null) => {
  const ar = (arText || "").trim();
  const en = (enText || "").trim();
  if (isAr) return ar || (en && containsArabic(en) ? en : en) || "";
  if (en && !containsArabic(en)) return en;
  if (ar && containsLatin(ar)) return ar;
  return en || ar || "";
};

const formatDate = (date: string | null, isAr: boolean) => {
  if (!date) return "";
  return toEnglishDigits(new Date(date).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
};

const formatPeriodRange = (startDate: string | null, endDate: string | null, isCurrent: boolean, isAr: boolean) => {
  const fmt = (d: string | null) => {
    if (!d) return "";
    const parts = d.split("-");
    return parts.length === 1 && parts[0].length === 4 ? parts[0] : formatDate(d, isAr);
  };
  const start = fmt(startDate);
  const end = fmt(endDate);
  if (!start && !end) return isCurrent ? (isAr ? "لا يزال مستمراً" : "Still ongoing") : "";
  if (isCurrent) return `${start} – ${isAr ? "مستمر" : "Ongoing"}`;
  if (start && end && start !== end) return `${start} – ${end}`;
  return start || end || "";
};

// ── Section config for career rendering ──
interface SectionDef {
  key: string;
  visKey: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  labelEn: string;
  labelAr: string;
  defaultOpen: boolean;
  showEmpty?: boolean;
  emptyDescEn?: string;
  emptyDescAr?: string;
}

const CAREER_SECTIONS: SectionDef[] = [
  { key: "work", visKey: "career", icon: Briefcase, iconBg: "bg-chart-3/8", iconColor: "text-chart-3", labelEn: "Professional Experience", labelAr: "الخبرة المهنية", defaultOpen: true, showEmpty: true, emptyDescEn: "No experience added yet", emptyDescAr: "لم يتم إضافة خبرة مهنية بعد" },
  { key: "judging", visKey: "career", icon: Gavel, iconBg: "bg-chart-5/8", iconColor: "text-chart-5", labelEn: "Judging", labelAr: "التحكيم", defaultOpen: true },
  { key: "participation", visKey: "career", icon: Users, iconBg: "bg-chart-1/8", iconColor: "text-chart-1", labelEn: "Participation & Events", labelAr: "المشاركات والفعاليات", defaultOpen: false },
  { key: "education", visKey: "education", icon: GraduationCap, iconBg: "bg-chart-2/8", iconColor: "text-chart-2", labelEn: "Education", labelAr: "التعليم", defaultOpen: true, showEmpty: true, emptyDescEn: "No education added yet", emptyDescAr: "لم يتم إضافة تعليم بعد" },
  { key: "media", visKey: "career", icon: Tv, iconBg: "bg-chart-4/8", iconColor: "text-chart-4", labelEn: "Media Appearances", labelAr: "الظهور الإعلامي", defaultOpen: true },
  { key: "certification", visKey: "career", icon: Award, iconBg: "bg-chart-5/8", iconColor: "text-chart-5", labelEn: "Professional Certifications", labelAr: "الشهادات المهنية", defaultOpen: true },
];

const roleLabels: Record<string, { en: string; ar: string }> = {
  chef: { en: "Chef", ar: "طاهٍ" }, judge: { en: "Judge", ar: "حكم" },
  organizer: { en: "Organizer", ar: "منظم" }, student: { en: "Student", ar: "طالب" },
  sponsor: { en: "Sponsor", ar: "راعي" }, supervisor: { en: "Supervisor", ar: "مشرف" },
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();
  const [followListOpen, setFollowListOpen] = useState<"followers" | "following" | null>(null);

  const {
    profile, isLoading, error, qrCode, roles, careerRecords, memberships,
    userAwards, mediaFiles, followStats, isFollowing, toggleFollow,
    followersList, userSpecialties, followPrivacy, pendingRequest,
  } = usePublicProfileData(username, followListOpen);

  // Determine if this profile is a fan account
  const { data: profileAccountType } = useQuery({
    queryKey: ["profile-account-type", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", profile!.user_id)
        .single();
      return data?.account_type || "professional";
    },
    enabled: !!profile?.user_id,
    staleTime: 1000 * 60 * 10,
  });
  const isProfileFan = profileAccountType === "fan";

  const getCountryName = useCallback((code: string | null) => {
    if (!code) return null;
    const c = allCountries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  }, [allCountries, isAr]);

  const pickText = useCallback((ar?: string | null, en?: string | null) => pickLocalizedText(isAr, ar, en), [isAr]);
  const fmtRange = useCallback((s: string | null, e: string | null, c: boolean) => formatPeriodRange(s, e, c, isAr), [isAr]);

  // ── Split career records into categories ──
  const categorizedRecords = useMemo(() => {
    const isJudging = (r: any) => /Role:\s*Judge|Head.?Judge/i.test(r.description || "") || /Role:\s*Judge|Head.?Judge/i.test(r.description_ar || "");
    const isMediaInWork = (r: any) => /^📺|^📻|^🎙️|^📰|^📖|^🌐|TV\b|Radio\b|Podcast\b|interview/i.test(r.description || "");
    const isParticipation = (r: any) => /Role:\s*(Organizer|Participant)/i.test(r.description || "");

    const allWork = careerRecords.filter((r: any) => r.record_type === "work");
    const judging = allWork.filter(isJudging);
    const mediaInWork = allWork.filter((r: any) => !isJudging(r) && isMediaInWork(r));
    const participation = allWork.filter((r: any) => !isJudging(r) && !isMediaInWork(r) && isParticipation(r));
    const work = allWork.filter((r: any) => !isJudging(r) && !isMediaInWork(r) && !isParticipation(r));

    return {
      work,
      judging,
      participation,
      education: careerRecords.filter((r: any) => r.record_type === "education"),
      media: [...careerRecords.filter((r: any) => r.record_type === "media"), ...mediaInWork],
      certification: careerRecords.filter((r: any) => r.record_type === "certification"),
    };
  }, [careerRecords]);

  const isOwnProfile = user?.id === profile?.user_id;
  const visibility = profile?.section_visibility || {};
  const isVisible = useCallback((section: string) => visibility[section] !== false, [visibility]);
  const currentWork = categorizedRecords.work.find((r: any) => r.is_current) || categorizedRecords.work[0];

  // ── LOADING ──
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
            <div className="space-y-4"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
            <Skeleton className="h-52 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── ERROR ──
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
  const bio = pickText(profile.bio_ar, profile.bio);
  const specialization = pickText(profile.specialization_ar, profile.specialization);
  const socialLinks = [
    { key: "instagram", value: profile.instagram, label: "Instagram" },
    { key: "twitter", value: profile.twitter, label: "X / Twitter" },
    { key: "facebook", value: profile.facebook, label: "Facebook" },
    { key: "linkedin", value: profile.linkedin, label: "LinkedIn" },
    { key: "youtube", value: profile.youtube, label: "YouTube" },
    { key: "website", value: profile.website, label: isAr ? "الموقع" : "Website" },
  ].filter(s => s.value);
  const profileUrl = `https://altoha.com/${profile.username}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title={`${displayName} (@${profile.username}) - Altoha`}
        description={bio || `${displayName}'s professional culinary profile on Altoha`}
      />
      <Header />

      {/* HERO */}
      <PublicProfileHero
        profile={profile} displayName={displayName} currentWork={currentWork}
        roles={roles || []} roleLabels={roleLabels} userAwards={userAwards}
        isAr={isAr} isOwnProfile={isOwnProfile} isFollowing={isFollowing}
        pendingRequest={pendingRequest} followPrivacy={followPrivacy}
        toggleFollow={toggleFollow} user={user} getCountryName={getCountryName}
        userSpecialties={userSpecialties}
      />

      {/* STATS */}
      <div className="px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full mt-4">
        <SectionReveal delay={100}>
          <PublicProfileStats
            profile={profile} followStats={followStats} socialLinks={socialLinks}
            isAr={isAr} isVisible={isVisible} onFollowClick={setFollowListOpen}
          />
        </SectionReveal>
      </div>

      {/* MAIN */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full mt-4 sm:mt-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
          {/* LEFT */}
          <div className="space-y-5 min-w-0">
            {/* About */}
            {isVisible("bio") && (
              <SectionReveal delay={150}>
                <CollapsibleProfileSection icon={User} label={isAr ? "نبذة" : "About"} defaultOpen isEmpty={!bio && !specialization}>
                  {(bio || specialization) ? (
                    <PublicProfileAbout profile={profile} bio={bio} specialization={specialization} userSpecialties={userSpecialties} isAr={isAr} />
                  ) : (
                    <PublicProfileEmptySection icon={User} label={isAr ? "نبذة" : "About"} description={isAr ? "لم يتم إضافة نبذة بعد" : "No bio added yet"} isAr={isAr} />
                  )}
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Schedule - pro only */}
            {!isProfileFan && profile.user_id && <SectionReveal delay={200}><PublicProfileSchedule userId={profile.user_id} isAr={isAr} /></SectionReveal>}

            {/* Achievements - pro only */}
            {!isProfileFan && profile.user_id && <SectionReveal delay={225}><PublicProfileAchievements userId={profile.user_id} isAr={isAr} /></SectionReveal>}

            {/* Career Sections - pro only */}
            {!isProfileFan && CAREER_SECTIONS.map((sec, i) => {
              if (!isVisible(sec.visKey)) return null;
              const records = categorizedRecords[sec.key as keyof typeof categorizedRecords] || [];
              if (records.length === 0 && !sec.showEmpty) return null;

              return (
                <SectionReveal key={sec.key} delay={250 + i * 25}>
                  <CollapsibleProfileSection
                    icon={sec.icon}
                    label={isAr ? sec.labelAr : sec.labelEn}
                    count={records.length}
                    defaultOpen={sec.defaultOpen}
                    isEmpty={records.length === 0}
                  >
                    {records.length > 0 ? (
                      <div className="space-y-2.5">
                        {records.map((record: any) => (
                          <CareerRecordCard
                            key={record.id}
                            record={record}
                            icon={sec.icon}
                            iconBg={sec.iconBg}
                            iconColor={sec.iconColor}
                            isAr={isAr}
                            pickText={pickText}
                            formatRange={fmtRange}
                          />
                        ))}
                      </div>
                    ) : (
                      <PublicProfileEmptySection icon={sec.icon} label={isAr ? sec.labelAr : sec.labelEn} description={isAr ? sec.emptyDescAr! : sec.emptyDescEn!} isAr={isAr} />
                    )}
                  </CollapsibleProfileSection>
                </SectionReveal>
              );
            })}

            {/* Memberships - pro only */}
            {!isProfileFan && isVisible("memberships") && (
              <SectionReveal delay={400}>
                <CollapsibleProfileSection icon={Building2} label={isAr ? "العضويات والجهات" : "Memberships & Entities"} count={memberships.length} defaultOpen isEmpty={memberships.length === 0}>
                  {memberships.length > 0 ? (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {memberships.map((m: any) => (
                        <Card key={m.id} className="rounded-2xl border-border/25 hover:shadow-md transition-all duration-300 hover:border-border/40 hover:-translate-y-0.5 group/card">
                          <CardContent className="p-4 flex items-center gap-3">
                            {m.culinary_entities?.logo_url ? (
                              <img src={m.culinary_entities.logo_url} alt="" className="h-10 w-10 rounded-xl object-cover border" loading="lazy" />
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
                    <PublicProfileEmptySection icon={Building2} label={isAr ? "العضويات والجهات" : "Memberships & Entities"} description={isAr ? "لم يتم إضافة عضويات بعد" : "No memberships added yet"} isAr={isAr} />
                  )}
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Certificates - pro only */}
            {!isProfileFan && isVisible("certificates") && (
              <SectionReveal delay={450}>
                <CollapsibleProfileSection icon={Award} label={isAr ? "الشهادات" : "Certificates"} defaultOpen>
                  <ProfileCertificates userId={profile.user_id} isOwner={isOwnProfile} />
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Competitions - pro only */}
            {!isProfileFan && isVisible("competitions") && (
              <SectionReveal delay={475}>
                <CollapsibleProfileSection icon={Trophy} label={isAr ? "المسابقات" : "Competitions"} defaultOpen={false}>
                  <CompetitionHistory userId={profile.user_id} />
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Badges */}
            {isVisible("badges") && (
              <SectionReveal delay={500}>
                <CollapsibleProfileSection icon={Medal} label={isAr ? "الأوسمة" : "Badges"} defaultOpen={false}>
                  <UserBadgesDisplay userId={profile.user_id} />
                </CollapsibleProfileSection>
              </SectionReveal>
            )}

            {/* Gallery */}
            <SectionReveal delay={525}>
              <CollapsibleProfileSection icon={ImageIcon} label={isAr ? "الألبوم" : "Gallery"} count={mediaFiles.length} defaultOpen={mediaFiles.length > 0} isEmpty={mediaFiles.length === 0}>
                {mediaFiles.length > 0 ? (
                  <PublicProfileGallery mediaFiles={mediaFiles} isAr={isAr} />
                ) : (
                  <PublicProfileEmptySection icon={ImageIcon} label={isAr ? "الألبوم" : "Gallery"} description={isAr ? "لم يتم إضافة صور بعد" : "No photos added yet"} isAr={isAr} />
                )}
              </CollapsibleProfileSection>
            </SectionReveal>
          </div>

          {/* RIGHT */}
          <div className="hidden md:block">
            <div className="sticky top-20 space-y-4">
              <SectionReveal delay={200} direction="right">
                <PublicProfileSidebar profile={profile} qrCode={qrCode} isAr={isAr} isVisible={isVisible} getCountryName={getCountryName} profileUrl={profileUrl} t={t} />
              </SectionReveal>
              <SectionReveal delay={300} direction="right">
                <PublicProfilePosts userId={profile.user_id} isOwnProfile={isOwnProfile} />
              </SectionReveal>
              <SectionReveal delay={400} direction="right">
                <ProfileActivityTimeline userId={profile.user_id} />
              </SectionReveal>
            </div>
          </div>
          <div className="md:hidden">
            <PublicProfileSidebar profile={profile} qrCode={qrCode} isAr={isAr} isVisible={isVisible} getCountryName={getCountryName} profileUrl={profileUrl} t={t} />
          </div>
        </div>
      </main>

      {/* Follow List Dialog */}
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
