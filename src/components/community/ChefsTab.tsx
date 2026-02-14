import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Search, UserPlus, UserMinus, MapPin, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { countryFlag } from "@/lib/countryFlag";

interface ChefProfile {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  specialization: string | null;
  experience_level: string | null;
  location: string | null;
  country_code: string | null;
  nationality: string | null;
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
      .select("user_id, full_name, username, avatar_url, specialization, experience_level, location, country_code, nationality")
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
        ? supabase.from("user_follows").select("following_id").eq("follower_id", user.id).in("following_id", userIds)
        : { data: [] },
    ]);

    const rolesMap = new Map(rolesRes.data?.map((r) => [r.user_id, r.role]) || []);
    const followingSet = new Set(followingRes.data?.map((c) => c.following_id) || []);

    const enriched: ChefProfile[] = (profiles || []).map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      username: p.username,
      avatar_url: p.avatar_url,
      specialization: p.specialization,
      experience_level: p.experience_level,
      location: p.location,
      country_code: p.country_code,
      nationality: p.nationality,
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
    try {
      if (isFollowing) {
        const { error } = await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_follows").insert({ follower_id: user.id, following_id: targetId });
        if (error) throw error;
      }
      setChefs((prev) =>
        prev.map((c) => (c.user_id === targetId ? { ...c, is_following: !isFollowing } : c))
      );
    } catch (err: any) {
      console.error("Follow error:", err);
      toast({ title: isAr ? "حدث خطأ" : "Follow action failed", variant: "destructive" });
    }
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={isAr ? "ابحث عن طهاة..." : "Search chefs..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10 rounded-xl border-border/50 bg-muted/20"
        />
      </div>

      {/* Chefs Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredChefs.map((chef) => (
          <Card key={chef.user_id} className="group border-border/40 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Link to={`/${chef.username || chef.user_id}`} className="shrink-0">
                  <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm transition-transform group-hover:scale-105">
                    <AvatarImage src={chef.avatar_url || undefined} alt={chef.full_name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {(chef.full_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/${chef.username || chef.user_id}`} className="block">
                    <h3 className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
                      {chef.full_name || "Chef"}
                    </h3>
                  </Link>
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
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      {chef.country_code ? `${countryFlag(chef.country_code)} ` : ""}{chef.location}
                    </p>
                  )}
                </div>
                {user && (
                  <Button
                    variant={chef.is_following ? "outline" : "default"}
                    size="sm"
                    className="shrink-0 gap-1 text-xs h-8 rounded-lg"
                    onClick={() => handleFollow(chef.user_id, chef.is_following)}
                  >
                    {chef.is_following ? (
                      <UserMinus className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {chef.is_following ? (isAr ? "إلغاء" : "Unfollow") : (isAr ? "متابعة" : "Follow")}
                    </span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChefs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
              <User className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">{t("discoverChefs")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
