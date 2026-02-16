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
  ExternalLink, Trophy, Medal, ImageIcon, MapPin, Globe,
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

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

const formatDate = (date: string | null, isAr: boolean) => {
  if (!date) return isAr ? "الحالي" : "Present";
  return toEnglishDigits(new Date(date).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }));
};

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="font-serif text-base font-bold">{label}</h2>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const { data: allCountries = [] } = useAllCountries();
  const [followListOpen, setFollowListOpen] = useState<"followers" | "following" | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const getCountryName = (code: string | null) => {
    if (!code) return null;
    const c = allCountries.find((ct) => ct.code === code);
    return c ? (isAr ? c.name_ar || c.name : c.name) : code;
  };

  const { data: profile, isLoading, error, refetch: refetchProfile } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("username", username?.toLowerCase()).maybeSingle();
      if (error) throw error;
      if (data) return data as any;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username || "");
      if (isUuid) {
        const { data: byId, error: err2 } = await supabase.from("profiles").select("*").eq("user_id", username).maybeSingle();
        if (err2) throw err2;
        if (byId) return byId as any;
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
        <div className="h-52 sm:h-64 md:h-80 bg-gradient-to-br from-primary/20 via-primary/5 to-secondary animate-pulse" />
        <main className="px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full -mt-20 pb-8">
          <Skeleton className="h-36 rounded-2xl mb-4" />
          <div className="grid md:grid-cols-[1fr_300px] gap-4 mt-4">
            <div className="space-y-4">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
            <Skeleton className="h-64 rounded-2xl" />
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
  const bio = isAr ? (profile.bio_ar || profile.bio) : (profile.bio || profile.bio_ar);
  const specialization = isAr ? (profile.specialization_ar || profile.specialization) : (profile.specialization || profile.specialization_ar);

  const socialLinks = [
    { key: "instagram", value: profile.instagram, label: "Instagram" },
    { key: "twitter", value: profile.twitter, label: "X / Twitter" },
    { key: "facebook", value: profile.facebook, label: "Facebook" },
    { key: "linkedin", value: profile.linkedin, label: "LinkedIn" },
    { key: "youtube", value: profile.youtube, label: "YouTube" },
    { key: "website", value: profile.website, label: isAr ? "الموقع" : "Website" },
  ].filter(s => s.value);

  const educationRecords = careerRecords.filter((r: any) => r.record_type === "education");
  const workRecords = careerRecords.filter((r: any) => r.record_type === "work");
  const currentWork = workRecords.find((r: any) => r.is_current) || workRecords[0];

  const roleLabels: Record<string, { en: string; ar: string }> = {
    chef: { en: "Chef", ar: "طاهٍ" }, judge: { en: "Judge", ar: "حكم" },
    organizer: { en: "Organizer", ar: "منظم" }, student: { en: "Student", ar: "طالب" },
    sponsor: { en: "Sponsor", ar: "راعي" }, supervisor: { en: "Supervisor", ar: "مشرف" },
  };

  const profileUrl = `https://altohaacom.lovable.app/${profile.username}`;

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={`${displayName} (@${profile.username}) - Altohaa`}
        description={bio || `${displayName}'s professional culinary profile on Altohaa`}
      />
      <Header />

      {/* ═══ HERO ═══ */}
      <PublicProfileHero
        profile={profile} displayName={displayName} currentWork={currentWork}
        roles={roles || []} roleLabels={roleLabels} userAwards={userAwards}
        isAr={isAr} isOwnProfile={isOwnProfile} isFollowing={isFollowing}
        pendingRequest={pendingRequest} followPrivacy={followPrivacy}
        toggleFollow={toggleFollow} user={user} getCountryName={getCountryName}
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
      <main className="flex-1 px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full mt-6 pb-10">
        <div className="grid md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-6">
          {/* ── LEFT COLUMN (Main Content) ── */}
          <div className="space-y-6 min-w-0">
            {/* About */}
            {isVisible("bio") && (bio || specialization) && (
              <SectionReveal delay={150}>
                <SectionTitle icon={User} label={isAr ? "نبذة" : "About"} />
                <PublicProfileAbout
                  profile={profile} bio={bio} specialization={specialization}
                  userSpecialties={userSpecialties} isAr={isAr}
                />
              </SectionReveal>
            )}

            {/* Schedule */}
            {profile.user_id && (
              <SectionReveal delay={200}>
                <PublicProfileSchedule userId={profile.user_id} isAr={isAr} />
              </SectionReveal>
            )}

            {/* Experience */}
            {isVisible("career") && workRecords.length > 0 && (
              <SectionReveal delay={250}>
                <SectionTitle icon={Briefcase} label={isAr ? "الخبرة المهنية" : "Professional Experience"} />
                <div className="space-y-2.5">
                  {workRecords.map((record: any) => (
                    <Card key={record.id} className="rounded-2xl border-border/40 hover:shadow-md transition-shadow">
                      <CardContent className="p-4" dir={isAr ? "rtl" : "ltr"}>
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10">
                            <Briefcase className="h-4 w-4 text-chart-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{isAr ? (record.title_ar || record.title) : record.title}</h4>
                              {record.is_current && <Badge className="bg-chart-3/10 text-chart-3 text-[10px] h-5">{isAr ? "حالي" : "Current"}</Badge>}
                            </div>
                            {record.entity_name && (
                              record.entity_id ? (
                                <Link to={`/entities/${record.entity_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                  {record.entity_name}<ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              ) : <p className="text-xs text-muted-foreground mt-0.5">{record.entity_name}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatDate(record.start_date, isAr)} – {formatDate(record.end_date, isAr)}</span>
                              {record.employment_type && <Badge variant="outline" className="text-[9px] h-4">{record.employment_type}</Badge>}
                              {record.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{record.location}</span>}
                            </div>
                            {(record.description || record.description_ar) && (
                              <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                                {isAr ? (record.description_ar || record.description) : (record.description || record.description_ar)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </SectionReveal>
            )}

            {/* Education */}
            {isVisible("education") && educationRecords.length > 0 && (
              <SectionReveal delay={300}>
                <SectionTitle icon={GraduationCap} label={isAr ? "التعليم" : "Education"} />
                <div className="space-y-2.5">
                  {educationRecords.map((record: any) => (
                    <Card key={record.id} className="rounded-2xl border-border/40 hover:shadow-md transition-shadow">
                      <CardContent className="p-4" dir={isAr ? "rtl" : "ltr"}>
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/10">
                            <GraduationCap className="h-4 w-4 text-chart-2" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">{isAr ? (record.title_ar || record.title) : record.title}</h4>
                            {record.entity_name && (
                              record.entity_id ? (
                                <Link to={`/entities/${record.entity_id}`} className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                  {record.entity_name}<ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              ) : <p className="text-xs text-muted-foreground mt-0.5">{record.entity_name}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatDate(record.start_date, isAr)} – {formatDate(record.end_date, isAr)}</span>
                              {record.education_level && <Badge variant="outline" className="text-[9px] h-4">{record.education_level}</Badge>}
                              {record.field_of_study && <span>{isAr ? (record.field_of_study_ar || record.field_of_study) : record.field_of_study}</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </SectionReveal>
            )}

            {/* Memberships */}
            {isVisible("memberships") && memberships.length > 0 && (
              <SectionReveal delay={350}>
                <SectionTitle icon={Building2} label={isAr ? "العضويات والجهات" : "Memberships & Entities"} />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {memberships.map((m: any) => (
                    <Card key={m.id} className="rounded-2xl border-border/40 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex items-center gap-3" dir={isAr ? "rtl" : "ltr"}>
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
              </SectionReveal>
            )}

            {/* Certificates */}
            {isVisible("certificates") && (
              <SectionReveal delay={400}>
                <SectionTitle icon={Award} label={isAr ? "الشهادات" : "Certificates"} />
                <ProfileCertificates userId={profile.user_id} isOwner={isOwnProfile} />
              </SectionReveal>
            )}

            {/* Competitions */}
            {isVisible("competitions") && (
              <SectionReveal delay={450}>
                <SectionTitle icon={Trophy} label={isAr ? "المسابقات" : "Competitions"} />
                <CompetitionHistory userId={profile.user_id} />
              </SectionReveal>
            )}

            {/* Badges */}
            {isVisible("badges") && (
              <SectionReveal delay={500}>
                <SectionTitle icon={Medal} label={isAr ? "الأوسمة" : "Badges"} />
                <UserBadgesDisplay userId={profile.user_id} />
              </SectionReveal>
            )}

            {/* Gallery */}
            {mediaFiles.length > 0 && (
              <SectionReveal delay={550}>
                <SectionTitle icon={ImageIcon} label={isAr ? "الألبوم" : "Gallery"} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {mediaFiles.map((file) => (
                    <button key={file.name} onClick={() => setLightboxImg(file.url)}
                      className="aspect-square rounded-xl overflow-hidden border border-border/40 bg-muted hover:opacity-90 transition-opacity hover:shadow-md">
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </SectionReveal>
            )}
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

      {/* ── Image Lightbox ── */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightboxImg && <img src={lightboxImg} alt="Gallery" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>

      {/* ── Follow List Dialog ── */}
      <Dialog open={!!followListOpen} onOpenChange={() => setFollowListOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{followListOpen === "followers" ? (isAr ? "المتابعون" : "Followers") : (isAr ? "يتابع" : "Following")}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {followersList.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{isAr ? "لا يوجد" : "No users yet"}</p>
              ) : (
                followersList.map((p: any) => (
                  <Link key={p.user_id} to={`/${p.username}`} onClick={() => setFollowListOpen(null)}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback>{(p.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">{p.display_name || p.full_name || "Unknown"}</p>
                        {p.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
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
