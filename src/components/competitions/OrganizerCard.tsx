import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, ExternalLink } from "lucide-react";

interface OrganizerCardProps {
  organizerId: string;
}

export function OrganizerCard({ organizerId }: OrganizerCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: organizer } = useQuery({
    queryKey: ["organizer-profile", organizerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, specialization, is_verified")
        .eq("user_id", organizerId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (!organizer) return null;

  const initials = organizer.full_name
    ? organizer.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10">
            <User className="h-3.5 w-3.5 text-chart-3" />
          </div>
          {isAr ? "المنظم" : "Organizer"}
        </h3>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={organizer.avatar_url || undefined} alt={organizer.full_name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{organizer.full_name || (isAr ? "منظم" : "Organizer")}</p>
              {organizer.is_verified && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">✓</Badge>
              )}
            </div>
            {organizer.specialization && (
              <p className="text-[11px] text-muted-foreground truncate">{organizer.specialization}</p>
            )}
            {organizer.username && (
              <p className="text-[10px] text-muted-foreground">@{organizer.username}</p>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full mt-3">
          <Link to={`/profile/${organizer.username || organizer.user_id}`}>
            <ExternalLink className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "عرض الملف الشخصي" : "View Profile"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
