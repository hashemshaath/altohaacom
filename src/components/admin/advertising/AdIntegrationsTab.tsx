import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Link2 } from "lucide-react";
import { GoogleIntegrationPanel } from "@/components/ads/GoogleIntegrationPanel";
import { MetaPixelPanel } from "@/components/ads/MetaPixelPanel";
import { TikTokPixelPanel } from "@/components/ads/TikTokPixelPanel";
import { SnapPixelPanel } from "@/components/ads/SnapPixelPanel";

export const AdIntegrationsTab = memo(function AdIntegrationsTab() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-chart-1/20 bg-chart-1/5">
        <CardContent className="p-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-chart-1" />
          <div>
            <p className="text-xs font-semibold">{isAr ? "تتبع الأداء عبر المنصات" : "Cross-Platform Tracking"}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "ربط بكسلات التتبع لتحليل أداء الحملات عبر المنصات المختلفة" : "Connect tracking pixels to analyze campaign performance across platforms"}</p>
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
