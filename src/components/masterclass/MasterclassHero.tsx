import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { GraduationCap, BookOpen, Users, Sparkles } from "lucide-react";

interface MasterclassHeroProps {
  totalCount: number;
  filteredCount: number;
  totalEnrollments: number;
}

export const MasterclassHero = memo(function MasterclassHero({ totalCount, filteredCount, totalEnrollments }: MasterclassHeroProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Editorial gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-chart-4/6" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.10),transparent_70%)]" />

      <div className="container relative py-5 sm:py-10 md:py-14">
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-2 sm:space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 sm:px-3.5 sm:py-1.5 ring-1 ring-primary/20">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
                {isAr ? "التعلم المهني" : "Professional Learning"}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight md:text-5xl">
              {isAr ? "الدورات التعليمية" : "Masterclasses"}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed md:text-base hidden sm:block">
              {isAr
                ? "تعلم من أفضل الطهاة والخبراء في عالم الطهي العالمي"
                : "Master the art of culinary excellence with world-renowned chefs and industry experts."}
            </p>
          </div>

          {/* Editorial stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 text-primary px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="font-bold">{filteredCount}</span>
              <span className="text-[10px]">{isAr ? "دورة" : "courses"}</span>
            </Badge>
            {totalEnrollments > 0 && (
              <Badge variant="outline" className="gap-1.5 border-chart-2/20 bg-chart-2/5 text-chart-2 px-3 py-1.5">
                <Users className="h-3.5 w-3.5" />
                <span className="font-bold">{totalEnrollments}</span>
                <span className="text-[10px]">{isAr ? "مسجل" : "enrolled"}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
