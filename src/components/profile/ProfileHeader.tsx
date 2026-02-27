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
    basic: { icon: Star, label: "Basic", labelAr: "أساسي", color: "bg-muted text-muted-foreground" },
    professional: { icon: Crown, label: "Professional", labelAr: "احترافي", color: "bg-primary/20 text-primary" },
    enterprise: { icon: Shield, label: "Enterprise", labelAr: "مؤسسي", color: "bg-chart-2/20 text-chart-2" },
  };
  const tier = tierConfig[profile?.membership_tier || "basic"];
  const TierIcon = tier.icon;
  const profileViews = (profile as any)?.view_count || 0;

  return (
    <div className="relative overflow-visible rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-sm shadow-xl transition-all duration-500 hover:shadow-2xl hover:border-primary/20 group">
      {/* Cover Image - Premium Hero Style */}
      <div className="relative h-44 sm:h-64 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="pointer-events-none absolute -top-12 -end-12 h-48 w-48 rounded-full bg-primary/10 blur-[60px] animate-pulse" />
        <div className="pointer-events-none absolute -bottom-10 -start-10 h-32 w-32 rounded-full bg-accent/10 blur-[50px] animate-pulse [animation-delay:2s]" />
        
        {profile?.cover_image_url && (
          <img 
            src={profile.cover_image_url} 
            alt="" 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <FeatureGate feature="feature_cover_image">
          <Button
            variant="secondary"
            size="sm"
            className="absolute end-4 top-4 h-9 gap-2 bg-background/60 backdrop-blur-xl border-border/30 text-foreground text-xs font-bold uppercase tracking-wider shadow-lg rounded-xl hover:bg-background/80 transition-all"
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
      <div className="relative px-4 pb-5 sm:px-6">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20 mb-5">
          <div className="relative inline-block">
            <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-3xl p-1 bg-gradient-to-br from-primary via-primary-glow to-accent shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
              <Avatar className="h-full w-full rounded-[1.4rem] ring-4 ring-background shadow-inner overflow-hidden bg-card">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-4xl font-black bg-primary/10 text-primary">
                  {(profile?.full_name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 end-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-all hover:scale-110 ring-4 ring-background"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-2xl font-black sm:text-3xl lg:text-4xl tracking-tight text-foreground drop-shadow-sm break-words ${language !== "ar" ? "font-serif" : ""}`}>
                {isAr ? (profile?.display_name_ar || profile?.full_name_ar || profile?.full_name) : (profile?.display_name || profile?.full_name)}
              </h1>
              <FeatureGate feature="feature_verification_badge">
                {profile?.is_verified && <VerifiedBadge level={profile.verification_level} size="lg" />}
              </FeatureGate>
            </div>
            {profile?.display_name && (
              <p className="text-base font-bold text-primary/80 tracking-wide mt-1">{isAr ? profile.display_name_ar || profile.display_name : profile.display_name}</p>
            )}
            {profile?.username && (
              <p className="text-xs font-mono font-bold text-muted-foreground mt-1 bg-muted/30 w-fit px-2 py-0.5 rounded-lg border border-border/40" dir="ltr">@{profile.username}</p>
            )}
            {(profile?.job_title || profile?.specialization) && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                <ChefHat className="h-3.5 w-3.5 text-primary" />
                <span>{isAr ? (profile.job_title_ar || profile.specialization_ar || profile.job_title || profile.specialization) : (profile.job_title || profile.specialization)}</span>
              </div>
            )}
            {profile?.location && (
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{profile.country_code ? `${countryFlag(profile.country_code)} ` : ""}{profile.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${tier.color} gap-1.5 px-3 py-1 shadow-sm border-none`}>
              <TierIcon className="h-3.5 w-3.5" />
              {isAr ? tier.labelAr : tier.label}
            </Badge>
            {roles.map((r) => (
              <Badge key={r} variant="secondary" className="capitalize text-[10px] bg-muted/50 border-border/40 px-2">
                {r === 'admin' ? <Shield className="h-3 w-3 me-1 text-primary" /> : null}
                {r}
              </Badge>
            ))}
            {profile?.account_number && (
              <Badge variant="outline" className="font-mono text-[10px] border-primary/20 bg-primary/5 text-primary">
                <span dir="ltr">#{profile.account_number}</span>
              </Badge>
            )}
          </div>

        </div>

        {/* Quick stats bar */}
        <div className="mt-4 flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground border border-border/30">
            <Eye className="h-3 w-3 text-primary/70" />
            <span className="font-semibold text-foreground">{toEnglishDigits(profileViews)}</span>
            <span>{isAr ? "زيارة" : "views"}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground border border-border/30">
            <span>{isAr ? "عضو منذ" : "Joined"}</span>
            <span className="font-semibold text-foreground">{toEnglishDigits(new Date(profile?.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" }))}</span>
          </div>
          {profile?.loyalty_points > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs border border-primary/20">
              <Star className="h-3 w-3 text-primary" />
              <span className="font-semibold text-primary">{toEnglishDigits(profile.loyalty_points)}</span>
              <span className="text-muted-foreground">{isAr ? "نقطة" : "pts"}</span>
            </div>
          )}

          {/* Social Links Page Actions */}
          {profile?.username && (
            <>
              <div className="ms-auto" />
              <Link
                to={linksPath}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <Link2 className="h-3 w-3" />
                {isAr ? "صفحة روابطي" : "My Links"}
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </Link>
              <button
                onClick={copyLinksUrl}
                className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground border border-border/30 hover:bg-muted/60 transition-colors"
              >
                {linkCopied ? <Check className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                {isAr ? "نسخ" : "Copy"}
              </button>
              <button
                onClick={shareLinksUrl}
                className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground border border-border/30 hover:bg-muted/60 transition-colors"
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
