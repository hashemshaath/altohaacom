import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
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
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [unfollowText, setUnfollowText] = useState("");

  const handleFollowClick = () => {
    if (pendingRequest) return;
    if (isFollowing) {
      setShowUnfollowConfirm(true);
      setUnfollowText("");
    } else {
      toggleFollow.mutate(false);
    }
  };

  const confirmUnfollow = () => {
    toggleFollow.mutate(true);
    setShowUnfollowConfirm(false);
    setUnfollowText("");
  };

  const unfollowConfirmWord = isAr ? "إلغاء" : "unfollow";

  return (
    <section className="relative overflow-hidden">
      {/* Cover */}
      <div className="h-48 sm:h-60 md:h-72 relative overflow-hidden">
        {profile.cover_image_url ? (
          <img src={profile.cover_image_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-chart-3/12 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_40%,hsl(var(--primary)/0.12),transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_60%,hsl(var(--chart-3)/0.10),transparent_55%)]" />
            <div className="absolute top-10 start-1/3 h-48 w-48 rounded-full bg-primary/6 blur-[100px] animate-pulse" />
            <div className="absolute bottom-0 end-1/4 h-40 w-40 rounded-full bg-chart-3/6 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Profile Card */}
      <div className="relative z-10 -mt-20 md:-mt-24 px-3 sm:px-4 md:px-6 max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border-border/25 shadow-xl rounded-2xl backdrop-blur-xl bg-card/90 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6" dir={isAr ? "rtl" : "ltr"}>
              {/* Avatar - Premium circular design */}
              <div className="-mt-20 md:-mt-24 shrink-0 relative group">
                <div className="relative">
                  {/* Outer glow ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/40 via-primary/20 to-chart-3/30 blur-sm opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full ring-4 ring-background shadow-2xl overflow-hidden border-2 border-border/20 transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-primary/15">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-4xl md:text-5xl font-bold font-serif">
                        {displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                {profile.is_verified && (
                  <div className="absolute -bottom-0.5 -end-0.5 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg ring-2 ring-background">
                    <BadgeCheck className="h-3.5 w-3.5" />
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
                  <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-3 py-1.5">
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

                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                  {roles?.map((role: string) => (
                    <Badge key={role} variant="secondary" className="text-[10px] h-5 rounded-lg">{isAr ? roleLabels[role]?.ar || role : roleLabels[role]?.en || role}</Badge>
                  ))}
                  {profile.membership_tier && profile.membership_tier !== "basic" && (
                    <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary rounded-lg">
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
                    onClick={handleFollowClick}
                    disabled={toggleFollow.isPending || !!pendingRequest || isFollowing === undefined}
                    className={`w-full min-w-[130px] rounded-xl transition-all duration-300 ${
                      isFollowing ? "hover:border-destructive/50 hover:text-destructive" : ""
                    }`}
                  >
                    {toggleFollow.isPending ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> :
                      isFollowing ? <UserMinus className="me-1.5 h-3.5 w-3.5" /> :
                      pendingRequest ? <Clock className="me-1.5 h-3.5 w-3.5" /> :
                      <UserPlus className="me-1.5 h-3.5 w-3.5" />}
                    {isFollowing ? (isAr ? "متابَع" : "Following") :
                     pendingRequest ? (isAr ? "في الانتظار" : "Pending") :
                     (isAr ? "متابعة" : "Follow")}
                  </Button>
                )}
                {user && !isOwnProfile && followPrivacy === "private" && (
                  <Badge variant="secondary" className="text-xs gap-1 rounded-xl px-3 py-1.5"><Lock className="h-3 w-3" />{isAr ? "حساب خاص" : "Private"}</Badge>
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

      {/* Unfollow Confirmation - requires typing "unfollow" */}
      <AlertDialog open={showUnfollowConfirm} onOpenChange={(open) => { setShowUnfollowConfirm(open); if (!open) setUnfollowText(""); }}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <UserMinus className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">
              {isAr ? `إلغاء متابعة ${displayName}؟` : `Unfollow ${displayName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              {isAr
                ? "لن تتمكن من رؤية منشوراتهم وتحديثاتهم. يمكنك إعادة المتابعة لاحقاً."
                : "You will no longer see their posts and updates in your feed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              {isAr
                ? `اكتب "${unfollowConfirmWord}" للتأكيد`
                : `Type "${unfollowConfirmWord}" to confirm`}
            </p>
            <Input
              value={unfollowText}
              onChange={(e) => setUnfollowText(e.target.value)}
              placeholder={unfollowConfirmWord}
              className="text-center text-sm h-9 rounded-xl"
              autoFocus
            />
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-1">
            <AlertDialogCancel className="rounded-xl">
              {isAr ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfollow}
              disabled={unfollowText.toLowerCase() !== unfollowConfirmWord.toLowerCase()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl disabled:opacity-40"
            >
              {isAr ? "إلغاء المتابعة" : "Unfollow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
