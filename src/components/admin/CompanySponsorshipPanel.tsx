import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crown, Star, Medal, Award, Package } from "lucide-react";
import { format } from "date-fns";

const TIER_ICONS: Record<string, any> = {
  platinum: Crown, gold: Star, silver: Medal, bronze: Award, custom: Package,
};
const TIER_COLORS: Record<string, string> = {
  platinum: "bg-chart-3/10 text-chart-3", gold: "bg-chart-4/10 text-chart-4",
  silver: "bg-muted text-muted-foreground", bronze: "bg-chart-2/10 text-chart-2",
  custom: "bg-primary/10 text-primary",
};

interface CompanySponsorshipPanelProps {
  companyId: string;
}

export function CompanySponsorshipPanel({ companyId }: CompanySponsorshipPanelProps) {
  const { language } = useLanguage();

  const { data: sponsorships = [] } = useQuery({
    queryKey: ["company-sponsorships", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_sponsors")
        .select("*, competitions(title, title_ar), sponsorship_packages(name, tier)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["company-sponsor-invitations", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_invitations")
        .select("*")
        .eq("company_id", companyId)
        .in("invitation_type", ["sponsorship", "exhibition_sponsor", "section_sponsor"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const invStatusColors: Record<string, string> = {
    pending: "bg-chart-4/10 text-chart-4",
    accepted: "bg-chart-5/10 text-chart-5",
    declined: "bg-destructive/10 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      {/* Active Sponsorships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {language === "ar" ? "الرعايات النشطة" : "Active Sponsorships"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "المسابقات والفعاليات التي ترعاها هذه الشركة" : "Competitions and events sponsored by this company"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sponsorships.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "المسابقة" : "Competition"}</TableHead>
                  <TableHead>{language === "ar" ? "الباقة" : "Package"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsorships.map((s: any) => {
                  const Icon = TIER_ICONS[s.sponsorship_packages?.tier] || Package;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {language === "ar" && s.competitions?.title_ar
                          ? s.competitions.title_ar
                          : s.competitions?.title || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={TIER_COLORS[s.sponsorship_packages?.tier] || ""}>
                          <Icon className="mr-1 h-3 w-3" />
                          {s.sponsorship_packages?.name || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : "secondary"}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.created_at ? format(new Date(s.created_at), "MMM dd, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{language === "ar" ? "لا توجد رعايات نشطة" : "No active sponsorships"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sponsorship Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "دعوات الرعاية" : "Sponsorship Invitations"}</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {invitations.map((inv: any) => (
                <Card key={inv.id} className="border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {language === "ar" && inv.title_ar ? inv.title_ar : inv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{inv.invitation_type}</p>
                      </div>
                      <Badge className={invStatusColors[inv.status] || ""}>{inv.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {inv.created_at ? format(new Date(inv.created_at), "MMM dd, yyyy") : "—"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground text-sm">
              {language === "ar" ? "لا توجد دعوات رعاية" : "No sponsorship invitations"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
