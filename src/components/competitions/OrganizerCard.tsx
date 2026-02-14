import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, ExternalLink, Building2 } from "lucide-react";

interface OrganizerCardProps {
  organizerId: string;
  exhibitionId?: string | null;
}

export function OrganizerCard({ organizerId, exhibitionId }: OrganizerCardProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // If linked to exhibition, get the exhibition's organizer instead
  const { data: exhibition } = useQuery({
    queryKey: ["exhibition-organizer", exhibitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exhibitions")
        .select("organizer_entity_id, organizer_company_id, organizer_user_id, organizer_type, organizer_name, organizer_name_ar, organizer_logo_url, title, title_ar")
        .eq("id", exhibitionId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!exhibitionId,
  });

  // Determine the real organizer from exhibition
  const exhEntityId = exhibition?.organizer_entity_id;
  const exhCompanyId = exhibition?.organizer_company_id;
  const exhUserId = exhibition?.organizer_user_id;

  // Try to find as entity first
  const { data: entityOrganizer } = useQuery({
    queryKey: ["organizer-entity", exhEntityId],
    queryFn: async () => {
      const { data } = await supabase
        .from("culinary_entities")
        .select("id, name, name_ar, logo_url, abbreviation, type")
        .eq("id", exhEntityId!)
        .maybeSingle();
      return data;
    },
    enabled: !!exhEntityId,
  });

  // Try to find as company
  const { data: companyOrganizer } = useQuery({
    queryKey: ["organizer-company", exhCompanyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url")
        .eq("id", exhCompanyId!)
        .maybeSingle();
      return data;
    },
    enabled: !!exhCompanyId && !entityOrganizer,
  });

  // Fallback: profile-based organizer (exhibition user or competition creator)
  const effectiveUserId = exhUserId || organizerId;
  const { data: profileOrganizer } = useQuery({
    queryKey: ["organizer-profile", effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, username, specialization, is_verified")
        .eq("user_id", effectiveUserId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!effectiveUserId && !entityOrganizer && !companyOrganizer && !exhibition?.organizer_name,
  });

  // Render entity/company organizer
  if (entityOrganizer || companyOrganizer || exhibition?.organizer_name) {
    const org = entityOrganizer || companyOrganizer;
    const name = org
      ? (isAr && org.name_ar ? org.name_ar : org.name)
      : (isAr && exhibition?.organizer_name_ar ? exhibition.organizer_name_ar : exhibition?.organizer_name);
    const logo = org?.logo_url || exhibition?.organizer_logo_url;
    const abbr = entityOrganizer?.abbreviation;

    return (
      <Card className="overflow-hidden border-border/50 group transition-all duration-300 hover:shadow-md hover:border-primary/20">
        <div className="bg-gradient-to-r from-muted/50 to-transparent px-5 py-3 border-b border-border/40">
          <h3 className="flex items-center gap-2.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 ring-1 ring-primary/10 transition-transform group-hover:scale-110">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "المنظم" : "Organizer"}
          </h3>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt={name || ""} className="h-11 w-11 rounded-lg object-contain" />
            ) : (
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary/50" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{name}</p>
              {abbr && <p className="text-[10px] text-muted-foreground">{abbr}</p>}
              {entityOrganizer?.type && (
                <p className="text-[10px] text-muted-foreground">{entityOrganizer.type.replace("_", " ")}</p>
              )}
            </div>
          </div>
          {entityOrganizer && (
            <Button asChild variant="outline" size="sm" className="w-full mt-3">
              <Link to={`/entities/${entityOrganizer.id}`}>
                <ExternalLink className="me-1.5 h-3.5 w-3.5" />
                {isAr ? "عرض الجهة" : "View Organization"}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback: profile organizer
  if (!profileOrganizer) return null;

  const initials = profileOrganizer.full_name
    ? profileOrganizer.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <Card className="overflow-hidden border-border/50 group transition-all duration-300 hover:shadow-md hover:border-primary/20">
      <div className="bg-gradient-to-r from-muted/50 to-transparent px-5 py-3 border-b border-border/40">
        <h3 className="flex items-center gap-2.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/5 ring-1 ring-primary/10 transition-transform group-hover:scale-110">
            <User className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "المنظم" : "Organizer"}
        </h3>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={profileOrganizer.avatar_url || undefined} alt={profileOrganizer.full_name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">{profileOrganizer.full_name || (isAr ? "منظم" : "Organizer")}</p>
              {profileOrganizer.is_verified && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">✓</Badge>
              )}
            </div>
            {profileOrganizer.specialization && (
              <p className="text-[11px] text-muted-foreground truncate">{profileOrganizer.specialization}</p>
            )}
            {profileOrganizer.username && (
              <p className="text-[10px] text-muted-foreground">@{profileOrganizer.username}</p>
            )}
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full mt-3">
          <Link to={`/profile/${profileOrganizer.username || profileOrganizer.user_id}`}>
            <ExternalLink className="me-1.5 h-3.5 w-3.5" />
            {isAr ? "عرض الملف الشخصي" : "View Profile"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
