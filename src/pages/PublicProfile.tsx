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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CompetitionHistory } from "@/components/profile/CompetitionHistory";
import { MessageButton } from "@/components/profile/MessageButton";
import { UserBadgesDisplay } from "@/components/badges/UserBadgesDisplay";
import { ProfileCertificates } from "@/components/profile/ProfileCertificates";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useEntityQRCode } from "@/hooks/useQRCode";
import { SEOHead } from "@/components/SEOHead";
import { useFollowStats, useIsFollowing, useToggleFollow, useFollowersList } from "@/hooks/useFollow";
import { useUserSpecialties } from "@/hooks/useSpecialties";
  import {
    User, MapPin, Globe, Award, BadgeCheck, Instagram, Twitter, Facebook,
    Linkedin, Youtube, ChefHat, ArrowLeft, Calendar, Earth, UserPlus,
    UserMinus, Loader2, Users, Briefcase, GraduationCap, Building2,
    Mail, Phone, ExternalLink, Trophy, Medal, ImageIcon,
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
  const { data: profile, isLoading, error } = useQuery({
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

  const { data: qrCode } = useEntityQRCode("user", profile?.username || undefined, "account");
  const { data: roles } = useQuery({
    queryKey: ["publicProfileRoles", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", profile!.user_id);
      return data?.map(r => r.role) as AppRole[] || [];
    },
    enabled: !!profile?.user_id,
  });

  // ── Career Records ──
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

  // ── Entity Memberships ──
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

  // ── System Awards ──
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

  // ── Follow System ──
  const { data: followStats } = useFollowStats(profile?.user_id);
  const { data: isFollowing } = useIsFollowing(profile?.user_id);
  const toggleFollow = useToggleFollow(profile?.user_id);
  const { data: followersList = [] } = useFollowersList(followListOpen ? profile?.user_id : undefined, followListOpen || "followers");
  const { data: userSpecialties = [] } = useUserSpecialties(profile?.user_id);

  // ── Media Gallery ──
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
        <Skeleton className="h-48 w-full" />
        <main className="container flex-1 -mt-16 pb-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-xl" />
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
          </div>
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
    chef: { en: "Chef", ar: "طاهٍ" },
    judge: { en: "Judge", ar: "حكم" },
    organizer: { en: "Organizer", ar: "منظم" },
    student: { en: "Student", ar: "طالب" },
    sponsor: { en: "Sponsor", ar: "راعي" },
    supervisor: { en: "Supervisor", ar: "مشرف" },
  };

  return (
    <div className="flex min-h-screen flex-col" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead
        title={`${displayName} (@${profile.username}) - Profile`}
        description={bio || `${displayName}'s professional culinary profile on Altohaa`}
      />
      <Header />

      {/* ── Cover Photo ── */}
      <div className="relative h-44 md:h-56 overflow-hidden">
        {(profile as any).cover_image_url ? (
          <img src={(profile as any).cover_image_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary">
            <div className="absolute top-8 start-1/4 h-32 w-32 rounded-full bg-primary/15 blur-[60px]" />
            <div className="absolute bottom-4 end-1/3 h-24 w-24 rounded-full bg-primary/10 blur-[50px]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <main className="flex-1 -mt-20 pb-10 relative z-10 px-3 md:px-6 lg:px-10 max-w-3xl mx-auto w-full">
        {/* ── Hero Profile Card ── */}
        <Card className="mb-4 overflow-visible border shadow-lg rounded-2xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-7" dir={isAr ? "rtl" : "ltr"}>
              {/* Avatar */}
              <div className="-mt-20 md:-mt-24 shrink-0">
                <div className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-background shadow-xl rounded-2xl overflow-hidden border-2 border-border">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-primary text-4xl font-bold">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center md:text-start space-y-3 pt-0 md:pt-2">
                {/* Name + Verification + Awards */}
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
                  {profile.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                  {userAwards && userAwards.length > 0 && userAwards.map((userAward: any) => {
                    const award = userAward.global_awards_system;
                    if (!award || !award.logo_url) return null;
                    const awardName = isAr ? (award.name_ar || award.name) : award.name;
                    return (
                      <Tooltip key={userAward.id}>
                        <TooltipTrigger asChild>
                          <img
                            src={award.logo_url}
                            alt={awardName}
                            className="h-6 w-6 object-contain cursor-pointer hover:scale-110 transition-transform duration-200"
                          />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p className="font-semibold">{awardName}</p>
                          {userAward.level && <p className="text-muted-foreground">{userAward.level}</p>}
                          {userAward.year_awarded && <p className="text-muted-foreground">{userAward.year_awarded}</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Username */}
                <p className="text-sm text-muted-foreground">@{profile.username}</p>

                {/* Job Title pill */}
                {currentWork && (
                  <div className="inline-flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border">
                    {memberships.find((m: any) => m.culinary_entities?.name === currentWork.entity_name)?.culinary_entities?.logo_url && (
                      <img
                        src={(memberships.find((m: any) => m.culinary_entities?.name === currentWork.entity_name) as any)?.culinary_entities?.logo_url}
                        alt=""
                        className="h-5 w-5 rounded object-cover"
                      />
                    )}
                    <span className="text-sm font-semibold text-foreground">
                      {isAr ? (currentWork.title_ar || currentWork.title) : currentWork.title}
                    </span>
                    {currentWork.entity_name && (
                      <span className="text-muted-foreground text-xs">
                        {isAr ? "في" : "at"} {currentWork.entity_name}
                      </span>
                    )}
                  </div>
                )}

                {/* Location */}
                {(profile.country_code || (profile as any).city || profile.location) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {profile.country_code ? `${countryFlag(profile.country_code)} ` : ""}
                    {[(profile as any).city, getCountryName(profile.country_code)].filter(Boolean).join(", ") || profile.location}
                  </p>
                )}

                {/* Roles */}
                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {roles?.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {isAr ? roleLabels[role]?.ar || role : roleLabels[role]?.en || role}
                    </Badge>
                  ))}
                  {profile.membership_tier && profile.membership_tier !== "basic" && (
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      {profile.membership_tier === "professional" ? (isAr ? "محترف" : "Professional") : profile.membership_tier}
                    </Badge>
                  )}
                  {profile.account_number && (
                    <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                      {profile.account_number}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                  {user && !isOwnProfile && (
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleFollow.mutate(!!isFollowing)}
                      disabled={toggleFollow.isPending}
                    >
                      {toggleFollow.isPending ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> :
                        isFollowing ? <UserMinus className="me-1.5 h-3.5 w-3.5" /> : <UserPlus className="me-1.5 h-3.5 w-3.5" />}
                      {isFollowing ? (isAr ? "إلغاء المتابعة" : "Unfollow") : (isAr ? "متابعة" : "Follow")}
                    </Button>
                  )}
                  <MessageButton userId={profile.user_id} variant="outline" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Follow Stats Bar ── */}
        <Card className="mb-4 rounded-2xl">
          <CardContent className="flex items-center justify-between p-4 gap-4 flex-wrap" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex gap-6">
              <button onClick={() => setFollowListOpen("followers")} className="flex flex-col items-center hover:text-primary transition-colors">
                <span className="text-xl font-bold">{followStats?.followers || 0}</span>
                <span className="text-[11px] text-muted-foreground">{isAr ? "متابعون" : "Followers"}</span>
              </button>
              <button onClick={() => setFollowListOpen("following")} className="flex flex-col items-center hover:text-primary transition-colors">
                <span className="text-xl font-bold">{followStats?.following || 0}</span>
                <span className="text-[11px] text-muted-foreground">{isAr ? "يتابع" : "Following"}</span>
              </button>
              {(profile as any).years_of_experience && (
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{(profile as any).years_of_experience}+</span>
                  <span className="text-[11px] text-muted-foreground">{isAr ? "سنوات خبرة" : "Years Exp."}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {isVisible("social") && socialLinks.length > 0 && (
              <div className="flex gap-1.5">
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

            {/* Contact Info */}
            <div className="flex gap-2">
              {isVisible("contact") && profile.email && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={`mailto:${profile.email}`}><Mail className="h-3.5 w-3.5" />{isAr ? "بريد" : "Email"}</a>
                </Button>
              )}
              {isVisible("contact") && profile.website && (
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />{isAr ? "الموقع" : "Website"}
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {/* ── Main Content Grid ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── Left Sidebar ── */}
          <div className="space-y-5" dir={isAr ? "rtl" : "ltr"}>
            {/* Bio & Specialization Combined */}
            {isVisible("bio") && (bio || specialization) && (
              <Card>
                <CardContent className="p-5 space-y-4" dir={isAr ? "rtl" : "ltr"}>
                  {bio && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        {isAr ? "نبذة" : "About"}
                      </h3>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{bio}</p>
                    </div>
                  )}
                  {specialization && (
                    <>
                      {bio && <Separator />}
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <ChefHat className="h-4 w-4 text-primary" />
                          {isAr ? "التخصص" : "Specialization"}
                        </h3>
                        <p className="text-sm font-medium text-foreground mb-2">{specialization}</p>
                        {userSpecialties.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {userSpecialties.map((us: any) => (
                              <Badge key={us.id} variant="secondary" className="text-xs">
                                {isAr ? us.specialties?.name_ar || us.specialties?.name : us.specialties?.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {profile.experience_level && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Award className="h-3.5 w-3.5" />
                            <span className="capitalize">{t(profile.experience_level as any)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Nationality */}
            {profile.nationality && profile.nationality !== profile.country_code && (
              <Card>
                <CardContent className="p-5 flex items-center gap-2.5 text-sm">
                  <Earth className="h-4 w-4 text-muted-foreground" />
                  <span>{countryFlag(profile.nationality)} {getCountryName(profile.nationality)}</span>
                  <span className="text-[10px] text-muted-foreground">({isAr ? "الجنسية" : "Nationality"})</span>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {(profile as any).offers_services && (
              <Card className="border-primary/20">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {isAr ? "يقدم خدمات" : "Services Offered"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? ((profile as any).services_description_ar || (profile as any).services_description || "متاح للعمل")
                      : ((profile as any).services_description || (profile as any).services_description_ar || "Available for hire")}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* QR Code */}
            {qrCode && (
              <Card>
                <CardContent className="p-5">
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
                      profileUrl: `https://altohaacom.lovable.app/${profile.username}`,
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Member Since */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground px-4">
              <Calendar className="h-3 w-3" />
              {t("memberSince")}: {new Date(profile.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long" })}
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-2 space-y-6" dir={isAr ? "rtl" : "ltr"}>
            <Tabs defaultValue="career" className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0">
                {isVisible("career") && (
                  <TabsTrigger value="career" className="gap-1.5 data-[state=active]:bg-primary/10">
                    <Briefcase className="h-3.5 w-3.5" />
                    {isAr ? "المسيرة المهنية" : "Career"}
                  </TabsTrigger>
                )}
                {isVisible("education") && educationRecords.length > 0 && (
                  <TabsTrigger value="education" className="gap-1.5 data-[state=active]:bg-primary/10">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {isAr ? "التعليم" : "Education"}
                  </TabsTrigger>
                )}
                {isVisible("memberships") && memberships.length > 0 && (
                  <TabsTrigger value="entities" className="gap-1.5 data-[state=active]:bg-primary/10">
                    <Building2 className="h-3.5 w-3.5" />
                    {isAr ? "الجهات" : "Entities"}
                  </TabsTrigger>
                )}
                {isVisible("certificates") && (
                  <TabsTrigger value="certificates" className="gap-1.5 data-[state=active]:bg-primary/10">
                    <Award className="h-3.5 w-3.5" />
                    {isAr ? "الشهادات" : "Certificates"}
                  </TabsTrigger>
                )}
                {isVisible("competitions") && (
                  <TabsTrigger value="competitions" className="gap-1.5 data-[state=active]:bg-primary/10">
                    <Trophy className="h-3.5 w-3.5" />
                    {isAr ? "المسابقات" : "Competitions"}
                  </TabsTrigger>
                )}
                {isVisible("badges") && (
                  <TabsTrigger value="badges" className="gap-1.5 data-[state=active]:bg-primary/10">
                    <Medal className="h-3.5 w-3.5" />
                    {isAr ? "الأوسمة" : "Badges"}
                  </TabsTrigger>
                )}
                {mediaFiles.length > 0 && (
                  <TabsTrigger value="gallery" className="gap-1.5 data-[state=active]:bg-primary/10">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {isAr ? "الألبوم" : "Gallery"}
                  </TabsTrigger>
                )}
              </TabsList>

              {/* ── Career Tab ── */}
              {isVisible("career") && (
                <TabsContent value="career" className="mt-4 space-y-4">
                  {workRecords.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                      {isAr ? "لا توجد خبرات مضافة" : "No work experience added yet"}
                    </CardContent></Card>
                  ) : (
                    workRecords.map((record) => (
                      <Card key={record.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                        <CardContent className="p-5" dir={isAr ? "rtl" : "ltr"}>
                          <div className="flex gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10">
                              <Briefcase className="h-5 w-5 text-chart-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm">
                                {isAr ? (record.title_ar || record.title) : record.title}
                              </h4>
                            {record.entity_name && (
                              record.entity_id ? (
                                <Link to={`/entities/${record.entity_id}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                                  {record.entity_name}
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : (
                                <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                                  {record.entity_name}
                                  <Badge variant="outline" className="text-[9px] h-4">{isAr ? "قيد المراجعة" : "Under Review"}</Badge>
                                </p>
                              )
                            )}
                              <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(record.start_date, isAr)} – {formatDate(record.end_date, isAr)}
                                </span>
                                {record.is_current && (
                                  <Badge className="bg-chart-3/10 text-chart-3 text-[10px] h-5">{isAr ? "حالي" : "Current"}</Badge>
                                )}
                                {record.employment_type && (
                                  <Badge variant="outline" className="text-[10px] h-5">{record.employment_type}</Badge>
                                )}
                                {record.location && (
                                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{record.location}</span>
                                )}
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
                    ))
                  )}
                </TabsContent>
              )}

              {/* ── Education Tab ── */}
              {isVisible("education") && (
                <TabsContent value="education" className="mt-4 space-y-4">
                  {educationRecords.map((record) => (
                    <Card key={record.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                      <CardContent className="p-5" dir={isAr ? "rtl" : "ltr"}>
                        <div className="flex gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/10">
                            <GraduationCap className="h-5 w-5 text-chart-2" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">
                              {isAr ? (record.title_ar || record.title) : record.title}
                            </h4>
                            {record.entity_name && (
                              record.entity_id ? (
                                <Link to={`/entities/${record.entity_id}`} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                                  {record.entity_name}
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : (
                                <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                                  {record.entity_name}
                                  <Badge variant="outline" className="text-[9px] h-4">{isAr ? "قيد المراجعة" : "Under Review"}</Badge>
                                </p>
                              )
                            )}
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(record.start_date, isAr)} – {formatDate(record.end_date, isAr)}
                              </span>
                              {record.education_level && (
                                <Badge variant="outline" className="text-[10px] h-5">{record.education_level}</Badge>
                              )}
                              {record.field_of_study && (
                                <span>{isAr ? (record.field_of_study_ar || record.field_of_study) : record.field_of_study}</span>
                              )}
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
                </TabsContent>
              )}

              {/* ── Entities / Memberships Tab ── */}
              {isVisible("memberships") && (
                <TabsContent value="entities" className="mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {memberships.map((m: any) => (
                      <Card key={m.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                        <CardContent className="p-5 flex items-start gap-4" dir={isAr ? "rtl" : "ltr"}>
                          {m.culinary_entities?.logo_url ? (
                            <img src={m.culinary_entities.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover border" />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {isAr ? (m.culinary_entities?.name_ar || m.culinary_entities?.name) : (m.culinary_entities?.name || m.culinary_entities?.name_ar)}
                            </h4>
                            {m.title && (
                              <p className="text-xs text-muted-foreground">{isAr ? (m.title_ar || m.title) : m.title}</p>
                            )}
                            <div className="mt-1 flex gap-1.5">
                              <Badge variant="outline" className="text-[10px]">{m.membership_type}</Badge>
                              {m.culinary_entities?.type && (
                                <Badge variant="secondary" className="text-[10px]">{m.culinary_entities.type}</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              )}

              {/* ── Certificates Tab ── */}
              {isVisible("certificates") && (
                <TabsContent value="certificates" className="mt-4">
                  <ProfileCertificates userId={profile.user_id} isOwner={isOwnProfile} />
                </TabsContent>
              )}

              {/* ── Competitions Tab ── */}
              {isVisible("competitions") && (
                <TabsContent value="competitions" className="mt-4">
                  <CompetitionHistory userId={profile.user_id} />
                </TabsContent>
              )}

              {/* ── Badges Tab ── */}
              {isVisible("badges") && (
                <TabsContent value="badges" className="mt-4">
                  <UserBadgesDisplay userId={profile.user_id} />
                </TabsContent>
              )}

              {/* ── Gallery Tab ── */}
              {mediaFiles.length > 0 && (
                <TabsContent value="gallery" className="mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mediaFiles.map((file) => (
                      <button
                        key={file.name}
                        onClick={() => setLightboxImg(file.url)}
                        className="aspect-square rounded-xl overflow-hidden border bg-muted hover:opacity-90 transition-opacity"
                      >
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>

      {/* ── Image Lightbox ── */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightboxImg && (
            <img src={lightboxImg} alt="Gallery" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Follow List Dialog ── */}
      <Dialog open={!!followListOpen} onOpenChange={() => setFollowListOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {followListOpen === "followers" ? (isAr ? "المتابعون" : "Followers") : (isAr ? "يتابع" : "Following")}
            </DialogTitle>
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
