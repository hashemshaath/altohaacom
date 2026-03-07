import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export const FanRecommendationsWidget = memo(function FanRecommendationsWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: recipes = [] } = useQuery({
    queryKey: ["fan-recommended-recipes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("recipes")
        .select("id, title, title_ar, cuisine, difficulty, prep_time_minutes, image_url, slug, category")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (recipes.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-chart-4" />
          {isAr ? "وصفات مقترحة لك" : "Recommended Recipes"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.slug || recipe.id}`}
              className="group rounded-xl border border-border/40 overflow-hidden transition-all hover:shadow-md hover:border-border/60"
            >
              {recipe.image_url && (
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={recipe.image_url}
                    alt={isAr ? recipe.title_ar || recipe.title : recipe.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-2.5">
                <p className="text-sm font-medium line-clamp-1">
                  {isAr ? recipe.title_ar || recipe.title : recipe.title}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {recipe.cuisine && (
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {recipe.cuisine}
                    </Badge>
                  )}
                  {recipe.difficulty && (
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {recipe.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
