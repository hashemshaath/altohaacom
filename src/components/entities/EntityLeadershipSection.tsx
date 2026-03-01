import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Crown, User, Shield, Star, Users, Award } from "lucide-react";

const positionLabels: Record<string, { en: string; ar: string }> = {
  president: { en: "President", ar: "الرئيس" },
  vice_president: { en: "Vice President", ar: "نائب الرئيس" },
  secretary_general: { en: "Secretary General", ar: "الأمين العام" },
  treasurer: { en: "Treasurer", ar: "أمين الصندوق" },
  board_member: { en: "Board Member", ar: "عضو مجلس إدارة" },
  honorary_president: { en: "Honorary President", ar: "الرئيس الفخري" },
  honorary_member: { en: "Honorary Member", ar: "عضو فخري" },
  advisor: { en: "Advisor", ar: "مستشار" },
  director: { en: "Director", ar: "مدير" },
  deputy_director: { en: "Deputy Director", ar: "نائب المدير" },
  coordinator: { en: "Coordinator", ar: "منسق" },
  spokesperson: { en: "Spokesperson", ar: "المتحدث الرسمي" },
  member: { en: "Member", ar: "عضو" },
};

const executiveTypes = ["president", "vice_president", "secretary_general", "treasurer", "director", "deputy_director"];
const honoraryTypes = ["honorary_president", "honorary_member", "advisor", "spokesperson"];

function getPositionIcon(type: string) {
  if (type === "president" || type === "honorary_president") return Crown;
  if (type === "vice_president" || type === "director") return Shield;
  if (honoraryTypes.includes(type)) return Star;
  return User;
}

interface Props {
  entityId: string;
  presidentName?: string | null;
  secretaryName?: string | null;
}

export function EntityLeadershipSection({ entityId, presidentName, secretaryName }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: positions, isLoading } = useQuery({
    queryKey: ["entity-leadership-public", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_positions")
        .select("*, profiles:user_id(id, user_id, full_name, full_name_ar, avatar_url, experience_level, username)")
        .eq("entity_id", entityId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
            <Crown className="h-4 w-4 text-chart-4" />
          </div>
          {isAr ? "الهيكل القيادي" : "Leadership"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </section>
    );
  }

  const hasPositions = positions && positions.length > 0;
  const hasFallbackNames = presidentName || secretaryName;

  if (!hasPositions && !hasFallbackNames) return null;

  // Find the president (featured card)
  const president = positions?.find(p => p.position_type === "president");
  const otherExecutive = positions?.filter(p => executiveTypes.includes(p.position_type) && p.position_type !== "president") || [];
  const honorary = positions?.filter(p => honoraryTypes.includes(p.position_type)) || [];
  const board = positions?.filter(p => !executiveTypes.includes(p.position_type) && !honoraryTypes.includes(p.position_type)) || [];

  const getTitle = (pos: any) => {
    const label = positionLabels[pos.position_type];
    return pos.position_title
      ? (isAr && pos.position_title_ar ? pos.position_title_ar : pos.position_title)
      : (label ? (isAr ? label.ar : label.en) : pos.position_type);
  };

  const renderFeaturedCard = (pos: any) => {
    const profile = pos.profiles as any;
    const displayName = isAr && profile?.full_name_ar ? profile.full_name_ar : profile?.full_name || "—";
    const username = profile?.username;
    const title = getTitle(pos);

    const content = (
      <Card className="group overflow-hidden border-chart-4/20 bg-gradient-to-br from-chart-4/5 via-background to-background transition-all hover:shadow-lg hover:border-chart-4/40">
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl ring-2 ring-chart-4/30 overflow-hidden bg-chart-4/10 sm:h-24 sm:w-24">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Crown className="h-8 w-8 text-chart-4/60" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-xl bg-chart-4 text-chart-4-foreground shadow-md">
              <Crown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex-1 text-center sm:text-start min-w-0">
            <Badge className="mb-2 bg-chart-4/15 text-chart-4 border-chart-4/20 text-xs font-semibold">
              {title}
            </Badge>
            <h3 className="text-lg font-bold group-hover:text-chart-4 transition-colors truncate">{displayName}</h3>
            {profile?.experience_level && (
              <p className="mt-0.5 text-xs text-muted-foreground capitalize">{profile.experience_level}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );

    if (username) {
      return (
        <Link key={pos.id} to={`/profile/${username}`} className="block">
          {content}
        </Link>
      );
    }
    return <div key={pos.id}>{content}</div>;
  };

  const renderMemberCard = (pos: any) => {
    const profile = pos.profiles as any;
    const displayName = isAr && profile?.full_name_ar ? profile.full_name_ar : profile?.full_name || "—";
    const username = profile?.username;
    const title = getTitle(pos);
    const Icon = getPositionIcon(pos.position_type);

    const content = (
      <Card className="group overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden ring-1 ring-border/50 bg-muted/50">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon className="h-5 w-5 text-muted-foreground/60" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{displayName}</p>
            <Badge variant="secondary" className="mt-1 text-[10px] font-medium">{title}</Badge>
            {profile?.experience_level && (
              <p className="mt-0.5 text-[10px] text-muted-foreground capitalize">{profile.experience_level}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );

    if (username) {
      return (
        <Link key={pos.id} to={`/profile/${username}`} className="block">
          {content}
        </Link>
      );
    }
    return <div key={pos.id}>{content}</div>;
  };

  // Fallback cards for president/secretary if no positions exist
  const renderFallbackCard = (name: string, role: string, icon: typeof Crown) => {
    const Icon = icon;
    return (
      <Card className="overflow-hidden border-chart-4/20 bg-gradient-to-br from-chart-4/5 to-background">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ring-2 ring-chart-4/30 bg-chart-4/10">
            <Icon className="h-7 w-7 text-chart-4/60" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className="mb-1 bg-chart-4/15 text-chart-4 border-chart-4/20 text-[10px]">{role}</Badge>
            <p className="font-semibold truncate">{name}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroup = (title: string, icon: React.ReactNode, items: any[]) => {
    if (!items.length) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-muted">
            {icon}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <Badge variant="outline" className="text-[10px] h-5">{items.length}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(renderMemberCard)}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-5">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
          <Crown className="h-4 w-4 text-chart-4" />
        </div>
        {isAr ? "الهيكل القيادي" : "Leadership"}
        {hasPositions && (
          <Badge variant="outline" className="ms-auto text-xs">{positions.length} {isAr ? "منصب" : "positions"}</Badge>
        )}
      </h2>

      {hasPositions ? (
        <div className="space-y-6">
          {/* Featured President Card */}
          {president && renderFeaturedCard(president)}

          {/* Other Executive */}
          {renderGroup(isAr ? "المناصب التنفيذية" : "Executive Team", <Shield className="h-3.5 w-3.5 text-muted-foreground" />, otherExecutive)}

          {/* Honorary & Advisory */}
          {renderGroup(isAr ? "المناصب الفخرية والاستشارية" : "Honorary & Advisory", <Star className="h-3.5 w-3.5 text-muted-foreground" />, honorary)}

          {/* Board Members */}
          {renderGroup(isAr ? "أعضاء مجلس الإدارة" : "Board Members", <Users className="h-3.5 w-3.5 text-muted-foreground" />, board)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {presidentName && renderFallbackCard(presidentName, isAr ? "الرئيس" : "President", Crown)}
          {secretaryName && renderFallbackCard(secretaryName, isAr ? "الأمين العام" : "Secretary General", Shield)}
        </div>
      )}
    </section>
  );
}
