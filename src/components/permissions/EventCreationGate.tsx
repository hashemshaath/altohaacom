import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useVerificationStatus } from "@/hooks/useVerification";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Crown, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface EventCreationGateProps {
  children: React.ReactNode;
  eventType: "competition" | "exhibition";
}

export function EventCreationGate({ children, eventType }: EventCreationGateProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: verificationStatus, isLoading: verLoading } = useVerificationStatus();

  const { data: profile, isLoading: profLoading } = useQuery({
    queryKey: ["profile-membership", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier, membership_status, is_verified")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
  });

  if (verLoading || profLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isVerified = verificationStatus?.is_verified || profile?.is_verified;
  const tier = profile?.membership_tier || "basic";
  const hasProTier = tier === "professional" || tier === "enterprise";
  const canCreate = isVerified && hasProTier;

  if (canCreate) {
    return <>{children}</>;
  }

  const eventLabel = eventType === "competition"
    ? (isAr ? "مسابقة" : "competition")
    : (isAr ? "فعالية" : "event");

  return (
    <div className="mx-auto max-w-lg py-12">
      <Card className="border-destructive/20">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-lg">
            {isAr ? `لا يمكنك إنشاء ${eventLabel}` : `Cannot Create ${eventType === "competition" ? "Competition" : "Event"}`}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? `لإنشاء ${eventLabel}، يجب أن يكون حسابك موثقاً وأن تمتلك عضوية احترافية أو مؤسسية.`
              : `To create a ${eventLabel}, your account must be verified and you need a Professional or Enterprise membership.`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verification Status */}
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${isVerified ? "text-chart-5" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-medium">{isAr ? "توثيق الحساب" : "Account Verification"}</p>
                <p className="text-xs text-muted-foreground">
                  {isVerified
                    ? (isAr ? "حسابك موثق ✓" : "Verified ✓")
                    : (isAr ? "حسابك غير موثق" : "Not verified")}
                </p>
              </div>
            </div>
            {!isVerified && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/verify">
                  {isAr ? "توثيق" : "Verify"}
                  <ArrowRight className="ms-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          {/* Membership Status */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Crown className={`h-5 w-5 ${hasProTier ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className="text-sm font-medium">{isAr ? "العضوية" : "Membership"}</p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "الخطة الحالية:" : "Current plan:"}{" "}
                  <Badge variant="secondary" className="text-[10px] ms-1">
                    {tier === "professional" ? (isAr ? "احترافي" : "Professional")
                      : tier === "enterprise" ? (isAr ? "مؤسسي" : "Enterprise")
                      : (isAr ? "أساسي" : "Basic")}
                  </Badge>
                </p>
              </div>
            </div>
            {!hasProTier && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile" state={{ tab: "membership" }}>
                  {isAr ? "ترقية" : "Upgrade"}
                  <ArrowRight className="ms-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            {isAr
              ? "أكمل الخطوات أعلاه للحصول على صلاحية إنشاء الفعاليات والمسابقات."
              : "Complete the steps above to unlock event and competition creation."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
