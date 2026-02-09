import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ParticipantsListProps {
  competitionId: string;
}

interface CategoryData {
  id: string;
  name: string;
  name_ar: string | null;
}

export function ParticipantsList({ competitionId }: ParticipantsListProps) {
  const { language } = useLanguage();

  const { data: participants, isLoading } = useQuery({
    queryKey: ["competition-participants", competitionId],
    queryFn: async () => {
      // Get approved registrations
      const { data: registrations, error } = await supabase
        .from("competition_registrations")
        .select("id, participant_id, status, dish_name, category_id")
        .eq("competition_id", competitionId)
        .eq("status", "approved");

      if (error) throw error;
      if (!registrations || registrations.length === 0) return [];

      // Get participant profiles
      const userIds = registrations.map(r => r.participant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url, specialization, is_verified")
        .in("user_id", userIds);

      // Get categories
      const categoryIds = registrations.map(r => r.category_id).filter(Boolean) as string[];
      const { data: categories } = categoryIds.length > 0 
        ? await supabase
            .from("competition_categories")
            .select("id, name, name_ar")
            .in("id", categoryIds)
        : { data: [] as CategoryData[] };

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const categoryMap = new Map<string, CategoryData>((categories || []).map(c => [c.id, c]));

      return registrations.map(reg => ({
        ...reg,
        profile: profileMap.get(reg.participant_id),
        category: reg.category_id ? categoryMap.get(reg.category_id) : null,
      }));
    },
    enabled: !!competitionId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {language === "ar" ? "المشاركين" : "Participants"}
          <Badge variant="secondary" className="ml-2">
            {participants?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!participants || participants.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === "ar" ? "لا يوجد مشاركين حتى الآن" : "No participants yet"}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {participants.map((participant) => (
              <Link
                key={participant.id}
                to={`/${participant.profile?.username || participant.participant_id}`}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={participant.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {(participant.profile?.full_name || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-medium truncate">
                      {participant.profile?.full_name || "Unknown"}
                    </p>
                    {participant.profile?.is_verified && (
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  {participant.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {language === "ar" && participant.category.name_ar 
                        ? participant.category.name_ar 
                        : participant.category.name}
                    </Badge>
                  )}
                  {participant.profile?.specialization && (
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.profile.specialization}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
