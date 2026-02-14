import { useState, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, MapPin, ChefHat, Shield, Crown, Star, Eye } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";

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
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg transition-all duration-500 hover:shadow-xl group">
      {/* Cover Image */}
      <div className="relative h-36 sm:h-52 bg-gradient-to-br from-primary/15 via-background to-accent/15 overflow-hidden">
        {profile?.cover_image_url && (
          <img 
            src={profile.cover_image_url} 
            alt="" 
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <Button
          variant="outline"
          size="sm"
          className="absolute end-3 top-3 h-8 gap-1.5 bg-background/60 backdrop-blur-sm text-xs"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="h-3.5 w-3.5" />
          {isAr ? "تغيير الغلاف" : "Change Cover"}
        </Button>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
      </div>

      {/* Profile Info */}
      <div className="relative px-4 pb-5 sm:px-6">
        {/* Avatar */}
        <div className="relative -mt-12 sm:-mt-14 mb-3">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-background shadow-2xl transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {(profile?.full_name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 end-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-serif text-xl font-bold sm:text-2xl">
                {isAr ? profile?.full_name_ar || profile?.full_name : profile?.full_name}
              </h1>
              {profile?.is_verified && <VerifiedBadge level={profile.verification_level} size="md" />}
            </div>
            {profile?.display_name && (
              <p className="text-sm text-muted-foreground">{isAr ? profile.display_name_ar || profile.display_name : profile.display_name}</p>
            )}
            {profile?.username && (
              <p className="text-xs text-muted-foreground mt-0.5">@{profile.username}</p>
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
                #{profile.account_number}
              </Badge>
            )}
          </div>

        </div>

        {/* Quick stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {profileViews} {isAr ? "زيارة" : "views"}</span>
          <span>{isAr ? "عضو منذ" : "Member since"} {new Date(profile?.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "short" })}</span>
        </div>
      </div>
    </div>
  );
}
