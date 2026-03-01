import { useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, MapPin, ChefHat, Shield, Crown, Star, Eye, Award, Link2, Copy, Check, Share2, ExternalLink } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import { toEnglishDigits } from "@/lib/formatNumber";
import { Link } from "react-router-dom";
import { buildSocialLinksPath, buildSocialLinksUrl } from "@/lib/publicAppUrl";
import { FeatureGate } from "@/components/membership/FeatureGate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileHeaderProps {
  profile: any;
  roles: string[];
  userId: string;
  onProfileUpdate: () => void;
}

export function ProfileHeader({ profile, roles, userId, onProfileUpdate }: ProfileHeaderProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const linksUrl = profile?.username ? buildSocialLinksUrl(profile.username) : "";
  const linksPath = profile?.username ? buildSocialLinksPath(profile.username) : "";

  const copyLinksUrl = async () => {
    if (!linksUrl) return;
    await navigator.clipboard.writeText(linksUrl);
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
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${type}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("user-media")
      .upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ variant: "destructive", title: "Error", description: uploadErr.message });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
    const col = type === "avatar" ? "avatar_url" : "cover_image_url";
    await supabase.from("profiles").update({ [col]: urlData.publicUrl }).eq("user_id", userId);
    toast({ title: isAr ? "تم تحديث الصورة" : "Image updated" });
    onProfileUpdate();
    setUploading(false);
  };

  const tierConfig: Record<string, { icon: any; label: string; labelAr: string; color: string }> = {
    basic: { icon: Star, label: "Basic", labelAr: "أساسي", color: "bg-muted/60 text-muted-foreground" },
    professional: { icon: Crown, label: "Professional", labelAr: "احترافي", color: "bg-primary/15 text-primary border-primary/20" },
    enterprise: { icon: Shield, label: "Enterprise", labelAr: "مؤسسي", color: "bg-chart-2/15 text-chart-2 border-chart-2/20" },
  };
  const tier = tierConfig[profile?.membership_tier || "basic"];
  const TierIcon = tier.icon;
  const profileViews = (profile as any)?.view_count || 0;

  return (
    <div className="relative overflow-visible rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5 transition-all duration-500 hover:shadow-2xl hover:border-primary/15 group">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/8 via-background to-accent/8 overflow-hidden rounded-t-2xl">
        <div className="pointer-events-none absolute -top-20 -end-20 h-64 w-64 rounded-full bg-primary/6 blur-[100px] animate-pulse" />
        <div className="pointer-events-none absolute -bottom-16 -start-16 h-48 w-48 rounded-full bg-accent/6 blur-[80px] animate-pulse [animation-delay:2s]" />
        
        {profile?.cover_image_url && (
          <img 
            src={profile.cover_image_url} 
            alt="" 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        <FeatureGate feature="feature_cover_image" showUpgrade upgradeVariant="minimal" featureName="Cover Image" featureNameAr="صورة الغلاف">
          <Button
            variant="secondary"
            size="sm"
            className="absolute end-4 top-4 h-9 gap-2 bg-background/40 backdrop-blur-xl border-border/20 text-foreground text-xs font-bold uppercase tracking-wider shadow-lg rounded-xl hover:bg-background/60 transition-all"
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
      <div className="relative px-5 pb-6 sm:px-8">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20 mb-5">
          <div className="relative inline-block">
            <div className="relative h-32 w-32 sm:h-36 sm:w-36 rounded-2xl p-[3px] bg-gradient-to-br from-primary via-primary-glow to-accent shadow-2xl shadow-primary/15 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary/25">
              <Avatar className="h-full w-full rounded-[calc(1rem-1px)] ring-4 ring-card shadow-inner overflow-hidden bg-card">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                  {(profile?.full_name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 end-1 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 ring-3 ring-card"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className={`text-2xl font-black sm:text-3xl lg:text-4xl tracking-tight text-foreground break-words ${language !== "ar" ? "font-serif" : ""}`}>
                {isAr ? (profile?.display_name_ar || profile?.full_name_ar || profile?.full_name) : (profile?.display_name || profile?.full_name)}
              </h1>
              <FeatureGate feature="feature_verification_badge">
                {profile?.is_verified && <VerifiedBadge level={profile.verification_level} size="lg" />}
              </FeatureGate>
            </div>
            {profile?.display_name && (
              <p className="text-sm font-bold text-primary/60 tracking-wide">{isAr ? profile.display_name_ar || profile.display_name : profile.display_name}</p>
            )}
            {profile?.username && (
              <p className="text-xs font-mono font-bold text-muted-foreground bg-muted/30 w-fit px-2.5 py-1 rounded-xl border border-border/30" dir="ltr">@{profile.username}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              {(profile?.job_title || profile?.specialization) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/8">
                    <ChefHat className="h-3 w-3 text-primary" />
                  </div>
                  <span>{isAr ? (profile.job_title_ar || profile.specialization_ar || profile.job_title || profile.specialization) : (profile.job_title || profile.specialization)}</span>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/40">
                    <MapPin className="h-3 w-3" />
                  </div>
                  <span>{profile.country_code ? `${countryFlag(profile.country_code)} ` : ""}{profile.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${tier.color} gap-1.5 px-3 py-1.5 shadow-sm border rounded-xl text-xs font-bold`}>
              <TierIcon className="h-3.5 w-3.5" />
              {isAr ? tier.labelAr : tier.label}
            </Badge>
            {roles.map((r) => (
              <Badge key={r} variant="secondary" className="capitalize text-[10px] bg-muted/40 border-border/30 px-2.5 py-1 rounded-xl">
                {r === 'admin' ? <Shield className="h-3 w-3 me-1 text-primary" /> : null}
                {r}
              </Badge>
            ))}
            {profile?.account_number && (
              <Badge variant="outline" className="font-mono text-[10px] border-primary/15 bg-primary/5 text-primary rounded-xl px-2.5 py-1">
                <span dir="ltr">#{profile.account_number}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Quick stats bar */}
        <div className="mt-5 flex items-center gap-1.5 flex-wrap rounded-2xl bg-muted/10 border border-border/20 p-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 rounded-xl bg-background/60 px-3 py-2 text-xs text-muted-foreground transition-all hover:bg-background/80 hover:shadow-sm cursor-default">
                <Eye className="h-3 w-3 text-primary/70" />
                <span className="font-bold text-foreground tabular-nums">{toEnglishDigits(profileViews)}</span>
                <span>{isAr ? "زيارة" : "views"}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">{isAr ? "عدد زيارات الملف الشخصي" : "Total profile views"}</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-1.5 rounded-xl bg-background/60 px-3 py-2 text-xs text-muted-foreground transition-all hover:bg-background/80">
            <span>{isAr ? "عضو منذ" : "Joined"}</span>
            <span className="font-bold text-foreground">{toEnglishDigits(new Date(profile?.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }))}</span>
          </div>
          {profile?.loyalty_points > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-xs border border-primary/15 transition-all hover:bg-primary/10">
              <Star className="h-3 w-3 text-primary" />
              <span className="font-bold text-primary tabular-nums">{toEnglishDigits(profile.loyalty_points)}</span>
              <span className="text-muted-foreground">{isAr ? "نقطة" : "pts"}</span>
            </div>
          )}

          {/* Social Links Page Actions */}
          {profile?.username && (
            <>
              <div className="ms-auto" />
              <Link
                to={linksPath}
                className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary border border-primary/15 hover:bg-primary/15 transition-all hover:shadow-sm active:scale-95"
              >
                <Link2 className="h-3 w-3" />
                {isAr ? "صفحة روابطي" : "My Links"}
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </Link>
              <button
                onClick={copyLinksUrl}
                className="flex items-center gap-1.5 rounded-xl bg-background/60 px-3 py-2 text-xs text-muted-foreground border border-border/20 hover:bg-background/80 transition-all active:scale-95"
              >
                {linkCopied ? <Check className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                {isAr ? "نسخ" : "Copy"}
              </button>
              <button
                onClick={shareLinksUrl}
                className="flex items-center gap-1.5 rounded-xl bg-background/60 px-3 py-2 text-xs text-muted-foreground border border-border/20 hover:bg-background/80 transition-all active:scale-95"
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
}
