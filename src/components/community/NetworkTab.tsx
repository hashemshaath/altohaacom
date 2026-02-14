import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNewFollowers, useFollowRecommendations, useIncomingFollowRequests, useToggleFollow, useIsFollowing } from "@/hooks/useFollow";
import { useUpdateFollowPrivacy } from "@/hooks/useFollow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus, UserMinus, UserCheck, Bell, Shield, Globe, Lock,
  Clock, Sparkles, Check, X, ChefHat, MapPin, Users,
} from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { toEnglishDigits } from "@/lib/formatNumber";

function FollowButton({ userId }: { userId: string }) {
  const { data: isFollowing } = useIsFollowing(userId);
  const toggleFollow = useToggleFollow(userId);
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className="shrink-0 gap-1 text-xs"
      disabled={toggleFollow.isPending}
      onClick={() => {
        toggleFollow.mutate(!!isFollowing, {
          onSuccess: (result: any) => {
            if (result?.type === "request_sent") {
              toast({ title: isAr ? "تم إرسال طلب المتابعة" : "Follow request sent" });
            }
          },
        });
      }}
    >
      {isFollowing ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isFollowing ? (isAr ? "إلغاء" : "Unfollow") : (isAr ? "متابعة" : "Follow")}</span>
    </Button>
  );
}

export function NetworkTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const { data: newFollowers = [], isLoading: loadingNew } = useNewFollowers();
  const { data: recommendations = [], isLoading: loadingRecs } = useFollowRecommendations();
  const { data: followRequests = [], respondToRequest } = useIncomingFollowRequests();
  const updatePrivacy = useUpdateFollowPrivacy();

  const { data: myProfile } = useQuery({
    queryKey: ["myFollowPrivacy", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("follow_privacy").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{isAr ? "يرجى تسجيل الدخول" : "Please sign in to see your network"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Follow Requests */}
      {followRequests.length > 0 && (
        <Card className="rounded-2xl border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              {isAr ? "طلبات المتابعة" : "Follow Requests"}
              <Badge variant="destructive" className="text-[10px] h-5">{followRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {followRequests.map((req: any) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <Link to={`/${req.profile?.username || req.requester_id}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={req.profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {(req.profile?.full_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/${req.profile?.username || req.requester_id}`} className="text-sm font-semibold hover:text-primary truncate block">
                    {req.profile?.full_name || (isAr ? "مستخدم" : "User")}
                  </Link>
                  {req.profile?.specialization && (
                    <p className="text-[10px] text-muted-foreground truncate">{req.profile.specialization}</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => respondToRequest.mutate({ requestId: req.id, accept: true })}
                    disabled={respondToRequest.isPending}
                  >
                    <Check className="h-3 w-3" />
                    {isAr ? "قبول" : "Accept"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => respondToRequest.mutate({ requestId: req.id, accept: false })}
                    disabled={respondToRequest.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Followers */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-chart-2" />
            {isAr ? "متابعون جدد" : "New Followers"}
            {newFollowers.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">{newFollowers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingNew ? (
            <div className="flex gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-32 rounded-xl" />)}
            </div>
          ) : newFollowers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isAr ? "لا يوجد متابعون جدد هذا الأسبوع" : "No new followers this week"}
            </p>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {newFollowers.map((f: any) => (
                  <Link key={f.user_id} to={`/${f.username || f.user_id}`}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors min-w-[120px]">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={f.avatar_url} />
                      <AvatarFallback className="bg-chart-2/10 text-chart-2 font-semibold">
                        {(f.full_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-center truncate max-w-[100px]">{f.full_name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {toEnglishDigits(new Date(f.followed_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" }))}
                    </span>
                    <FollowButton userId={f.user_id} />
                  </Link>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            {isAr ? "اقتراحات للمتابعة" : "Suggested for You"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecs ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isAr ? "لا توجد اقتراحات حالياً" : "No suggestions available right now"}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec: any) => (
                <div key={rec.user_id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <Link to={`/${rec.username || rec.user_id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={rec.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {(rec.full_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/${rec.username || rec.user_id}`} className="text-sm font-semibold hover:text-primary truncate block">
                      {rec.full_name}
                    </Link>
                    {rec.specialization && (
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <ChefHat className="h-2.5 w-2.5" />
                        {rec.specialization}
                      </p>
                    )}
                    {rec.country_code && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {countryFlag(rec.country_code)}
                      </p>
                    )}
                  </div>
                  <FollowButton userId={rec.user_id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Privacy Settings */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-chart-3" />
            {isAr ? "إعدادات الخصوصية" : "Follow Privacy"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-sm font-medium">{isAr ? "من يمكنه متابعتك" : "Who can follow you"}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "تحكم في من يمكنه متابعة حسابك" : "Control who can follow your account"}
              </p>
            </div>
            <Select
              value={myProfile?.follow_privacy || "public"}
              onValueChange={(val) => {
                updatePrivacy.mutate(val as any, {
                  onSuccess: () => toast({ title: isAr ? "تم تحديث الإعدادات" : "Privacy updated" }),
                });
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <span className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" />
                    {isAr ? "عام - الجميع" : "Public - Anyone"}
                  </span>
                </SelectItem>
                <SelectItem value="approval">
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5" />
                    {isAr ? "بموافقة" : "Approval Required"}
                  </span>
                </SelectItem>
                <SelectItem value="private">
                  <span className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    {isAr ? "خاص - لا أحد" : "Private - No one"}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
