import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const MembershipExpiryBanner = memo(function MembershipExpiryBanner({ className }: { className?: string }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const [dismissed, setDismissed] = useState(false);

  const { data: expiryInfo } = useQuery({
    queryKey: ["membershipExpiry", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("membership_tier, membership_expires_at, membership_status")
        .eq("user_id", user.id)
        .single();

      if (!data?.membership_expires_at || data.membership_tier === "basic") return null;

      const expiresAt = new Date(data.membership_expires_at);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        tier: data.membership_tier,
        expiresAt,
        daysLeft,
        isExpired: daysLeft <= 0,
        status: data.membership_status,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  if (!expiryInfo || dismissed) return null;
  if (expiryInfo.daysLeft > 14 && !expiryInfo.isExpired) return null;

  const isExpired = expiryInfo.isExpired;
  const isUrgent = expiryInfo.daysLeft <= 3;

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
        isExpired
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : isUrgent
            ? "border-chart-5/30 bg-chart-5/5 text-chart-5"
            : "border-primary/20 bg-primary/5 text-foreground",
        className
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
        isExpired ? "bg-destructive/10" : isUrgent ? "bg-chart-5/10" : "bg-primary/10"
      )}>
        {isExpired ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold">
          {isExpired
            ? (isAr ? `عضويتك ${expiryInfo.tier} انتهت` : `Your ${expiryInfo.tier} membership has expired`)
            : (isAr
                ? `عضويتك ${expiryInfo.tier} تنتهي خلال ${expiryInfo.daysLeft} ${expiryInfo.daysLeft === 1 ? "يوم" : "أيام"}`
                : `Your ${expiryInfo.tier} membership expires in ${expiryInfo.daysLeft} day${expiryInfo.daysLeft === 1 ? "" : "s"}`)}
        </p>
        <p className="text-xs text-muted-foreground">
          {isExpired
            ? (isAr ? "جدد الآن لاستعادة ميزاتك المميزة" : "Renew now to restore your premium features")
            : (isAr ? "جدد الآن لتجنب فقدان ميزاتك" : "Renew now to avoid losing your features")}
        </p>
      </div>

      <Button
        size="sm"
        variant={isExpired ? "destructive" : "default"}
        onClick={() => navigate("/membership")}
        className="shrink-0 gap-1.5 rounded-xl text-xs"
      >
        <Crown className="h-3.5 w-3.5" />
        {isAr ? "تجديد" : "Renew"}
      </Button>

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 end-1.5 p-0.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
