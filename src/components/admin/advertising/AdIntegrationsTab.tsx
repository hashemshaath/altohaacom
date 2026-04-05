import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2 } from "lucide-react";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";
import { MetaPixelPanel } from "@/components/ads/MetaPixelPanel";
import { TikTokPixelPanel } from "@/components/ads/TikTokPixelPanel";
import { SnapPixelPanel } from "@/components/ads/SnapPixelPanel";

const INTEGRATIONS = [
  { key: "google", label: "Google Ads", labelAr: "إعلانات جوجل" },
  { key: "meta", label: "Meta Pixel", labelAr: "بكسل ميتا" },
  { key: "tiktok", label: "TikTok Pixel", labelAr: "بكسل تيك توك" },
  { key: "snap", label: "Snap Pixel", labelAr: "بكسل سناب شات" },
];

export const AdIntegrationsTab = memo(function AdIntegrationsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-chart-1/20 bg-chart-1/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="h-4 w-4 text-chart-1" />
            <div className="flex-1">
              <p className="text-xs font-semibold">{isAr ? "تتبع الأداء عبر المنصات" : "Cross-Platform Tracking"}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "ربط بكسلات التتبع لتحليل أداء الحملات عبر المنصات المختلفة" : "Connect tracking pixels to analyze campaign performance across platforms"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {INTEGRATIONS.map(int => (
              <Badge key={int.key} variant="outline" className="text-[10px] gap-1 rounded-xl">
                {isAr ? int.labelAr : int.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <GoogleIntegrationPanel />
        <MetaPixelPanel />
        <TikTokPixelPanel />
        <SnapPixelPanel />
      </div>
    </div>
  );
});
