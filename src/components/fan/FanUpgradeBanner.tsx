import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, Award, Users, Briefcase, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
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

export function FanUpgradeBanner() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [showDialog, setShowDialog] = useState(false);

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
          <div className="space-y-3 py-4">
            {PRO_BENEFITS.map((benefit) => (
              <div key={benefit.en} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{isAr ? benefit.ar : benefit.en}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-chart-5 shrink-0" />
              </div>
            ))}
          </div>
          <Button asChild className="w-full gap-2">
            <Link to="/profile?tab=account" onClick={() => setShowDialog(false)}>
              <Crown className="h-4 w-4" />
              {isAr ? "ترقية الآن" : "Upgrade Now"}
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
