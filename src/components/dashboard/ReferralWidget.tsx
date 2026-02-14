import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Star, Users, Copy, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useReferralCode, useReferralStats } from "@/hooks/useReferral";
import { usePointsBalance } from "@/hooks/usePoints";
import { useToast } from "@/hooks/use-toast";

export function ReferralWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { data: referralCode } = useReferralCode();
  const { data: stats } = useReferralStats();
  const { data: pointsBalance } = usePointsBalance();

  const referralLink = referralCode?.code
    ? `${window.location.origin}/auth?ref=${referralCode.code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
  };

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-background to-chart-4/5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{isAr ? "ادعُ واكسب" : "Invite & Earn"}</h3>
              <p className="text-[10px] text-muted-foreground">{isAr ? "اكسب نقاطاً لكل صديق" : "Earn points per friend"}</p>
            </div>
          </div>
          <Badge className="bg-chart-4/20 text-chart-4 font-bold">
            <Star className="h-3 w-3 me-1" />
            {pointsBalance || 0}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-lg font-bold">{stats?.invitationsCount || 0}</p>
            <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "دعوات" : "Invites"}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-lg font-bold">{stats?.conversionsCount || 0}</p>
            <p className="text-[9px] text-muted-foreground uppercase">{isAr ? "تحويلات" : "Converts"}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyLink} className="flex-1 gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" />
            {isAr ? "نسخ الرابط" : "Copy Link"}
          </Button>
          <Link to="/referrals" className="flex-1">
            <Button size="sm" className="w-full gap-1.5 text-xs">
              <Share2 className="h-3.5 w-3.5" />
              {isAr ? "التفاصيل" : "Details"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
