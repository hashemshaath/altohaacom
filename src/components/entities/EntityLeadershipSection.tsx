import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Crown, User, Shield, Star } from "lucide-react";

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

function getPositionStyle(type: string) {
  if (type === "president") return "ring-chart-4/30 bg-chart-4/10";
  if (type === "vice_president" || type === "director") return "ring-primary/30 bg-primary/10";
  if (type === "honorary_president") return "ring-chart-5/30 bg-chart-5/10";
  if (type === "secretary_general") return "ring-chart-3/30 bg-chart-3/10";
  return "ring-border bg-muted/50";
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
        .from("entity_positions" as any)
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
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </section>
    );
  }

  const hasPositions = positions && positions.length > 0;
  const hasFallbackNames = presidentName || secretaryName;

  if (!hasPositions && !hasFallbackNames) return null;

  // Group positions
  const executive = positions?.filter(p => executiveTypes.includes(p.position_type)) || [];
  const honorary = positions?.filter(p => honoraryTypes.includes(p.position_type)) || [];
  const board = positions?.filter(p => !executiveTypes.includes(p.position_type) && !honoraryTypes.includes(p.position_type)) || [];

  const renderCard = (pos: any) => {
    const profile = pos.profiles as any;
    const displayName = isAr && profile?.full_name_ar ? profile.full_name_ar : profile?.full_name || "—";
    const label = positionLabels[pos.position_type];
    const posTitle = pos.position_title
      ? (isAr && pos.position_title_ar ? pos.position_title_ar : pos.position_title)
      : (label ? (isAr ? label.ar : label.en) : pos.position_type);
    const Icon = getPositionIcon(pos.position_type);
    const style = getPositionStyle(pos.position_type);
    const username = profile?.username;

    const cardContent = (
      <Card className={`group overflow-hidden transition-all hover:shadow-md ${username ? "cursor-pointer" : ""}`}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-2 ${style}`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <Icon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{displayName}</p>
            <Badge variant="secondary" className="mt-1 text-[10px] font-medium">
              {posTitle}
            </Badge>
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
          {cardContent}
        </Link>
      );
    }

    return <div key={pos.id}>{cardContent}</div>;
  };

  // Fallback cards for president/secretary if no positions exist
  const renderFallbackCard = (name: string, role: string, icon: typeof Crown) => {
    const Icon = icon;
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-2 ring-chart-4/30 bg-chart-4/10">
            <Icon className="h-6 w-6 text-chart-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            <Badge variant="secondary" className="mt-1 text-[10px] font-medium">{role}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderGroup = (title: string, items: any[]) => {
    if (!items.length) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(renderCard)}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-4/10">
          <Crown className="h-4 w-4 text-chart-4" />
        </div>
        {isAr ? "الهيكل القيادي" : "Leadership"}
      </h2>

      {hasPositions ? (
        <div className="space-y-5">
          {renderGroup(isAr ? "المناصب التنفيذية" : "Executive", executive)}
          {renderGroup(isAr ? "المناصب الفخرية والاستشارية" : "Honorary & Advisory", honorary)}
          {renderGroup(isAr ? "أعضاء مجلس الإدارة" : "Board Members", board)}
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
