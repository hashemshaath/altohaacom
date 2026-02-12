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
  User,
  MapPin,
  Globe,
  Award,
  BadgeCheck,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  ChefHat,
  ArrowLeft,
  Calendar,
  Earth,
  UserPlus,
  UserMinus,
  Loader2,
  Users,
} from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { useAllCountries } from "@/hooks/useCountries";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

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
      return data as Profile;
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

  // Follow system
  const { data: followStats } = useFollowStats(profile?.user_id);
  const { data: isFollowing } = useIsFollowing(profile?.user_id);
  const toggleFollow = useToggleFollow(profile?.user_id);
  const { data: followersList = [] } = useFollowersList(followListOpen ? profile?.user_id : undefined, followListOpen || "followers");
  const { data: userSpecialties = [] } = useUserSpecialties(profile?.user_id);

  const isOwnProfile = user?.id === profile?.user_id;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container flex-1 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
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
          <h1 className="font-serif text-xl font-bold">
            {isAr ? "المستخدم غير موجود" : "User not found"}
          </h1>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            {isAr
              ? "الملف الشخصي الذي تبحث عنه غير موجود أو تم حذفه."
              : "The profile you're looking for doesn't exist or has been removed."}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "الرئيسية" : "Go Home"}
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const socialLinks = [
    { icon: Instagram, value: profile.instagram, label: "Instagram" },
    { icon: Twitter, value: profile.twitter, label: "Twitter" },
    { icon: Facebook, value: profile.facebook, label: "Facebook" },
    { icon: Linkedin, value: profile.linkedin, label: "LinkedIn" },
    { icon: Youtube, value: profile.youtube, label: "YouTube" },
    { icon: Globe, value: profile.website, label: "Website" },
  ].filter(s => s.value);

  const getMembershipColor = (tier: string | null) => {
    const colors: Record<string, string> = {
      basic: "bg-muted text-muted-foreground",
      professional: "bg-primary/10 text-primary",
      enterprise: "bg-accent/20 text-accent-foreground",
    };
    return colors[tier || "basic"] || colors.basic;
  };

  const displayName = (profile as any).display_name || profile.full_name || "Unnamed Chef";

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title={`${displayName} (@${profile.username}) - Profile`}
        description={profile.bio || `${displayName}'s professional culinary profile on Altohaa`}
      />
      <Header />

      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 md:h-44 relative overflow-hidden">
        {(profile as any).cover_image_url ? (
          <img src={(profile as any).cover_image_url} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <>
            <div className="absolute -top-16 start-1/4 h-32 w-32 rounded-full bg-primary/10 blur-[60px]" />
            <div className="absolute -bottom-8 end-1/4 h-24 w-24 rounded-full bg-accent/15 blur-[50px]" />
          </>
        )}
      </div>

      <main className="container flex-1 -mt-16 pb-8 md:pb-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 shadow-lg shadow-primary/5">
              <CardContent className="p-5">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                      {(displayName)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="mt-3 flex items-center gap-1.5">
                    <h1 className="font-serif text-lg font-bold">{displayName}</h1>
                    {profile.is_verified && <BadgeCheck className="h-4.5 w-4.5 text-primary" />}
                  </div>

                  <p className="text-xs text-muted-foreground">@{profile.username}</p>

                  {/* Follow Stats */}
                  <div className="mt-3 flex items-center gap-6">
                    <button
                      onClick={() => setFollowListOpen("followers")}
                      className="flex flex-col items-center hover:text-primary transition-colors"
                    >
                      <span className="text-lg font-bold">{followStats?.followers || 0}</span>
                      <span className="text-[10px] text-muted-foreground">{isAr ? "متابعون" : "Followers"}</span>
                    </button>
                    <button
                      onClick={() => setFollowListOpen("following")}
                      className="flex flex-col items-center hover:text-primary transition-colors"
                    >
                      <span className="text-lg font-bold">{followStats?.following || 0}</span>
                      <span className="text-[10px] text-muted-foreground">{isAr ? "يتابع" : "Following"}</span>
                    </button>
                  </div>

                  {/* Follow Button */}
                  {user && !isOwnProfile && (
                    <Button
                      className="mt-3 w-full"
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleFollow.mutate(!!isFollowing)}
                      disabled={toggleFollow.isPending}
                    >
                      {toggleFollow.isPending ? (
                        <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : isFollowing ? (
                        <UserMinus className="me-1.5 h-3.5 w-3.5" />
                      ) : (
                        <UserPlus className="me-1.5 h-3.5 w-3.5" />
                      )}
                      {isFollowing
                        ? isAr ? "إلغاء المتابعة" : "Unfollow"
                        : isAr ? "متابعة" : "Follow"}
                    </Button>
                  )}

                  {/* Account & Membership */}
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {profile.account_number && (
                      <Badge variant="outline" className="font-mono text-[10px]">{profile.account_number}</Badge>
                    )}
                    {profile.membership_tier && (
                      <Badge className={`text-[10px] ${getMembershipColor(profile.membership_tier)}`}>
                        {profile.membership_tier === "professional" ? t("professionalTier") : t(profile.membership_tier as any)}
                      </Badge>
                    )}
                  </div>

                  {/* Roles */}
                  {roles && roles.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap justify-center gap-1">
                      {roles.map((role) => (
                        <Badge key={role} variant="secondary" className="capitalize text-[10px]">{t(role as any)}</Badge>
                      ))}
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Details */}
                  <div className="w-full space-y-2.5 text-start">
                    {profile.specialization && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ChefHat className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span>{profile.specialization}</span>
                      </div>
                    )}
                    {/* Specialties from DB */}
                    {userSpecialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 ps-9">
                        {userSpecialties.map((us: any) => (
                          <Badge key={us.id} variant="outline" className="text-[10px]">
                            {isAr ? us.specialties?.name_ar || us.specialties?.name : us.specialties?.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {profile.experience_level && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Award className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="capitalize">{t(profile.experience_level as any)}</span>
                      </div>
                    )}
                    {(profile.country_code || profile.location || (profile as any).city) && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span>
                          {profile.country_code ? `${countryFlag(profile.country_code)} ` : ""}
                          {[getCountryName(profile.country_code), (profile as any).city].filter(Boolean).join(", ") || profile.location}
                        </span>
                      </div>
                    )}
                    {profile.nationality && profile.nationality !== profile.country_code && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Earth className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span>{countryFlag(profile.nationality)} {getCountryName(profile.nationality)} <span className="text-[10px]">({isAr ? "الجنسية" : "Nationality"})</span></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="mt-4 rounded-xl bg-muted/30 p-3.5">
                    <p className="text-center text-xs leading-relaxed text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                    {socialLinks.map((link) => (
                      <Button key={link.label} variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3" asChild>
                        <a href={link.value?.startsWith("http") ? link.value : `https://${link.value}`} target="_blank" rel="noopener noreferrer">
                          <link.icon className="h-3 w-3" />
                          <span className="text-[10px]">{link.label}</span>
                        </a>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Message */}
                <div className="mt-4">
                  <MessageButton userId={profile.user_id} variant="default" />
                </div>

                {/* Member Since */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {t("memberSince")}: {new Date(profile.created_at).toLocaleDateString()}
                </div>

                {/* QR Code */}
                {qrCode && (
                  <div className="mt-4">
                    <QRCodeDisplay
                      code={qrCode.code}
                      label={isAr ? "رمز QR للحساب" : "Account QR Code"}
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-6">
            <UserBadgesDisplay userId={profile.user_id} />
            <ProfileCertificates userId={profile.user_id} isOwner={user?.id === profile.user_id} />
            <CompetitionHistory userId={profile.user_id} />
          </div>
        </div>
      </main>

      {/* Follow List Dialog */}
      <Dialog open={!!followListOpen} onOpenChange={() => setFollowListOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {followListOpen === "followers"
                ? isAr ? "المتابعون" : "Followers"
                : isAr ? "يتابع" : "Following"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {followersList.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {isAr ? "لا يوجد" : "No users yet"}
                </p>
              ) : (
                followersList.map((p: any) => (
                  <Link
                    key={p.user_id}
                    to={`/${p.username}`}
                    onClick={() => setFollowListOpen(null)}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
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
