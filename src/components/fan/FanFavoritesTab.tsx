import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFanFavorites } from "@/hooks/useFanFavorites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ChefHat, UtensilsCrossed, HeartOff, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";

export const FanFavoritesTab = memo(function FanFavoritesTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { favorites, toggleFavorite } = useFanFavorites();

  const chefIds = favorites.filter((f) => f.entity_type === "chef").map((f) => f.entity_id);
  const recipeIds = favorites.filter((f) => f.entity_type === "recipe").map((f) => f.entity_id);

  const { data: chefs = [] } = useQuery({
    queryKey: ["fan-fav-chefs", chefIds],
    queryFn: async () => {
      if (chefIds.length === 0) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, specialization")
        .in("user_id", chefIds);
      return data || [];
    },
    enabled: chefIds.length > 0,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["fan-fav-recipes", recipeIds],
    queryFn: async () => {
      if (recipeIds.length === 0) return [];
      const { data } = await supabase
        .from("recipes")
        .select("id, title, title_ar, cuisine, image_url, slug, difficulty")
        .in("id", recipeIds);
      return data || [];
    },
    enabled: recipeIds.length > 0,
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="chefs">
        <TabsList>
          <TabsTrigger value="chefs" className="gap-1.5">
            <ChefHat className="h-3.5 w-3.5" />
            {isAr ? "الطهاة" : "Chefs"} ({chefs.length})
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            {isAr ? "الوصفات" : "Recipes"} ({recipes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chefs" className="mt-4">
          {chefs.length === 0 ? (
            <EmptyState
              icon={Users}
              title={isAr ? "لم تضف طهاة للمفضلة" : "No favorite chefs yet"}
              desc={isAr ? "تصفح الطهاة وأضفهم للمفضلة" : "Browse chefs and add them to favorites"}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {chefs.map((chef) => (
                <Card key={chef.user_id} className="group transition-all hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Link to={`/${chef.username || chef.user_id}`}>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chef.avatar_url || undefined} />
                        <AvatarFallback>{(chef.full_name || "C")[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/${chef.username || chef.user_id}`} className="hover:underline">
                        <p className="font-medium text-sm truncate">{chef.full_name || chef.username}</p>
                      </Link>
                      {chef.specialization && (
                        <p className="text-xs text-muted-foreground truncate">{chef.specialization}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => navigator.share?.({ title: chef.full_name || "Chef", url: `${window.location.origin}/${chef.username || chef.user_id}` })}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => toggleFavorite.mutate({ type: "chef", entityId: chef.user_id })}
                      >
                        <HeartOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recipes" className="mt-4">
          {recipes.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title={isAr ? "لم تضف وصفات للمفضلة" : "No favorite recipes yet"}
              desc={isAr ? "تصفح الوصفات وأضفها للمفضلة" : "Browse recipes and add them to favorites"}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipes/${recipe.slug || recipe.id}`}
                  className="group rounded-xl border border-border/40 overflow-hidden transition-all hover:shadow-md"
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
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-1">
                      {isAr ? recipe.title_ar || recipe.title : recipe.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {recipe.cuisine && (
                        <Badge variant="secondary" className="text-[10px]">{recipe.cuisine}</Badge>
                      )}
                      {recipe.difficulty && (
                        <Badge variant="outline" className="text-[10px]">{recipe.difficulty}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
});
