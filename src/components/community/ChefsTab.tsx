import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Search, MapPin, ChefHat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { countryFlag } from "@/lib/countryFlag";
import { FollowButton } from "./FollowButton";
import { ChefBadge } from "./ChefBadge";
import { MessageButton } from "./MessageButton";

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

    const { data: rolesData } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
    const rolesMap = new Map(rolesData?.map((r) => [r.user_id, r.role]) || []);

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
    }));

    setChefs(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchChefs();
  }, [user]);

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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
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
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filteredChefs.map((chef) => (
          <Card key={chef.user_id} className="group border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-border/50 active:scale-[0.98] h-full">
            <CardContent className="p-4 h-full">
              <div className="flex flex-col items-center text-center gap-3 h-full">
                <Link to={`/${chef.username || chef.user_id}`} className="shrink-0">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/15 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/30 group-hover:shadow-lg">
                    <AvatarImage src={chef.avatar_url || undefined} alt={chef.full_name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {(chef.full_name || "C")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 w-full flex-1 space-y-1">
                  <Link to={`/${chef.username || chef.user_id}`} className="block">
                    <h3 className="truncate text-sm font-bold group-hover:text-primary transition-colors leading-tight inline-flex items-center gap-1">
                      {chef.full_name || "Chef"}
                      <ChefBadge userId={chef.user_id} />
                    </h3>
                  </Link>
                  {chef.role && (
                    <Badge variant="secondary" className="capitalize text-[10px] px-2">
                      {t(chef.role as any)}
                    </Badge>
                  )}
                  {chef.specialization && (
                    <p className="flex items-center justify-center gap-1 truncate text-[11px] text-muted-foreground">
                      <ChefHat className="h-3 w-3 shrink-0" />
                      {chef.specialization}
                    </p>
                  )}
                  {chef.location && (
                    <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {chef.country_code ? `${countryFlag(chef.country_code)} ` : ""}{chef.location}
                    </p>
                  )}
                </div>
                {user && (
                  <div className="flex items-center gap-1.5 w-full">
                    <FollowButton userId={chef.user_id} userName={chef.full_name || undefined} fullWidth />
                    <MessageButton userId={chef.user_id} variant="outline" size="sm" />
                  </div>
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
