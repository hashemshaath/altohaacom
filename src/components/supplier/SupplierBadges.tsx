import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Star, Zap, Award, Shield, TrendingUp } from "lucide-react";

interface SupplierBadgesProps {
  isVerified?: boolean;
  reviewCount?: number;
  avgRating?: number;
  productCount?: number;
  foundedYear?: number;
  sponsorshipCount?: number;
  variant?: "full" | "compact";
}

interface BadgeItem {
  key: string;
  icon: React.ElementType;
  label: string;
  labelAr: string;
  tooltip: string;
  tooltipAr: string;
  className: string;
  show: boolean;
}

export function SupplierBadges({
  isVerified = false,
  reviewCount = 0,
  avgRating = 0,
  productCount = 0,
  foundedYear,
  sponsorshipCount = 0,
  variant = "full",
}: SupplierBadgesProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const yearsInBusiness = foundedYear ? new Date().getFullYear() - foundedYear : 0;

  const badges: BadgeItem[] = [
    {
      key: "verified",
      icon: CheckCircle,
      label: isAr ? "موثّق" : "Verified",
      labelAr: "موثّق",
      tooltip: isAr ? "هوية الشركة تم التحقق منها" : "Company identity verified",
      tooltipAr: "هوية الشركة تم التحقق منها",
      className: "bg-chart-5/10 text-chart-5 border-chart-5/20",
      show: isVerified,
    },
    {
      key: "top-rated",
      icon: Star,
      label: isAr ? "الأعلى تقييماً" : "Top Rated",
      labelAr: "الأعلى تقييماً",
      tooltip: isAr ? `تقييم ${avgRating.toFixed(1)} من ${reviewCount} تقييم` : `${avgRating.toFixed(1)} rating from ${reviewCount} reviews`,
      tooltipAr: `تقييم ${avgRating.toFixed(1)} من ${reviewCount} تقييم`,
      className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      show: avgRating >= 4.0 && reviewCount >= 3,
    },
    {
      key: "established",
      icon: Shield,
      label: isAr ? "راسخة" : "Established",
      labelAr: "راسخة",
      tooltip: isAr ? `أكثر من ${yearsInBusiness} سنة في السوق` : `${yearsInBusiness}+ years in business`,
      tooltipAr: `أكثر من ${yearsInBusiness} سنة في السوق`,
      className: "bg-primary/10 text-primary border-primary/20",
      show: yearsInBusiness >= 10,
    },
    {
      key: "wide-catalog",
      icon: TrendingUp,
      label: isAr ? "كتالوج واسع" : "Wide Catalog",
      labelAr: "كتالوج واسع",
      tooltip: isAr ? `${productCount} منتج في الكتالوج` : `${productCount} products in catalog`,
      tooltipAr: `${productCount} منتج في الكتالوج`,
      className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      show: productCount >= 10,
    },
    {
      key: "sponsor",
      icon: Award,
      label: isAr ? "راعي فعّال" : "Active Sponsor",
      labelAr: "راعي فعّال",
      tooltip: isAr ? `راعي لـ ${sponsorshipCount} مسابقة` : `Sponsoring ${sponsorshipCount} competitions`,
      tooltipAr: `راعي لـ ${sponsorshipCount} مسابقة`,
      className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
      show: sponsorshipCount >= 1,
    },
  ];

  const activeBadges = badges.filter((b) => b.show);

  if (activeBadges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {activeBadges.map((b) => {
          const Icon = b.icon;
          return (
            <Tooltip key={b.key}>
              <TooltipTrigger asChild>
                <Badge className={`${b.className} gap-1 text-[10px] cursor-default`}>
                  <Icon className="h-3 w-3" />
                  {variant === "full" && b.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{b.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
