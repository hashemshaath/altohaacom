import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function FanSocialNetwork() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get fans who are followed by the same chefs I follow (mutual interest)
  const { data: suggestedFans = [], isLoading } = useQuery({
    queryKey: ["fan-social-suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get my followed chef IDs
      const { data: myFollows } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const myFollowedIds = myFollows?.map(f => f.following_id) || [];
      if (myFollowedIds.length === 0) return [];

      // Get other fans who follow the same chefs
      const { data: similarFollowers } = await supabase
        .from("user_follows")
        .select("follower_id")
        .in("following_id", myFollowedIds)
        .neq("follower_id", user.id)
        .limit(100);

      if (!similarFollowers || similarFollowers.length === 0) return [];

      // Count shared follows to rank similarity
      const fanCounts = new Map<string, number>();
      similarFollowers.forEach(f => {
        fanCounts.set(f.follower_id, (fanCounts.get(f.follower_id) || 0) + 1);
      });

      // Get already followed fans to exclude
      const { data: alreadyFollowed } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const alreadyFollowedSet = new Set(alreadyFollowed?.map(f => f.following_id) || []);

      // Sort by shared follows count, take top 8
      const topFanIds = [...fanCounts.entries()]
        .filter(([id]) => !alreadyFollowedSet.has(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id, count]) => ({ id, sharedCount: count }));

      if (topFanIds.length === 0) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, account_type, bio")
        .in("user_id", topFanIds.map(f => f.id));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return topFanIds
        .map(f => ({ ...profileMap.get(f.id), sharedCount: f.sharedCount }))
        .filter(f => f.user_id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <div className="h-32 rounded-xl bg-muted/50 animate-pulse" />;
  if (suggestedFans.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-2/10">
            <Users className="h-3.5 w-3.5 text-chart-2" />
          </div>
          {isAr ? "محبو طعام مثلك" : "Foodies Like You"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5">
          {suggestedFans.map((fan: any) => (
            <FanSuggestionRow key={fan.user_id} fan={fan} isAr={isAr} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FanSuggestionRow({ fan, isAr }: { fan: any; isAr: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [followed, setFollowed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!user || followed) return;
    setLoading(true);
    try {
      await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: fan.user_id,
      });
      setFollowed(true);
      queryClient.invalidateQueries({ queryKey: ["fan-social-suggestions"] });
      toast({ title: isAr ? "✅ تمت المتابعة" : "✅ Followed!" });
    } catch {
      // Already following
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-muted/40 transition-colors">
      <Link to={`/u/${fan.username}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={fan.avatar_url} />
          <AvatarFallback className="text-[10px]">{(fan.full_name || "?")[0]}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/u/${fan.username}`}>
          <p className="text-xs font-semibold truncate">{fan.full_name || fan.username}</p>
        </Link>
        <p className="text-[10px] text-muted-foreground">
          {fan.sharedCount} {isAr ? "متابَعين مشتركين" : "shared follows"}
        </p>
      </div>
      <Button
        variant={followed ? "secondary" : "outline"}
        size="sm"
        className="h-7 text-[10px] gap-1 shrink-0"
        onClick={handleFollow}
        disabled={followed || loading}
      >
        {followed ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
        {followed ? (isAr ? "تمت" : "Done") : (isAr ? "تابع" : "Follow")}
      </Button>
    </div>
  );
}
