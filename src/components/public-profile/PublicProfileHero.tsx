import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageButton } from "@/components/profile/MessageButton";
import { ProfileShareButtons } from "@/components/profile/ProfileShareButtons";
import { countryFlag } from "@/lib/countryFlag";
import {
  BadgeCheck, Briefcase, MapPin, UserPlus, UserMinus, Loader2, Clock, Lock,
} from "lucide-react";

interface PublicProfileHeroProps {
  profile: any;
  displayName: string;
  currentWork: any;
  roles: any[];
  roleLabels: Record<string, { en: string; ar: string }>;
  userAwards: any[];
  isAr: boolean;
  isOwnProfile: boolean;
  isFollowing: boolean | undefined;
  pendingRequest: any;
  followPrivacy: string | undefined;
  toggleFollow: any;
  user: any;
  getCountryName: (code: string | null) => string | null;
}

export function PublicProfileHero({
  profile, displayName, currentWork, roles, roleLabels, userAwards,
  isAr, isOwnProfile, isFollowing, pendingRequest, followPrivacy, toggleFollow, user, getCountryName,
}: PublicProfileHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Cover */}
      <div className="h-52 sm:h-64 md:h-80 relative overflow-hidden">
        {profile.cover_image_url ? (
          <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-chart-3/10">
            <div className="absolute top-10 start-1/4 h-64 w-64 rounded-full bg-primary/10 blur-[100px] animate-pulse" />
            <div className="absolute bottom-4 end-1/3 h-48 w-48 rounded-full bg-chart-3/10 blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Profile Card */}
      <div className="relative z-10 -mt-20 md:-mt-24 px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-border/40 shadow-2xl rounded-[2rem] backdrop-blur-xl bg-card/80 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <CardContent className="p-5 md:p-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8" dir={isAr ? "rtl" : "ltr"}>
              {/* Avatar */}
              <div className="-mt-24 md:-mt-28 shrink-0 relative group">
                <div className="h-32 w-28 md:h-44 md:w-40 ring-[6px] ring-background/60 shadow-2xl rounded-[1.5rem] overflow-hidden border border-border/50 transition-transform duration-500 group-hover:scale-[1.03]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-5xl font-bold font-serif">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {profile.is_verified && (
                  <div className="absolute -bottom-1.5 -end-1.5 bg-primary text-primary-foreground p-1 rounded-lg shadow-lg ring-2 ring-background">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center md:text-start space-y-2">
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                  <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
                  {profile.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                  {profile.show_nationality !== false && profile.nationality && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-lg leading-none cursor-default">{countryFlag(profile.nationality)}</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">{getCountryName(profile.nationality)}</TooltipContent>
                    </Tooltip>
                  )}
                  {profile.show_nationality !== false && profile.second_nationality && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-lg leading-none cursor-default">{countryFlag(profile.second_nationality)}</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">{getCountryName(profile.second_nationality)}</TooltipContent>
                    </Tooltip>
                  )}
                  {userAwards?.map((ua: any) => {
                    const award = ua.global_awards_system;
                    if (!award?.logo_url) return null;
                    return (
                      <Tooltip key={ua.id}>
                        <TooltipTrigger asChild>
                          <img src={award.logo_url} alt={isAr ? (award.name_ar || award.name) : award.name}
                            className="h-5 w-5 object-contain cursor-pointer hover:scale-110 transition-transform" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">{isAr ? (award.name_ar || award.name) : award.name}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">@{profile.username}</p>

                {currentWork && (
                  <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-lg px-3 py-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold">{isAr ? (currentWork.title_ar || currentWork.title) : currentWork.title}</span>
                    {currentWork.entity_name && (
                      <span className="text-[11px] text-muted-foreground">{isAr ? "في" : "at"} {currentWork.entity_name}</span>
                    )}
                  </div>
                )}

                {(profile.country_code || profile.location) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center md:justify-start">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    {profile.country_code ? `${countryFlag(profile.country_code)} ` : ""}
                    {[profile.city, getCountryName(profile.country_code)].filter(Boolean).join(", ") || profile.location}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                  {roles?.map((role: string) => (
                    <Badge key={role} variant="secondary" className="text-[10px] h-5">{isAr ? roleLabels[role]?.ar || role : roleLabels[role]?.en || role}</Badge>
                  ))}
                  {profile.membership_tier && profile.membership_tier !== "basic" && (
                    <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
                      {profile.membership_tier === "professional" ? (isAr ? "محترف" : "Pro") : profile.membership_tier}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {user && !isOwnProfile && followPrivacy !== "private" && (
                  <Button
                    variant={isFollowing ? "outline" : pendingRequest ? "secondary" : "default"}
                    size="sm"
                    onClick={() => { if (pendingRequest) return; toggleFollow.mutate(!!isFollowing); }}
                    disabled={toggleFollow.isPending || !!pendingRequest || isFollowing === undefined}
                    className="w-full min-w-[120px]"
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
                  <Badge variant="secondary" className="text-xs gap-1"><Lock className="h-3 w-3" />{isAr ? "حساب خاص" : "Private"}</Badge>
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
  );
}
