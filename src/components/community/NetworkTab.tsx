import { memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNewFollowers, useFollowRecommendations, useIncomingFollowRequests } from "@/hooks/useFollow";
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
  UserPlus, UserCheck, Bell, Shield, Globe, Lock,
  Clock, Sparkles, Check, X, ChefHat, MapPin, Users,
} from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { useToast } from "@/hooks/use-toast";
import { toEnglishDigits } from "@/lib/formatNumber";
import { FollowButton } from "./FollowButton";

export const NetworkTab = memo(function NetworkTab() {
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
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <Link to={`/${req.profile?.username || req.requester_id}`}>
                  <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                    <AvatarImage src={req.profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {(req.profile?.display_name || req.profile?.full_name || "U")[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/${req.profile?.username || req.requester_id}`} className="text-sm font-bold hover:text-primary truncate block transition-colors">
                    {isAr ? (req.profile?.display_name_ar || req.profile?.full_name_ar || req.profile?.display_name || req.profile?.full_name) : (req.profile?.display_name || req.profile?.full_name) || (isAr ? "مستخدم" : "User")}
                  </Link>
                  {req.profile?.specialization && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{req.profile.specialization}</p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    className="h-8 gap-1 text-xs rounded-xl font-semibold"
                    onClick={() => respondToRequest.mutate({ requestId: req.id, accept: true })}
                    disabled={respondToRequest.isPending}
                  >
                    <Check className="h-3 w-3" />
                    {isAr ? "قبول" : "Accept"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs rounded-xl"
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
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[180px] w-[150px] rounded-xl" />)}
            </div>
          ) : newFollowers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isAr ? "لا يوجد متابعون جدد هذا الأسبوع" : "No new followers this week"}
            </p>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {newFollowers.map((f: any) => (
                  <div key={f.user_id} className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-w-[130px] w-[130px]">
                    <Link to={`/${f.username || f.user_id}`}>
                      <Avatar className="h-14 w-14 ring-2 ring-chart-2/15 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:ring-chart-2/30">
                        <AvatarImage src={f.avatar_url} />
                        <AvatarFallback className="bg-chart-2/10 text-chart-2 font-bold text-lg">
                          {(isAr ? (f.display_name_ar || f.full_name_ar || f.full_name) : (f.display_name || f.full_name) || "U")[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="min-w-0 w-full space-y-0.5 text-center">
                      {(() => {
                        const name = isAr ? (f.display_name_ar || f.full_name_ar || f.display_name || f.full_name) : (f.display_name || f.full_name);
                        return (
                          <Link to={`/${f.username || f.user_id}`} className={`font-bold hover:text-primary block transition-colors leading-tight text-center break-words ${(name || "U").length > 14 ? "text-[11px]" : "text-xs sm:text-sm"}`}>
                            {name}
                          </Link>
                        );
                      })()}
                      <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        {toEnglishDigits(new Date(f.followed_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" }))}
                      </span>
                    </div>
                    <FollowButton userId={f.user_id} userName={isAr ? (f.display_name_ar || f.full_name_ar || f.full_name) : (f.display_name || f.full_name)} fullWidth />
                  </div>
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
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[200px] rounded-xl" />)}
            </div>
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isAr ? "لا توجد اقتراحات حالياً" : "No suggestions available right now"}
            </p>
          ) : (
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {recommendations.map((rec: any) => (
                <div key={rec.user_id} className="group flex flex-col items-center text-center gap-2 p-3 rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                  <Link to={`/${rec.username || rec.user_id}`}>
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/15 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/30">
                      <AvatarImage src={rec.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {(isAr ? (rec.display_name_ar || rec.full_name_ar || rec.full_name) : (rec.display_name || rec.full_name) || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 w-full flex-1 space-y-0.5">
                    {(() => {
                      const name = isAr ? (rec.display_name_ar || rec.full_name_ar || rec.display_name || rec.full_name) : (rec.display_name || rec.full_name);
                      return (
                        <Link to={`/${rec.username || rec.user_id}`} className={`font-bold hover:text-primary block transition-colors leading-tight text-center break-words ${(name || "U").length > 14 ? "text-[11px]" : "text-xs sm:text-sm"}`}>
                          {name}
                        </Link>
                      );
                    })()}
                    {((isAr ? rec.specialization_ar : null) || rec.specialization) ? (
                      <p className="text-[11px] text-muted-foreground truncate flex items-center justify-center gap-1">
                        <ChefHat className="h-3 w-3 shrink-0" />
                        {(isAr ? rec.specialization_ar : null) || rec.specialization}
                      </p>
                    ) : null}
                    {rec.country_code && (
                      <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {countryFlag(rec.country_code)}
                      </p>
                    )}
                  </div>
                  <FollowButton userId={rec.user_id} userName={isAr ? (rec.display_name_ar || rec.full_name_ar || rec.full_name) : (rec.display_name || rec.full_name)} fullWidth />
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
