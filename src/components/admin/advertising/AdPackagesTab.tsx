import { useIsAr } from "@/hooks/useIsAr";
import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Package, Star, ExternalLink, CheckCircle, Pencil } from "lucide-react";
import type { AdPackageRow } from "./types";

const tierColors: Record<string, string> = {
  platinum: "border-primary bg-primary/5",
  gold: "border-chart-4 bg-chart-4/5",
  silver: "border-muted-foreground bg-muted/30",
  bronze: "border-chart-3 bg-chart-3/5",
};

interface Props {
  packages: AdPackageRow[];
  onToggleActive?: (id: string, active: boolean) => void;
  onEdit?: (pkg: AdPackageRow) => void;
}

export const AdPackagesTab = memo(function AdPackagesTab({ packages, onToggleActive, onEdit }: Props) {
  const isAr = useIsAr();

  return (
    <div className="space-y-4">
      {/* Link to advertiser portal */}
      <Card className="rounded-2xl border-chart-4/20 bg-chart-4/5">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-chart-4" />
            <div>
              <p className="text-xs font-semibold">{isAr ? "بوابة المعلنين" : "Advertiser Portal"}</p>
              <p className="text-[12px] text-muted-foreground">{isAr ? "الصفحة العامة لعرض الباقات" : "Public page for displaying packages"}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl gap-1" asChild>
            <Link to="/advertise">
              {isAr ? "معاينة" : "Preview"}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`rounded-2xl border-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${tierColors[pkg.tier] || "border-border/50"}`}
          >
            <CardContent className="p-5 space-y-3">
              <div className="text-center">
                {pkg.tier === "platinum" && <Star className="h-5 w-5 text-primary mx-auto mb-1" />}
                <Badge variant={pkg.tier === "platinum" ? "default" : "secondary"} className="rounded-xl">
                  {isAr ? pkg.name_ar || pkg.name : pkg.name}
                </Badge>
                <p className="text-3xl font-bold mt-2">
                  {pkg.price.toLocaleString()}
                  <span className="text-xs text-muted-foreground ms-1">{pkg.currency || "SAR"}</span>
                </p>
                <p className="text-[12px] text-muted-foreground">{pkg.duration_days} {isAr ? "يوم" : "days"}</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-chart-2 shrink-0" />
                  <span>{pkg.max_impressions ? `${pkg.max_impressions.toLocaleString()} ${isAr ? "مشاهدة" : "impressions"}` : isAr ? "مشاهدات غير محدودة" : "Unlimited impressions"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-chart-2 shrink-0" />
                  <span>{pkg.max_clicks ? `${pkg.max_clicks.toLocaleString()} ${isAr ? "نقرة" : "clicks"}` : isAr ? "نقرات غير محدودة" : "Unlimited clicks"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-chart-2 shrink-0" />
                  <span>{pkg.max_campaigns} {isAr ? "حملة" : "campaigns"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3 w-3 text-chart-2 shrink-0" />
                  <span>{pkg.included_placements?.length || 0} {isAr ? "موقع إعلاني" : "placements"}</span>
                </div>
              </div>

              {pkg.description && (
                <p className="text-[12px] text-muted-foreground border-t border-border/40 pt-2">
                  {isAr ? pkg.description_ar || pkg.description : pkg.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={pkg.is_active}
                    onCheckedChange={(checked) => onToggleActive?.(pkg.id, checked)}
                  />
                  <span className="text-[12px] text-muted-foreground">
                    {pkg.is_active ? (isAr ? "مفعلة" : "Active") : (isAr ? "معطلة" : "Inactive")}
                  </span>
                </div>
                {onEdit && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 rounded-xl" onClick={() => onEdit(pkg)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
