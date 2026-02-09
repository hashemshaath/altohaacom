import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Search, UserPlus, UserMinus, MapPin, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChefProfile {
  user_id: string;
  full_name: string | null;
  specialization: string | null;
  experience_level: string | null;
  location: string | null;
  role: string | null;
  is_following: boolean;
}

export function ChefsTab() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [chefs, setChefs] = useState<ChefProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isAr = language === "ar";

  const fetchChefs = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, specialization, experience_level, location")
      .neq("user_id", user?.id || "")
      .limit(50);

    if (error) {
      console.error("Error fetching chefs:", error);
      setLoading(false);
      return;
    }

    const userIds = profiles?.map((p) => p.user_id) || [];

    const [rolesRes, followingRes] = await Promise.all([
      supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      user
        ? supabase.from("connections").select("following_id").eq("follower_id", user.id).in("following_id", userIds)
        : { data: [] },
    ]);

    const rolesMap = new Map(rolesRes.data?.map((r) => [r.user_id, r.role]) || []);
    const followingSet = new Set(followingRes.data?.map((c) => c.following_id) || []);

    const enriched: ChefProfile[] = (profiles || []).map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      specialization: p.specialization,
      experience_level: p.experience_level,
      location: p.location,
      role: rolesMap.get(p.user_id) || null,
      is_following: followingSet.has(p.user_id),
    }));

    setChefs(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchChefs();
  }, [user]);

  const handleFollow = async (targetId: string, isFollowing: boolean) => {
    if (!user) {
      toast({ title: isAr ? "يرجى تسجيل الدخول" : "Please sign in to follow chefs" });
      return;
    }
    if (isFollowing) {
      await supabase.from("connections").delete().eq("follower_id", user.id).eq("following_id", targetId);
    } else {
      await supabase.from("connections").insert({ follower_id: user.id, following_id: targetId });
    }
    setChefs((prev) =>
      prev.map((c) => (c.user_id === targetId ? { ...c, is_following: !isFollowing } : c))
    );
  };

  const filteredChefs = chefs.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      c.full_name?.toLowerCase().includes(q) ||
      c.specialization?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredChefs.map((chef) => (
          <Card key={chef.user_id}>
            <CardContent className="flex items-center gap-3 p-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {(chef.full_name || "C")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{chef.full_name || "Chef"}</h3>
                {chef.role && (
                  <Badge variant="secondary" className="mt-0.5 capitalize text-[10px]">
                    {t(chef.role as any)}
                  </Badge>
                )}
                {chef.specialization && (
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <ChefHat className="h-3 w-3 shrink-0" />
                    {chef.specialization}
                  </p>
                )}
                {chef.location && (
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    {chef.location}
                  </p>
                )}
              </div>
              {user && (
                <Button
                  variant={chef.is_following ? "outline" : "default"}
                  size="sm"
                  className="shrink-0 gap-1 text-xs"
                  onClick={() => handleFollow(chef.user_id, chef.is_following)}
                >
                  {chef.is_following ? (
                    <UserMinus className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {chef.is_following ? t("unfollow") : t("follow")}
                  </span>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChefs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 rounded-2xl bg-muted/60 p-4">
              <User className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t("discoverChefs")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
