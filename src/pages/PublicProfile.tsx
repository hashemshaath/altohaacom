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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CompetitionHistory } from "@/components/profile/CompetitionHistory";
import { MessageButton } from "@/components/profile/MessageButton";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { ProfileCertificates } from "@/components/profile/ProfileCertificates";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { SEOHead } from "@/components/SEOHead";
import { ProfileShareButtons } from "@/components/profile/ProfileShareButtons";
import { useFollowStats, useIsFollowing, useToggleFollow, useFollowersList, useFollowPrivacy, usePendingFollowRequest } from "@/hooks/useFollow";
import { useUserSpecialties } from "@/hooks/useSpecialties";
import { useRecordProfileView } from "@/hooks/useProfileViews";
import {
  User, MapPin, Globe, Award, BadgeCheck, Instagram, Twitter, Facebook,
  Linkedin, Youtube, ChefHat, ArrowLeft, Calendar, Earth, UserPlus,
  UserMinus, Loader2, Users, Briefcase, GraduationCap, Building2,
  Mail, Phone, ExternalLink, Trophy, Medal, ImageIcon, Eye, Clock, Lock,
} from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  linkedin: Linkedin, youtube: Youtube, website: Globe,
};

const formatDate = (date: string | null, isAr: boolean) => {
  if (!date) return isAr ? "الحالي" : "Present";
  return new Date(date).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" });
};

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

  // ── Profile Query ──
  const { data: profile, isLoading, error, refetch: refetchProfile } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username?.toLowerCase())
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Profile not found");
      return data as Profile & { section_visibility?: Record<string, boolean>; offers_services?: boolean; services_description?: string; services_description_ar?: string };
    },
    enabled: !!username,
  });

  // Record profile view (trigger auto-increments view_count, hook invalidates query)
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
        .eq("user_id", profile!.user_id)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: userAwards = [] } = useQuery({
    queryKey: ["public-user-awards", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_global_awards")
        .select("*, global_awards_system(*)")
        .eq("user_id", profile!.user_id)
        .eq("is_public", true);
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
  const visibility = (profile as any)?.section_visibility || {};
  const isVisible = (section: string) => visibility[section] !== false;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="relative h-56 md:h-72 bg-gradient-to-br from-primary/20 via-primary/5 to-secondary animate-pulse" />
        <main className="container flex-1 -mt-20 pb-8 max-w-5xl">
          <Skeleton className="h-32 rounded-2xl mb-4" />
          <Skeleton className="h-64 rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <div className="rounded-2xl bg-muted/60 p-5">
            <User className="h-10 w-10 text-muted-foreground/40" />
          </div>
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
    ? ((profile as any).display_name_ar || (profile as any).full_name_ar || (profile as any).display_name || profile.full_name || "طاهٍ")
    : ((profile as any).display_name || profile.full_name || (profile as any).display_name_ar || (profile as any).full_name_ar || "Chef");
  const bio = isAr ? ((profile as any).bio_ar || profile.bio) : (profile.bio || (profile as any).bio_ar);
  const specialization = isAr ? ((profile as any).specialization_ar || profile.specialization) : (profile.specialization || (profile as any).specialization_ar);

  const socialLinks = [
    { key: "instagram", value: profile.instagram, label: "Instagram" },
    { key: "twitter", value: profile.twitter, label: "X / Twitter" },
    { key: "facebook", value: profile.facebook, label: "Facebook" },
    { key: "linkedin", value: profile.linkedin, label: "LinkedIn" },
    { key: "youtube", value: profile.youtube, label: "YouTube" },
    { key: "website", value: profile.website, label: isAr ? "الموقع" : "Website" },
  ].filter(s => s.value);

  const educationRecords = careerRecords.filter(r => r.record_type === "education");
  const workRecords = careerRecords.filter(r => r.record_type === "work");
  const currentWork = workRecords.find(r => r.is_current) || workRecords[0];

  const roleLabels: Record<string, { en: string; ar: string }> = {
    chef: { en: "Chef", ar: "طاهٍ" }, judge: { en: "Judge", ar: "حكم" },
    organizer: { en: "Organizer", ar: "منظم" }, student: { en: "Student", ar: "طالب" },
    sponsor: { en: "Sponsor", ar: "راعي" }, supervisor: { en: "Supervisor", ar: "مشرف" },
  };

  const profileUrl = `https://altohaacom.lovable.app/${profile.username}`;

  return (
    <div className="flex min-h-screen flex-col" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={`${displayName} (@${profile.username}) - Altohaa`}
        description={bio || `${displayName}'s professional culinary profile on Altohaa`}
      />
      <Header />

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative overflow-hidden">
        {/* Cover Image */}
        <div className="h-60 md:h-80 relative overflow-hidden">
          {(profile as any).cover_image_url ? (
            <img src={(profile as any).cover_image_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-chart-3/10">
              <div className="absolute top-10 start-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-pulse" />
              <div className="absolute bottom-4 end-1/3 h-48 w-48 rounded-full bg-chart-3/10 blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
        </div>

        {/* Profile Card overlapping cover */}
        <div className="relative z-10 -mt-20 md:-mt-24 px-3 sm:px-4 md:px-6 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/40 shadow-2xl rounded-[2.5rem] backdrop-blur-xl bg-card/80 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <CardContent className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10" dir={isAr ? "rtl" : "ltr"}>
                {/* Avatar */}
                <div className="-mt-24 md:-mt-32 shrink-0 relative group">
                  <div className="h-36 w-32 md:h-48 md:w-44 ring-8 ring-background/50 shadow-2xl rounded-[2rem] overflow-hidden border-2 border-border transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-6xl font-bold font-serif italic">
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  {profile.is_verified && (
                    <div className="absolute -bottom-2 -end-2 bg-primary text-white p-1.5 rounded-xl shadow-xl ring-4 ring-background animate-bounce-subtle">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Info Column */}
                <div className="flex-1 min-w-0 text-center md:text-start space-y-3 pb-1">
                  {/* Name + Verification + Awards */}
                  <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                    <h1 className="font-serif text-2xl md:text-4xl font-bold text-foreground tracking-tight">{displayName}</h1>
                    {profile.is_verified && <BadgeCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" />}
                    {userAwards?.map((ua: any) => {
                      const award = ua.global_awards_system;
                      if (!award?.logo_url) return null;
                      return (
                        <Tooltip key={ua.id}>
                          <TooltipTrigger asChild>
                            <img src={award.logo_url} alt={isAr ? (award.name_ar || award.name) : award.name}
                              className="h-6 w-6 object-contain cursor-pointer hover:scale-110 transition-transform" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <p className="font-semibold">{isAr ? (award.name_ar || award.name) : award.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  <p className="text-sm text-muted-foreground">@{profile.username}</p>

                  {/* Current Position - Prominent */}
                  {currentWork && (
                    <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-4 py-2.5">
                      <Briefcase className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold">{isAr ? (currentWork.title_ar || currentWork.title) : currentWork.title}</span>
                      {currentWork.entity_name && (
                        <span className="text-xs text-muted-foreground">{isAr ? "في" : "at"} {currentWork.entity_name}</span>
                      )}
                    </div>
                  )}

                  {/* Location */}
                  {(profile.country_code || profile.location) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {profile.country_code ? `${countryFlag(profile.country_code)} ` : ""}
                      {[(profile as any).city, getCountryName(profile.country_code)].filter(Boolean).join(", ") || profile.location}
                    </p>
                  )}

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                    {roles?.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">{isAr ? roleLabels[role]?.ar || role : roleLabels[role]?.en || role}</Badge>
                    ))}
                    {profile.membership_tier && profile.membership_tier !== "basic" && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        {profile.membership_tier === "professional" ? (isAr ? "محترف" : "Pro") : profile.membership_tier}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Column */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                {user && !isOwnProfile && followPrivacy !== "private" && (
                    <Button
                      variant={isFollowing ? "outline" : pendingRequest ? "secondary" : "default"}
                      size="sm"
                      onClick={() => {
                        if (pendingRequest) return;
                        toggleFollow.mutate(!!isFollowing);
                      }}
                      disabled={toggleFollow.isPending || !!pendingRequest || isFollowing === undefined}
                      className="w-full"
                    >
                      {toggleFollow.isPending ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> :
                        isFollowing ? <UserMinus className="me-1.5 h-3.5 w-3.5" /> :
                        pendingRequest ? <Clock className="me-1.5 h-3.5 w-3.5" /> :
                        <UserPlus className="me-1.5 h-3.5 w-3.5" />}
                      {isFollowing ? (isAr ? "إلغاء" : "Unfollow") :
                       pendingRequest ? (isAr ? "في الانتظار" : "Pending") :
                       (isAr ? "متابعة" : "Follow")}
                    </Button>
                  )}
                  {user && !isOwnProfile && followPrivacy === "private" && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      {isAr ? "حساب خاص" : "Private Account"}
                    </Badge>
                  )}
                  <div className="flex gap-2">
                    <MessageButton userId={profile.user_id} variant="outline" />
                    <ProfileShareButtons username={profile.username || ""} displayName={displayName} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <div className="px-3 sm:px-4 md:px-6 max-w-5xl mx-auto w-full mt-4">
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-4" dir={isAr ? "rtl" : "ltr"}>
              <div className="flex gap-8">
                <button onClick={() => setFollowListOpen("followers")} className="flex flex-col items-center hover:text-primary transition-colors">
                  <span className="text-xl font-bold">{followStats?.followers || 0}</span>
                  <span className="text-[11px] text-muted-foreground">{isAr ? "متابعون" : "Followers"}</span>
                </button>
                <button onClick={() => setFollowListOpen("following")} className="flex flex-col items-center hover:text-primary transition-colors">
                  <span className="text-xl font-bold">{followStats?.following || 0}</span>
                  <span className="text-[11px] text-muted-foreground">{isAr ? "يتابع" : "Following"}</span>
                </button>
                {(profile as any).years_of_experience != null && (profile as any).years_of_experience > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold">{(profile as any).years_of_experience}+</span>
                    <span className="text-[11px] text-muted-foreground">{isAr ? "سنوات خبرة" : "Years Exp."}</span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{(profile as any).view_count || 0}</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{isAr ? "زيارة" : "Views"}</span>
                </div>
              </div>

              {/* Social Links */}
              {isVisible("social") && socialLinks.length > 0 && (
                <div className="flex gap-1">
                  {socialLinks.map((link) => {
                    const Icon = SOCIAL_ICONS[link.key] || Globe;
                    return (
                      <Button key={link.key} variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                        <a href={link.value?.startsWith("http") ? link.value : `https://${link.value}`} target="_blank" rel="noopener noreferrer" title={link.label}>
                          <Icon className="h-4 w-4" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <main className="flex-1 px-3 sm:px-4 md:px-6 max-w-5xl mx-auto w-full mt-6 pb-10">
        <div className="space-y-8">

          {/* ── ABOUT SECTION ── */}
          {isVisible("bio") && (bio || specialization) && (
            <section>
              <SectionTitle icon={User} label={isAr ? "نبذة" : "About"} isAr={isAr} />
              <Card className="rounded-2xl">
                <CardContent className="p-6 space-y-4" dir={isAr ? "rtl" : "ltr"}>
                  {bio && <p className="text-sm leading-relaxed whitespace-pre-line">{bio}</p>}
                  {specialization && (
                    <>
                      {bio && <Separator />}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                          <ChefHat className="h-3.5 w-3.5 text-primary" />
                          {isAr ? "التخصص" : "Specialization"}
                        </h4>
                        <p className="text-sm font-medium mb-2">{specialization}</p>
                        {userSpecialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {userSpecialties.map((us: any) => (
                              <Badge key={us.id} variant="secondary" className="text-xs">
                                {isAr ? us.specialties?.name_ar || us.specialties?.name : us.specialties?.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {/* Services */}
                  {(profile as any).offers_services && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-4 border border-primary/10">
                        <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold">{isAr ? "متاح للعمل والخدمات" : "Available for Services"}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isAr ? ((profile as any).services_description_ar || (profile as any).services_description || "متاح للعمل")
                              : ((profile as any).services_description || "Available for hire")}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* ── EXPERIENCE SECTION ── */}
          {isVisible("career") && workRecords.length > 0 && (
            <section>
              <SectionTitle icon={Briefcase} label={isAr ? "الخبرة المهنية" : "Professional Experience"} isAr={isAr} />
              <div className="space-y-3">
                {workRecords.map((record) => (
                  <Card key={record.id} className="rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-5" dir={isAr ? "rtl" : "ltr"}>
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-chart-3/10 mt-0.5">
                          <Briefcase className="h-5 w-5 text-chart-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm">{isAr ? (record.title_ar || record.title) : record.title}</h4>
                            {record.is_current && (
                              <Badge className="bg-chart-3/10 text-chart-3 text-[10px] h-5">{isAr ? "حالي" : "Current"}</Badge>
                            )}
                          </div>
                          {record.entity_name && (
                            record.entity_id ? (
                              <Link to={`/entities/${record.entity_id}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                {record.entity_name}<ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <p className="text-sm text-muted-foreground font-medium mt-0.5">{record.entity_name}</p>
                            )
                          )}
                          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(record.start_date, isAr)} – {formatDate(record.end_date, isAr)}</span>
                            {record.employment_type && <Badge variant="outline" className="text-[10px] h-5">{record.employment_type}</Badge>}
                            {record.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{record.location}</span>}
                          </div>
                          {(record.description || record.description_ar) && (
                            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                              {isAr ? (record.description_ar || record.description) : (record.description || record.description_ar)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ── EDUCATION SECTION ── */}
          {isVisible("education") && educationRecords.length > 0 && (
            <section>
              <SectionTitle icon={GraduationCap} label={isAr ? "التعليم" : "Education"} isAr={isAr} />
              <div className="space-y-3">
                {educationRecords.map((record) => (
                  <Card key={record.id} className="rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-5" dir={isAr ? "rtl" : "ltr"}>
                      <div className="flex gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-chart-2/10 mt-0.5">
                          <GraduationCap className="h-5 w-5 text-chart-2" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{isAr ? (record.title_ar || record.title) : record.title}</h4>
                          {record.entity_name && (
                            record.entity_id ? (
                              <Link to={`/entities/${record.entity_id}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1 mt-0.5">
                                {record.entity_name}<ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-0.5">{record.entity_name}</p>
                            )
                          )}
                          <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(record.start_date, isAr)} – {formatDate(record.end_date, isAr)}</span>
                            {record.education_level && <Badge variant="outline" className="text-[10px] h-5">{record.education_level}</Badge>}
                            {record.field_of_study && <span>{isAr ? (record.field_of_study_ar || record.field_of_study) : record.field_of_study}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ── MEMBERSHIPS SECTION ── */}
          {isVisible("memberships") && memberships.length > 0 && (
            <section>
              <SectionTitle icon={Building2} label={isAr ? "العضويات والجهات" : "Memberships & Entities"} isAr={isAr} />
              <div className="grid gap-3 sm:grid-cols-2">
                {memberships.map((m: any) => (
                  <Card key={m.id} className="rounded-2xl hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center gap-4" dir={isAr ? "rtl" : "ltr"}>
                      {m.culinary_entities?.logo_url ? (
                        <img src={m.culinary_entities.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover border" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : (m.culinary_entities?.name || m.culinary_entities?.name_ar)}
                        </h4>
                        {m.title && <p className="text-xs text-muted-foreground truncate">{isAr ? (m.title_ar || m.title) : m.title}</p>}
                        <div className="mt-1 flex gap-1.5">
                          <Badge variant="outline" className="text-[10px]">{m.membership_type}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* ── CERTIFICATES SECTION ── */}
          {isVisible("certificates") && (
            <section>
              <SectionTitle icon={Award} label={isAr ? "الشهادات" : "Certificates"} isAr={isAr} />
              <ProfileCertificates userId={profile.user_id} isOwner={isOwnProfile} />
            </section>
          )}

          {/* ── COMPETITIONS SECTION ── */}
          {isVisible("competitions") && (
            <section>
              <SectionTitle icon={Trophy} label={isAr ? "المسابقات" : "Competitions"} isAr={isAr} />
              <CompetitionHistory userId={profile.user_id} />
            </section>
          )}

          {/* ── BADGES SECTION ── */}
          {isVisible("badges") && (
            <section>
              <SectionTitle icon={Medal} label={isAr ? "الأوسمة" : "Badges"} isAr={isAr} />
              <UserBadgesDisplay userId={profile.user_id} />
            </section>
          )}

          {/* ── GALLERY SECTION ── */}
          {mediaFiles.length > 0 && (
            <section>
              <SectionTitle icon={ImageIcon} label={isAr ? "الألبوم" : "Gallery"} isAr={isAr} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mediaFiles.map((file) => (
                  <button key={file.name} onClick={() => setLightboxImg(file.url)}
                    className="aspect-square rounded-2xl overflow-hidden border bg-muted hover:opacity-90 transition-opacity hover:shadow-md">
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── QR CODE & CONTACT ── */}
          <div className="grid md:grid-cols-2 gap-4">
            {qrCode && (
              <Card className="rounded-2xl">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <QRCodeDisplay
                    code={qrCode.code}
                    label={isAr ? "رمز QR" : "QR Code"}
                    size={140}
                    vCardData={{
                      fullName: profile.full_name || "Unknown",
                      phone: profile.phone || undefined,
                      website: profile.website || undefined,
                      location: profile.location || undefined,
                      accountNumber: profile.account_number || undefined,
                      profileUrl,
                    }}
                  />
                </CardContent>
              </Card>
            )}
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {isAr ? "التواصل" : "Contact"}
                </h3>
                {isVisible("contact") && profile.email && (
                  <Button variant="outline" size="sm" className="w-full gap-2 justify-start" asChild>
                    <a href={`mailto:${profile.email}`}><Mail className="h-3.5 w-3.5" />{profile.email}</a>
                  </Button>
                )}
                {isVisible("contact") && profile.website && (
                  <Button variant="outline" size="sm" className="w-full gap-2 justify-start" asChild>
                    <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3.5 w-3.5" />{profile.website}
                    </a>
                  </Button>
                )}
                {profile.nationality && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Earth className="h-4 w-4" />
                    {countryFlag(profile.nationality)} {getCountryName(profile.nationality)}
                    <span className="text-[10px]">({isAr ? "الجنسية" : "Nationality"})</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t("memberSince")}: {new Date(profile.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long" })}
                </div>
                {profile.account_number && (
                  <Badge variant="outline" className="font-mono text-[10px]">{profile.account_number}</Badge>
                )}
              </CardContent>
            </Card>
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

// ── Section Title Helper ──
function SectionTitle({ icon: Icon, label, isAr }: { icon: any; label: string; isAr: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <h2 className="font-serif text-lg font-bold">{label}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
