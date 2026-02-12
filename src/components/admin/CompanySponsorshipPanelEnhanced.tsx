import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Medal, Award, Package, Sparkles, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

const TIER_ICONS: Record<string, any> = {
  platinum: Crown, gold: Star, silver: Medal, bronze: Award, custom: Package,
};
const TIER_COLORS: Record<string, string> = {
  platinum: "bg-chart-3/10 text-chart-3", gold: "bg-chart-4/10 text-chart-4",
  silver: "bg-muted text-muted-foreground", bronze: "bg-chart-2/10 text-chart-2",
  custom: "bg-primary/10 text-primary",
};

interface Props {
  companyId: string;
}

export function CompanySponsorshipPanelEnhanced({ companyId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: sponsorships = [] } = useQuery({
    queryKey: ["company-sponsorships", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_sponsors")
        .select("*, competitions(title, title_ar, start_date, end_date, status), sponsorship_packages(name, name_ar, tier, price)")
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

  // Upcoming competitions for AI recommendations
  const { data: upcomingCompetitions = [] } = useQuery({
    queryKey: ["upcoming-competitions-for-sponsor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, start_date, country_code, status")
        .in("status", ["upcoming", "registration_open"])
        .order("start_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const handleAISuggestions = async () => {
    setAiLoading(true);
    try {
      const companyData = await supabase.from("companies").select("name, type, description, country_code").eq("id", companyId).single();
      const history = sponsorships.map((s: any) => ({
        competition: s.competitions?.title,
        tier: s.sponsorship_packages?.tier,
        status: s.status,
      }));
      const upcoming = upcomingCompetitions.map((c: any) => ({
        title: c.title,
        date: c.start_date,
        country: c.country_code,
      }));

      const prompt = isAr
        ? `أنت مستشار رعاية ذكي. بناءً على بيانات الشركة التالية وسجل الرعايات السابقة والمسابقات القادمة، قدم توصيات مخصصة للرعاية المستقبلية:\n\nالشركة: ${JSON.stringify(companyData.data)}\nسجل الرعايات: ${JSON.stringify(history)}\nالمسابقات القادمة: ${JSON.stringify(upcoming)}\n\nقدم 3-5 توصيات محددة مع الأسباب.`
        : `You are a smart sponsorship advisor. Based on the following company data, past sponsorship history, and upcoming competitions, provide tailored future sponsorship recommendations:\n\nCompany: ${JSON.stringify(companyData.data)}\nSponsorship History: ${JSON.stringify(history)}\nUpcoming Competitions: ${JSON.stringify(upcoming)}\n\nProvide 3-5 specific recommendations with reasons.`;

      const { data, error } = await supabase.functions.invoke("ai-translate-seo", {
        body: { text: prompt, source_lang: isAr ? "ar" : "en", optimize_seo: false, optimize_only: true },
      });
      if (error) throw error;
      setAiSuggestions(data?.optimized || (isAr ? "لم يتم الحصول على توصيات" : "No suggestions available"));
    } catch {
      toast({ variant: "destructive", title: isAr ? "فشل في الحصول على التوصيات" : "Failed to get suggestions" });
    }
    setAiLoading(false);
  };

  const invStatusColors: Record<string, string> = {
    pending: "bg-chart-4/10 text-chart-4",
    accepted: "bg-chart-5/10 text-chart-5",
    declined: "bg-destructive/10 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };

  const totalSpent = sponsorships.reduce((sum: number, s: any) => sum + Number(s.sponsorship_packages?.price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{sponsorships.length}</p>
            <p className="text-sm text-muted-foreground">{isAr ? "إجمالي الرعايات" : "Total Sponsorships"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-chart-5">{sponsorships.filter((s: any) => s.status === "active").length}</p>
            <p className="text-sm text-muted-foreground">{isAr ? "نشطة" : "Active"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-chart-4">{invitations.filter((i: any) => i.status === "pending").length}</p>
            <p className="text-sm text-muted-foreground">{isAr ? "دعوات معلقة" : "Pending Invitations"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalSpent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{isAr ? "إجمالي الإنفاق" : "Total Spent"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sponsorships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {isAr ? "سجل الرعايات" : "Sponsorship History"}
          </CardTitle>
          <CardDescription>
            {isAr ? "جميع الرعايات السابقة والحالية" : "All past and current sponsorships"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sponsorships.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "المسابقة" : "Competition"}</TableHead>
                  <TableHead>{isAr ? "الباقة" : "Package"}</TableHead>
                  <TableHead>{isAr ? "المبلغ" : "Amount"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsorships.map((s: any) => {
                  const Icon = TIER_ICONS[s.sponsorship_packages?.tier] || Package;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{isAr && s.competitions?.title_ar ? s.competitions.title_ar : s.competitions?.title || "—"}</p>
                          {s.competitions?.start_date && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(s.competitions.start_date), "MMM yyyy")}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={TIER_COLORS[s.sponsorship_packages?.tier] || ""}>
                          <Icon className="me-1 h-3 w-3" />
                          {isAr ? (s.sponsorship_packages?.name_ar || s.sponsorship_packages?.name) : s.sponsorship_packages?.name || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.sponsorship_packages?.price ? `${Number(s.sponsorship_packages.price).toLocaleString()} SAR` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
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
              <p>{isAr ? "لا توجد رعايات" : "No sponsorships found"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sponsorship Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "دعوات الرعاية" : "Sponsorship Invitations"}</CardTitle>
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
                          {isAr && inv.title_ar ? inv.title_ar : inv.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{inv.invitation_type}</p>
                      </div>
                      <Badge className={invStatusColors[inv.status] || ""}>{inv.status}</Badge>
                    </div>
                    {inv.response_notes && (
                      <div className="mt-2 rounded bg-muted p-2">
                        <p className="text-xs">{inv.response_notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {inv.created_at ? format(new Date(inv.created_at), "MMM dd, yyyy") : "—"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground text-sm">
              {isAr ? "لا توجد دعوات رعاية" : "No sponsorship invitations"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Competitions - candidates for future sponsorship */}
      {upcomingCompetitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-chart-3" />
              {isAr ? "فرص الرعاية القادمة" : "Upcoming Sponsorship Opportunities"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {upcomingCompetitions.map((comp: any) => (
                <Card key={comp.id} className="border">
                  <CardContent className="pt-4 pb-4">
                    <p className="font-medium text-sm">{isAr && comp.title_ar ? comp.title_ar : comp.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {comp.start_date && (
                        <Badge variant="outline" className="text-[10px]">
                          <Calendar className="h-3 w-3 me-1" />
                          {format(new Date(comp.start_date), "MMM yyyy")}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">{comp.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {isAr ? "توصيات الذكاء الاصطناعي" : "AI Recommendations"}
            </CardTitle>
            <Button onClick={handleAISuggestions} disabled={aiLoading} variant="outline" size="sm">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Sparkles className="h-4 w-4 me-2" />}
              {isAr ? "تحليل وتوصية" : "Analyze & Suggest"}
            </Button>
          </div>
          <CardDescription>
            {isAr ? "توصيات مخصصة بناءً على سجل الشركة والمسابقات القادمة" : "Personalized suggestions based on company history and upcoming events"}
          </CardDescription>
        </CardHeader>
        {aiSuggestions && (
          <CardContent>
            <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
              {aiSuggestions}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
