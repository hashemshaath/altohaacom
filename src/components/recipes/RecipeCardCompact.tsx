import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, Star, Eye, Users, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: {
    id: string;
    slug?: string | null;
    title: string;
    title_ar?: string | null;
    image_url?: string | null;
    difficulty?: string | null;
    prep_time_minutes?: number | null;
    cook_time_minutes?: number | null;
    servings?: number | null;
    average_rating?: number | null;
    view_count?: number | null;
    save_count?: number | null;
  };
  isAr: boolean;
  priority?: boolean;
}

const difficultyMap: Record<string, { en: string; ar: string; cls: string }> = {
  easy: { en: "Easy", ar: "سهل", cls: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
  medium: { en: "Medium", ar: "متوسط", cls: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  hard: { en: "Hard", ar: "صعب", cls: "bg-destructive/10 text-destructive border-destructive/20" },
};

/**
 * Compact recipe card with optimized image loading and engagement stats.
 */
export const RecipeCardCompact = memo(function RecipeCardCompact({ recipe, isAr, priority }: Props) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const diff = difficultyMap[recipe.difficulty || "medium"] || difficultyMap.medium;
  const title = isAr && recipe.title_ar ? recipe.title_ar : recipe.title;

  return (
    <Link to={`/recipes/${recipe.slug || recipe.id}`}>
      <Card className="group h-full overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 active:scale-[0.98] touch-manipulation">
        <div className="aspect-video overflow-hidden bg-muted relative">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : undefined}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-chart-3/5">
              <ChefHat className="h-10 w-10 text-primary/15 transition-transform duration-500 group-hover:scale-110" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {recipe.difficulty && (
            <Badge variant="outline" className={cn("absolute top-2 end-2 text-[12px] backdrop-blur-sm", diff.cls)}>
              {isAr ? diff.ar : diff.en}
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 text-sm font-semibold mb-1.5 group-hover:text-primary transition-colors duration-200">{title}</h3>
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground flex-wrap tabular-nums">
            {totalTime > 0 && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" /> {totalTime}{isAr ? "د" : "m"}
              </span>
            )}
            {recipe.servings != null && recipe.servings > 0 && (
              <span className="flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" /> {recipe.servings}
              </span>
            )}
            {recipe.average_rating != null && recipe.average_rating > 0 && (
              <span className="flex items-center gap-0.5 font-semibold text-chart-4">
                <Star className="h-2.5 w-2.5 fill-chart-4 text-chart-4" /> {recipe.average_rating.toFixed(1)}
              </span>
            )}
            {recipe.save_count != null && recipe.save_count > 0 && (
              <span className="flex items-center gap-0.5 ms-auto">
                <Bookmark className={cn("h-2.5 w-2.5", recipe.save_count >= 10 && "fill-primary text-primary")} /> {recipe.save_count}
              </span>
            )}
            {(recipe.save_count == null || recipe.save_count === 0) && recipe.view_count != null && recipe.view_count > 0 && (
              <span className="flex items-center gap-0.5 ms-auto">
                <Eye className="h-2.5 w-2.5" /> {recipe.view_count}
              </span>
            )}
          </div>
          {/* Quick prep indicator */}
          {totalTime > 0 && totalTime <= 15 && (
            <Badge variant="outline" className="mt-1.5 text-[12px] py-0 px-1.5 border-chart-3/30 text-chart-3">
              ⚡ {isAr ? "سريع التحضير" : "Quick prep"}
            </Badge>
          )}
          {/* Popular recipe indicator */}
          {recipe.save_count != null && recipe.save_count >= 25 && (
            <Badge variant="outline" className="mt-1.5 text-[12px] py-0 px-1.5 border-primary/30 text-primary ms-1">
              🔥 {isAr ? "وصفة شائعة" : "Popular"}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});
