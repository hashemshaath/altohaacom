import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Star, Shield, Check, ArrowUpCircle, Calendar, AlertTriangle, RefreshCw, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useVerificationStatus } from "@/hooks/useVerification";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProfileMembershipTabProps {
  profile: any;
  userId: string;
  onMembershipChange?: () => void;
}

export function ProfileMembershipTab({ profile, userId, onMembershipChange }: ProfileMembershipTabProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: verificationStatus } = useVerificationStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upgradeMutation = useMutation({
    mutationFn: async (newTier: "basic" | "professional" | "enterprise") => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const prevTier = (profile?.membership_tier || "basic") as "basic" | "professional" | "enterprise";

      // Record history
      await supabase.from("membership_history").insert([{
        user_id: userId,
        previous_tier: prevTier,
        new_tier: newTier,
      }]);

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          membership_tier: newTier,
          membership_status: "active",
          membership_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
      return newTier;
    },
    onSuccess: (newTier) => {
      queryClient.invalidateQueries({ queryKey: ["membership-history", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile-membership", userId] });
      onMembershipChange?.();
      toast({
        title: isAr ? "تم تحديث العضوية!" : "Membership updated!",
        description: isAr
          ? `تم ترقية عضويتك إلى ${newTier === "professional" ? "احترافي" : newTier === "enterprise" ? "مؤسسي" : "أساسي"}`
          : `Your membership has been changed to ${newTier}`,
      });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const { data: history } = useQuery({
    queryKey: ["membership-history", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("membership_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const currentTier = profile?.membership_tier || "basic";
  const expiresAt = profile?.membership_expires_at;
  const status = profile?.membership_status || "active";
  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  const tiers = [
    {
      id: "basic",
      icon: Star,
      name: isAr ? "أساسي" : "Basic",
      price: isAr ? "مجاني" : "Free",
      color: "border-border",
      features: isAr
        ? ["إنشاء ملف شخصي", "الانضمام للمجتمع", "متابعة الطهاة", "عرض المسابقات"]
        : ["Create profile", "Join community", "Follow chefs", "View competitions"],
    },
    {
      id: "professional",
      icon: Crown,
      name: isAr ? "احترافي" : "Professional",
      price: "SAR 19/" + (isAr ? "شهر" : "month"),
      color: "border-primary",
      featured: true,
      features: isAr
        ? ["جميع مميزات الأساسية", "شارة التوثيق", "دعم ذو أولوية", "إنشاء مجموعات خاصة", "تحليلات متقدمة", "وصول مبكر للمسابقات", "إضافة فعاليات"]
        : ["All Basic features", "Verified badge", "Priority support", "Create private groups", "Advanced analytics", "Early competition access", "Add events"],
    },
    {
      id: "enterprise",
      icon: Shield,
      name: isAr ? "مؤسسي" : "Enterprise",
      price: "SAR 99/" + (isAr ? "شهر" : "month"),
      color: "border-chart-2",
      features: isAr
        ? ["جميع مميزات الاحترافية", "علامة تجارية مخصصة", "وصول API", "مدير حساب مخصص", "أعضاء فريق غير محدودين", "تقارير مخصصة"]
        : ["All Professional features", "Custom branding", "API access", "Dedicated account manager", "Unlimited team members", "Custom reports"],
    },
  ];

  const currentTierObj = tiers.find((t) => t.id === currentTier) || tiers[0];
  const TierIcon = currentTierObj.icon;

  const profileCompletion = [
    profile?.full_name,
    profile?.bio,
    profile?.specialization || profile?.job_title,
    profile?.avatar_url,
    profile?.location || profile?.country_code,
    profile?.phone,
    profile?.instagram || profile?.twitter || profile?.linkedin,
  ].filter(Boolean).length;
  const completionPercent = Math.round((profileCompletion / 7) * 100);

  return (
    <div className="space-y-6">
      {/* Current Membership Status */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 p-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TierIcon className="h-5 w-5 text-primary" />
                {isAr ? "عضويتك الحالية" : "Your Current Membership"}
              </CardTitle>
              <Badge className={currentTier === "professional" ? "bg-primary/20 text-primary" : currentTier === "enterprise" ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground"}>
                {currentTierObj.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-3 text-center">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "الحالة" : "Status"}</p>
                <Badge variant={isExpired ? "destructive" : status === "active" ? "default" : "secondary"} className="mt-1">
                  {isExpired ? (isAr ? "منتهية" : "Expired") : status === "active" ? (isAr ? "نشطة" : "Active") : status}
                </Badge>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "تنتهي في" : "Expires"}</p>
                <p className="mt-1 text-sm font-semibold">
                  {expiresAt ? format(new Date(expiresAt), "d MMM yyyy", { locale: isAr ? ar : undefined }) : (isAr ? "غير محدد" : "N/A")}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3 text-center">
                <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{isAr ? "أيام متبقية" : "Days Left"}</p>
                <p className={`mt-1 text-sm font-bold ${daysLeft !== null && daysLeft < 30 ? "text-destructive" : ""}`}>
                  {daysLeft !== null ? daysLeft : "∞"}
                </p>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">{isAr ? "اكتمال الملف الشخصي" : "Profile Completion"}</p>
                <span className="text-xs font-bold text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
            </div>

            {/* Verification Status */}
            <div className="rounded-lg border p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isAr ? "حالة التوثيق" : "Verification Status"}</p>
                <p className="text-xs text-muted-foreground">
                  {verificationStatus?.is_verified
                    ? (isAr ? "حسابك موثق ✓" : "Your account is verified ✓")
                    : (isAr ? "حسابك غير موثق" : "Your account is not verified")}
                </p>
              </div>
              {!verificationStatus?.is_verified && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/verify">{isAr ? "توثيق الحساب" : "Verify Account"}</Link>
                </Button>
              )}
            </div>

            {/* Actions */}
            {isExpired && (
              <Button className="w-full gap-2" onClick={() => upgradeMutation.mutate((currentTier || "basic") as "basic" | "professional" | "enterprise")} disabled={upgradeMutation.isPending}>
                {upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isAr ? "تجديد العضوية" : "Renew Membership"}
              </Button>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="mb-4 font-semibold">{isAr ? "الخطط المتاحة" : "Available Plans"}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const isCurrentTier = tier.id === currentTier;
            return (
              <Card key={tier.id} className={`relative transition-all ${tier.featured ? "ring-2 ring-primary shadow-lg" : ""} ${isCurrentTier ? "bg-primary/5" : ""}`}>
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary"><Star className="me-1 h-3 w-3" />{isAr ? "الأكثر شعبية" : "Popular"}</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <tier.icon className={`mx-auto h-8 w-8 mb-2 ${tier.id === "enterprise" ? "text-chart-2" : "text-primary"}`} />
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <p className="text-2xl font-bold">{tier.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrentTier ? (
                    <Button variant="outline" disabled className="w-full">{isAr ? "خطتك الحالية" : "Current Plan"}</Button>
                  ) : (
                    <Button
                      variant={tier.featured ? "default" : "outline"}
                      className="w-full gap-1.5"
                      disabled={upgradeMutation.isPending}
                      onClick={() => upgradeMutation.mutate(tier.id as "basic" | "professional" | "enterprise")}
                    >
                      {upgradeMutation.isPending && upgradeMutation.variables === tier.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4" />
                      )}
                      {isAr ? (tier.id === "basic" ? "تخفيض" : "ترقية") : (tier.id === "basic" ? "Downgrade" : "Upgrade")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Membership History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isAr ? "سجل العضوية" : "Membership History"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <span className="font-medium">{h.previous_tier || "—"}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="font-medium text-primary">{h.new_tier}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(h.created_at), "d MMM yyyy", { locale: isAr ? ar : undefined })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membership Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isAr ? "شروط العضوية" : "Membership Terms"}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• {isAr ? "يتم تجديد العضوية تلقائياً ما لم يتم إلغاؤها" : "Memberships auto-renew unless cancelled"}</p>
          <p>• {isAr ? "يمكن الإلغاء في أي وقت مع إمكانية الاسترداد خلال 14 يوم" : "Cancel anytime with 14-day refund window"}</p>
          <p>• {isAr ? "الترقية تبدأ فوراً والتخفيض يبدأ في الدورة التالية" : "Upgrades take effect immediately; downgrades at next cycle"}</p>
          <p>• {isAr ? "العضوية المؤسسية تتطلب حساب شركة موثق" : "Enterprise requires verified company account"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
