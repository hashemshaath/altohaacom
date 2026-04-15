import { useIsAr } from "@/hooks/useIsAr";
import { useState, useRef, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, MapPin, ChefHat, Shield, Crown, Star, Eye, Award, Link2, Copy, Check, Share2, ExternalLink, Sparkles, Users, UserPlus, LucideIcon } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import { toEnglishDigits } from "@/lib/formatNumber";
import { Link } from "react-router-dom";
import { buildSocialLinksPath, buildSocialLinksUrl } from "@/lib/publicAppUrl";
import { FeatureGate } from "@/components/membership/FeatureGate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CACHE } from "@/lib/queryConfig";

interface ProfileHeaderProps {
  profile: any;
  roles: string[];
  userId: string;
  onProfileUpdate: () => void;
}

export const ProfileHeader = memo(function ProfileHeader({ profile, roles, userId, onProfileUpdate }: ProfileHeaderProps) {
  const { language } = useLanguage();
  const isAr = useIsAr();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const linksUrl = profile?.username ? buildSocialLinksUrl(profile.username) : "";
  const linksPath = profile?.username ? buildSocialLinksPath(profile.username) : "";

  const copyLinksUrl = async () => {
    if (!linksUrl) return;
    await navigator.clipboard.writeText(linksUrl).then(null, () => {});
    setLinkCopied(true);
    toast({ title: isAr ? "تم نسخ رابط صفحة الروابط" : "Links page URL copied!" });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareLinksUrl = async () => {
    if (!linksUrl) return;
    const shareText = isAr ? `صفحة روابطي على الطهاة` : `My links page on Altoha`;
    if (navigator.share) {
      try { await navigator.share({ title: shareText, url: linksUrl }); } catch {}
    } else {
      copyLinksUrl();
    }
  };

  const uploadImage = async (file: File, type: "avatar" | "cover") => {
    if (!file) return;

    // Validate file
    const maxSize = type === "avatar" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: isAr ? "الملف كبير جداً" : "File too large",
        description: isAr
          ? `الحد الأقصى ${type === "avatar" ? "5" : "10"} ميجابايت`
          : `Maximum ${type === "avatar" ? "5" : "10"}MB allowed`,
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: isAr ? "نوع ملف غير صالح" : "Invalid file type",
        description: isAr ? "يرجى اختيار صورة" : "Please select an image file",
      });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${type}-${Date.now()}.${ext}`;

      // Remove old file first (best-effort)
      const oldUrl = type === "avatar" ? profile?.avatar_url : profile?.cover_image_url;
      if (oldUrl?.includes("/user-media/")) {
        const oldPath = oldUrl.split("/user-media/").pop();
        if (oldPath) {
          await supabase.storage.from("user-media").remove([decodeURIComponent(oldPath)]).then(null, () => {});
        }
      }

      const { error: uploadErr } = await supabase.storage
        .from("user-media")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadErr) {
        toast({
          variant: "destructive",
          title: isAr ? "فشل الرفع" : "Upload failed",
          description: uploadErr.message,
        });
        return;
      }

      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      const col = type === "avatar" ? "avatar_url" : "cover_image_url";
      const { error: updateErr } = await supabase.from("profiles").update({ [col]: urlData.publicUrl }).eq("user_id", userId);

      if (updateErr) {
        toast({
          variant: "destructive",
          title: isAr ? "فشل التحديث" : "Update failed",
          description: updateErr.message,
        });
        return;
      }

      toast({
        title: isAr ? "تم تحديث الصورة بنجاح ✓" : "Image updated successfully ✓",
      });
      onProfileUpdate();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: isAr ? "حدث خطأ" : "Something went wrong",
        description: (err instanceof Error ? err.message : "Unknown error"),
      });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (type === "avatar" && avatarInputRef.current) avatarInputRef.current.value = "";
      if (type === "cover" && coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const tierConfig: Record<string, { icon: LucideIcon; label: string; labelAr: string; color: string }> = {
    basic: { icon: Star, label: "Basic", labelAr: "أساسي", color: "bg-muted/60 text-muted-foreground" },
    professional: { icon: Crown, label: "Professional", labelAr: "احترافي", color: "bg-primary/15 text-primary border-primary/20" },
    enterprise: { icon: Shield, label: "Enterprise", labelAr: "مؤسسي", color: "bg-chart-2/15 text-chart-2 border-chart-2/20" },
  };
  const tier = tierConfig[profile?.membership_tier || "basic"];
  const TierIcon = tier.icon;
  const profileViews = (profile as any)?.view_count || 0;

  // Follower/following counts
  const { data: followStats } = useQuery({
    queryKey: ["profile-follow-stats", userId],
    queryFn: async () => {
      const [followersRes, followingRes] = await Promise.allSettled([
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
      ]);
      return {
        followers: followersRes.status === "fulfilled" ? (followersRes.value.count || 0) : 0,
        following: followingRes.status === "fulfilled" ? (followingRes.value.count || 0) : 0,
      };
    },
    enabled: !!userId,
    staleTime: CACHE.medium.staleTime,
  });

  return (
    <div className="relative overflow-visible rounded-3xl border border-border/20 bg-card/60 backdrop-blur-md shadow-xl shadow-primary/5 transition-all duration-700 hover:shadow-2xl hover:border-primary/15 group">
      {/* Cover Image */}
      <div className="relative h-32 sm:h-52 md:h-72 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden rounded-t-3xl">
        {/* Ambient blurs */}
        <div className="pointer-events-none absolute -top-24 end-1/4 h-72 w-72 rounded-full bg-primary/8 blur-[120px] animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 start-1/4 h-56 w-56 rounded-full bg-accent/8 blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="pointer-events-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-primary/4 blur-[80px]" />
        
        {profile?.cover_image_url && (
          <img loading="lazy" decoding="async" 
            src={profile.cover_image_url} 
            alt={`${profile?.full_name || profile?.display_name || "Profile"} cover`} 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:24px_24px]" />

        <FeatureGate feature="feature_cover_image" showUpgrade upgradeVariant="minimal" featureName="Cover Image" featureNameAr="صورة الغلاف">
          <Button
            variant="secondary"
            size="sm"
            className="absolute end-4 top-4 h-9 gap-2 bg-background/30 backdrop-blur-2xl border-white/10 text-foreground text-[12px] font-bold uppercase tracking-widest shadow-lg rounded-2xl hover:bg-background/50 transition-all"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-3.5 w-3.5" />
            {isAr ? "تغيير الغلاف" : "Change Cover"}
          </Button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
        </FeatureGate>
      </div>

      {/* Profile Info */}
      <div className="relative px-3 pb-4 sm:px-8 sm:pb-7">
        {/* Avatar */}
        <div className="relative -mt-12 sm:-mt-22 mb-3 sm:mb-5">
          <div className="relative inline-block">
            <div className="relative h-20 w-20 sm:h-40 sm:w-40 rounded-3xl p-[3px] bg-gradient-to-br from-primary via-primary/80 to-accent shadow-2xl shadow-primary/25 transition-all duration-700 group-hover:scale-[1.03] group-hover:shadow-primary/35">
              <Avatar className="h-full w-full rounded-[calc(1.5rem-2px)] ring-4 ring-card shadow-inner overflow-hidden bg-card">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-3xl sm:text-5xl font-black bg-primary/10 text-primary">
                  {(profile?.full_name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
            </div>

            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -end-1 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 ring-3 sm:ring-4 ring-card touch-manipulation"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
          </div>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className={`text-lg font-black sm:text-3xl lg:text-4xl tracking-tight text-foreground break-words ${language !== "ar" ? "font-serif" : ""}`}>
                {isAr ? (profile?.display_name_ar || profile?.full_name_ar || profile?.full_name) : (profile?.display_name || profile?.full_name)}
              </h1>
              <FeatureGate feature="feature_verification_badge">
                {profile?.is_verified && <VerifiedBadge level={profile.verification_level} size="lg" />}
              </FeatureGate>
            </div>
            {profile?.display_name && (
              <p className="text-sm font-bold text-primary/50 tracking-wide">{isAr ? profile.display_name_ar || profile.display_name : profile.display_name}</p>
            )}
            {profile?.username && (
              <p className="text-xs font-mono font-bold text-muted-foreground bg-muted/20 w-fit px-3 py-1.5 rounded-2xl border border-border/20" dir="ltr">@{profile.username}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              {(profile?.job_title || profile?.specialization) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/8">
                    <ChefHat className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{isAr ? (profile.job_title_ar || profile.specialization_ar || profile.job_title || profile.specialization) : (profile.job_title || profile.specialization)}</span>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-muted/30">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span>{profile.country_code ? `${countryFlag(profile.country_code)} ` : ""}{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          {profile?.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mt-1">
              {isAr ? (profile.bio_ar || profile.bio) : profile.bio}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${tier.color} gap-1.5 px-3.5 py-2 shadow-sm border rounded-2xl text-xs font-bold`}>
              <TierIcon className="h-3.5 w-3.5" />
              {isAr ? tier.labelAr : tier.label}
            </Badge>
            {roles.map((r) => (
              <Badge key={r} variant="secondary" className="capitalize text-[12px] bg-muted/30 border-border/20 px-3 py-1.5 rounded-2xl">
                {r === 'admin' ? <Shield className="h-3 w-3 me-1 text-primary" /> : null}
                {r}
              </Badge>
            ))}
            {profile?.account_number && (
              <Badge variant="outline" className="font-mono text-[12px] border-primary/10 bg-primary/5 text-primary rounded-2xl px-3 py-1.5">
                <span dir="ltr">#{profile.account_number}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="mt-4 sm:mt-6 flex items-center gap-1 sm:gap-1.5 flex-wrap rounded-2xl bg-muted/8 border border-border/15 p-1 sm:p-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-xl bg-background/50 px-3.5 py-2.5 text-xs text-muted-foreground transition-all hover:bg-background/70 hover:shadow-sm cursor-default">
                <Eye className="h-3.5 w-3.5 text-primary/60" />
                <AnimatedCounter value={profileViews} className="font-bold text-foreground" />
                <span className="text-muted-foreground/70">{isAr ? "زيارة" : "views"}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs rounded-xl">{isAr ? "عدد زيارات الملف الشخصي" : "Total profile views"}</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-1.5 rounded-xl bg-background/50 px-3.5 py-2.5 text-xs text-muted-foreground transition-all hover:bg-background/70">
            <Sparkles className="h-3 w-3 text-primary/40" />
            <span className="text-muted-foreground/70">{isAr ? "عضو منذ" : "Joined"}</span>
            <span className="font-bold text-foreground">{toEnglishDigits(new Date(profile?.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }))}</span>
          </div>
          {followStats && (
            <>
              <div className="flex items-center gap-1.5 rounded-xl bg-background/50 px-3.5 py-2.5 text-xs text-muted-foreground transition-all hover:bg-background/70 cursor-default">
                <Users className="h-3.5 w-3.5 text-chart-1/60" />
                <AnimatedCounter value={followStats.followers} className="font-bold text-foreground" />
                <span className="text-muted-foreground/70">{isAr ? "متابع" : "followers"}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-background/50 px-3.5 py-2.5 text-xs text-muted-foreground transition-all hover:bg-background/70 cursor-default">
                <UserPlus className="h-3.5 w-3.5 text-chart-2/60" />
                <AnimatedCounter value={followStats.following} className="font-bold text-foreground" />
                <span className="text-muted-foreground/70">{isAr ? "يتابع" : "following"}</span>
              </div>
            </>
          )}
          {profile?.loyalty_points > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs border border-primary/10 transition-all hover:bg-primary/8">
              <Star className="h-3.5 w-3.5 text-primary" />
              <AnimatedCounter value={profile.loyalty_points} className="font-bold text-primary tabular-nums" />
              <span className="text-muted-foreground/70">{isAr ? "نقطة" : "pts"}</span>
            </div>
          )}

          {/* Social Links Page Actions */}
          {profile?.username && (
            <>
              <div className="ms-auto" />
              <Link
                to={linksPath}
                className="flex items-center gap-1.5 rounded-xl bg-primary/8 px-3.5 py-2.5 text-xs font-bold text-primary border border-primary/10 hover:bg-primary/12 transition-all hover:shadow-sm active:scale-95"
              >
                <Link2 className="h-3.5 w-3.5" />
                {isAr ? "صفحة روابطي" : "My Links"}
                <ExternalLink className="h-2.5 w-2.5 opacity-50" />
              </Link>
              <button
                onClick={copyLinksUrl}
                className="flex items-center gap-1.5 rounded-xl bg-background/50 px-3 py-2.5 text-xs text-muted-foreground border border-border/15 hover:bg-background/70 transition-all active:scale-95"
              >
                {linkCopied ? <Check className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                {isAr ? "نسخ" : "Copy"}
              </button>
              <button
                onClick={shareLinksUrl}
                className="flex items-center gap-1.5 rounded-xl bg-background/50 px-3 py-2.5 text-xs text-muted-foreground border border-border/15 hover:bg-background/70 transition-all active:scale-95"
              >
                <Share2 className="h-3 w-3" />
                {isAr ? "مشاركة" : "Share"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
