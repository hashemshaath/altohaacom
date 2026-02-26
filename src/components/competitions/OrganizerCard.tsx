import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, ExternalLink, Building2 } from "lucide-react";

interface OrganizerCardProps {
  organizerId: string;
  exhibitionId?: string | null;
}

export const OrganizerCard = React.forwardRef<HTMLDivElement, OrganizerCardProps>(
  function OrganizerCard({ organizerId, exhibitionId }, ref) {
    const { language } = useLanguage();
    const isAr = language === "ar";

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

    const exhEntityId = exhibition?.organizer_entity_id;
    const exhCompanyId = exhibition?.organizer_company_id;
    const exhUserId = exhibition?.organizer_user_id;

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
        <div ref={ref} className="overflow-hidden rounded-2xl border border-border/40 bg-card">
          <div className="border-b border-border/30 bg-gradient-to-r from-muted/30 to-transparent px-5 py-3.5">
            <h3 className="flex items-center gap-2.5 font-bold text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              {isAr ? "المنظم" : "Organizer"}
            </h3>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4">
              {logo ? (
                <img src={logo} alt={name || ""} className="h-14 w-14 rounded-xl object-contain bg-muted/30 p-1.5" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-primary/8 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary/40" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{name}</p>
                {abbr && <p className="text-[11px] text-muted-foreground mt-0.5">{abbr}</p>}
                {entityOrganizer?.type && (
                  <p className="text-[11px] text-muted-foreground capitalize">{entityOrganizer.type.replace("_", " ")}</p>
                )}
              </div>
            </div>
            {entityOrganizer && (
              <Button asChild variant="outline" size="sm" className="w-full mt-4 rounded-xl h-9 text-xs font-semibold">
                <Link to={`/entities/${entityOrganizer.id}`}>
                  <ExternalLink className="me-1.5 h-3.5 w-3.5" />
                  {isAr ? "عرض الجهة" : "View Organization"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Fallback: profile organizer
    if (!profileOrganizer) return null;

    const initials = profileOrganizer.full_name
      ? profileOrganizer.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
      : "?";

    return (
      <div ref={ref} className="overflow-hidden rounded-2xl border border-border/40 bg-card">
        <div className="border-b border-border/30 bg-gradient-to-r from-muted/30 to-transparent px-5 py-3.5">
          <h3 className="flex items-center gap-2.5 font-bold text-sm">
            <User className="h-4 w-4 text-primary" />
            {isAr ? "المنظم" : "Organizer"}
          </h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={profileOrganizer.avatar_url || undefined} alt={profileOrganizer.full_name || ""} className="rounded-xl" />
              <AvatarFallback className="rounded-xl bg-primary/8 text-primary text-sm font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold truncate">{profileOrganizer.full_name || (isAr ? "منظم" : "Organizer")}</p>
                {profileOrganizer.is_verified && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">✓</Badge>
                )}
              </div>
              {profileOrganizer.specialization && (
                <p className="text-[12px] text-muted-foreground truncate mt-0.5">{profileOrganizer.specialization}</p>
              )}
              {profileOrganizer.username && (
                <p className="text-[11px] text-muted-foreground">@{profileOrganizer.username}</p>
              )}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full mt-4 rounded-xl h-9 text-xs font-semibold">
            <Link to={`/profile/${profileOrganizer.username || profileOrganizer.user_id}`}>
              <ExternalLink className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "عرض الملف الشخصي" : "View Profile"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }
);
