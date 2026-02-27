import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Award, Users, Briefcase, CheckCircle2, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PRO_BENEFITS = [
  { icon: Trophy, en: "Create & manage competitions", ar: "إنشاء وإدارة المسابقات" },
  { icon: Award, en: "Earn certificates & badges", ar: "الحصول على شهادات وشارات" },
  { icon: Users, en: "Mentor other professionals", ar: "إرشاد المحترفين الآخرين" },
  { icon: Briefcase, en: "Build your professional profile", ar: "بناء ملفك المهني" },
  { icon: Sparkles, en: "Advanced analytics & insights", ar: "تحليلات ورؤى متقدمة" },
];

const FAN_KEEPS = [
  { en: "Your favorites & follows stay intact", ar: "مفضلاتك ومتابعاتك ستبقى" },
  { en: "All your reviews & comments are preserved", ar: "جميع تقييماتك وتعليقاتك محفوظة" },
  { en: "Your wallet balance & points carry over", ar: "رصيد محفظتك ونقاطك ستنتقل معك" },
];

export function FanUpgradeBanner() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    setUpgrading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: "professional" })
        .eq("user_id", user.id);
      if (error) throw error;

      // Assign chef role
      await supabase.from("user_roles").upsert(
        { user_id: user.id, role: "chef" as any },
        { onConflict: "user_id,role" }
      );

      queryClient.invalidateQueries({ queryKey: ["accountType"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-profile"] });
      toast({ title: isAr ? "🎉 تمت الترقية بنجاح!" : "🎉 Upgraded successfully!" });
      setShowDialog(false);
    } catch {
      toast({ title: isAr ? "حدث خطأ" : "Upgrade failed", variant: "destructive" });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5 group hover:shadow-md transition-all">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/15">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">
                {isAr ? "ارتقِ إلى حساب احترافي" : "Upgrade to Professional"}
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {isAr ? "مجاني" : "Free"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr ? "افتح أدوات الإنشاء والمسابقات والتحليلات" : "Unlock creation tools, competitions & analytics"}
            </p>
          </div>
          <Button size="sm" className="shrink-0 gap-1" onClick={() => setShowDialog(true)}>
            {isAr ? "ترقية" : "Upgrade"}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {isAr ? "الترقية إلى حساب احترافي" : "Upgrade to Professional"}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? "اكتشف المزايا المتاحة للحسابات الاحترافية"
                : "Discover the benefits available to Professional accounts"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isAr ? "مزايا جديدة ستفتح لك" : "What you'll unlock"}
            </p>
            {PRO_BENEFITS.map((benefit) => (
              <div key={benefit.en} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium flex-1">{isAr ? benefit.ar : benefit.en}</p>
                <CheckCircle2 className="h-4 w-4 text-chart-5 shrink-0" />
              </div>
            ))}
          </div>

          <div className="space-y-2 py-2 border-t border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isAr ? "لا تقلق، بياناتك محفوظة" : "Don't worry, your data is safe"}
            </p>
            {FAN_KEEPS.map((item) => (
              <div key={item.en} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                <p className="text-xs text-muted-foreground">{isAr ? item.ar : item.en}</p>
              </div>
            ))}
          </div>

          <Button className="w-full gap-2 mt-2" onClick={handleUpgrade} disabled={upgrading}>
            {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            {isAr ? "ترقية الآن" : "Upgrade Now"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
