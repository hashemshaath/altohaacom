import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users, Star, MapPin } from "lucide-react";
import { countryFlag } from "@/lib/countryFlag";
import { toEnglishDigits } from "@/lib/formatNumber";

const levelColors: Record<string, string> = {
  beginner: "bg-chart-3/10 text-chart-3",
  intermediate: "bg-chart-4/10 text-chart-4",
  advanced: "bg-destructive/10 text-destructive",
  all_levels: "bg-primary/10 text-primary",
};

const levelLabels: Record<string, { en: string; ar: string }> = {
  beginner: { en: "Beginner", ar: "مبتدئ" },
  intermediate: { en: "Intermediate", ar: "متوسط" },
  advanced: { en: "Advanced", ar: "متقدم" },
  all_levels: { en: "All Levels", ar: "جميع المستويات" },
};

interface MasterclassCardProps {
  mc: any;
  isEnrolled: boolean;
}

export function MasterclassCard({ mc, isEnrolled }: MasterclassCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === "ar";
  const title = isAr && mc.title_ar ? mc.title_ar : mc.title;
  const description = isAr && mc.description_ar ? mc.description_ar : mc.description;
  const moduleCount = mc.masterclass_modules?.length || 0;
  const enrollmentCount = mc.masterclass_enrollments?.length || 0;
  const reviews = mc.masterclass_reviews || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length)
    : null;

  return (
    <Card
      className="group flex h-full flex-col overflow-hidden cursor-pointer border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 hover:bg-card"
      onClick={() => navigate(`/masterclasses/${mc.id}`)}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden bg-muted">
        {mc.cover_image_url ? (
          <img
            src={mc.cover_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-chart-3/10">
            <BookOpen className="h-12 w-12 text-primary/15 animate-pulse" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Badge variant="outline" className={`text-[10px] ${levelColors[mc.level] || ""}`}>
            {isAr ? levelLabels[mc.level]?.ar : levelLabels[mc.level]?.en}
          </Badge>
          <div className="flex gap-1.5">
            {mc.is_free && (
              <Badge className="bg-chart-2/20 text-chart-2 backdrop-blur-md border-0 text-[9px] font-black uppercase tracking-wider shadow-lg">
                {isAr ? "مجاني" : "Free"}
              </Badge>
            )}
            {isEnrolled && (
              <Badge className="bg-primary/20 text-primary backdrop-blur-md border-0 text-[9px] font-black uppercase tracking-wider shadow-lg animate-pulse">
                {isAr ? "مسجل" : "Enrolled"}
              </Badge>
            )}
          </div>
        </div>

        {/* Rating */}
        {avgRating !== null && (
          <div className="absolute end-4 bottom-4">
            <Badge variant="secondary" className="gap-1.5 bg-background/80 backdrop-blur-md shadow-lg font-bold text-xs border-chart-4/30">
              <Star className="h-3 w-3 fill-chart-4 text-chart-4" />
              {toEnglishDigits(avgRating.toFixed(1))}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-base font-black line-clamp-2 group-hover:text-primary transition-colors duration-300 leading-tight">
          {title}
        </h3>
        <p className="mb-5 flex-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-muted-foreground border-t border-border/40 pt-4">
          <span className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-3 w-3 text-primary" />
            </div>
            {toEnglishDigits(moduleCount)} {isAr ? "وحدة" : "modules"}
          </span>
          {mc.duration_hours && (
            <span className="flex items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-chart-4/10">
                <Clock className="h-3 w-3 text-chart-4" />
              </div>
              {toEnglishDigits(mc.duration_hours)}h
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-chart-2/10">
              <Users className="h-3 w-3 text-chart-2" />
            </div>
            {toEnglishDigits(enrollmentCount)}
          </span>
          {mc.country_code && (
            <span className="flex items-center gap-1.5 ms-auto">
              <MapPin className="h-3 w-3 text-primary" />
              {countryFlag(mc.country_code)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
