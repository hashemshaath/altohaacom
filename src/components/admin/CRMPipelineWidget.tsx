import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { UserSearch, TrendingUp, ArrowRight, Target, Mail, Phone, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toEnglishDigits } from "@/lib/formatNumber";

export function CRMPipelineWidget() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data } = useQuery({
    queryKey: ["crm-pipeline-overview"],
    queryFn: async () => {
      const [leadsRes, ticketsRes, companiesRes] = await Promise.all([
        supabase.from("leads").select("id, status, type, company_name, contact_name, created_at").order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("id, status, priority").limit(500),
        supabase.from("companies").select("id, status").limit(500),
      ]);

      const leads = leadsRes.data || [];
      const tickets = ticketsRes.data || [];
      const companies = companiesRes.data || [];

      // Pipeline stages
      const stages = [
        { key: "new", label: isAr ? "جديد" : "New", color: "bg-primary" },
        { key: "contacted", label: isAr ? "تم التواصل" : "Contacted", color: "bg-chart-4" },
        { key: "qualified", label: isAr ? "مؤهل" : "Qualified", color: "bg-chart-3" },
        { key: "proposal", label: isAr ? "عرض سعر" : "Proposal", color: "bg-chart-5" },
        { key: "won", label: isAr ? "ناجح" : "Won", color: "bg-chart-2" },
        { key: "lost", label: isAr ? "خسارة" : "Lost", color: "bg-destructive" },
      ];

      const pipelineData = stages.map(s => ({
        ...s,
        count: leads.filter(l => l.status === s.key).length,
      }));

      const totalValue = 0;
      const wonValue = 0;
      const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.status === "won").length / leads.length) * 100) : 0;

      // Recent hot leads
      const hotLeads = leads.filter(l => !["won", "lost"].includes(l.status)).slice(0, 5);

      // Customer satisfaction
      const urgentTickets = tickets.filter(t => t.priority === "urgent" && t.status !== "closed").length;
      const openTickets = tickets.filter(t => t.status === "open").length;
      const activeCompanies = companies.filter(c => c.status === "active").length;

      return {
        pipelineData, totalValue, wonValue, conversionRate,
        hotLeads, totalLeads: leads.length,
        urgentTickets, openTickets, activeCompanies,
      };
    },
    staleTime: 1000 * 60 * 3,
  });

  if (!data) return null;

  const maxCount = Math.max(...data.pipelineData.map(s => s.count), 1);

  return (
    <div className="space-y-4">
      {/* Pipeline Funnel */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {isAr ? "خط أنابيب المبيعات" : "Sales Pipeline"}
            <Badge variant="secondary" className="text-[10px] ms-auto">
              {data.totalLeads} {isAr ? "عميل" : "leads"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: isAr ? "القيمة الإجمالية" : "Total Value", value: `${toEnglishDigits(data.totalValue.toLocaleString())} SAR`, color: "text-primary" },
              { label: isAr ? "القيمة المحققة" : "Won Value", value: `${toEnglishDigits(data.wonValue.toLocaleString())} SAR`, color: "text-chart-2" },
              { label: isAr ? "معدل التحويل" : "Conversion", value: `${data.conversionRate}%`, color: "text-chart-5" },
            ].map((kpi, i) => (
              <div key={i} className="text-center rounded-lg border border-border/40 p-2">
                <p className={cn("text-sm font-bold", kpi.color)}>{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Funnel bars */}
          <div className="space-y-2">
            {data.pipelineData.map((stage) => (
              <div key={stage.key} className="flex items-center gap-3">
                <span className="text-[10px] w-16 text-muted-foreground text-end shrink-0">{stage.label}</span>
                <div className="flex-1 h-6 rounded bg-muted/30 overflow-hidden relative">
                  <div
                    className={cn("h-full rounded transition-all", stage.color)}
                    style={{ width: `${Math.max((stage.count / maxCount) * 100, 4)}%`, opacity: 0.8 }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                    {stage.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hot Leads + Quick Stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserSearch className="h-4 w-4 text-chart-4" />
              {isAr ? "عملاء محتملين ساخنين" : "Hot Leads"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {data.hotLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center gap-3 rounded-lg border border-border/40 p-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(lead.contact_name || lead.company_name || "L")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{lead.contact_name || lead.company_name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className={cn("text-[9px] px-1", {
                          "text-primary": lead.status === "new",
                          "text-chart-4": lead.status === "contacted",
                          "text-chart-3": lead.status === "qualified",
                        })}>
                          {lead.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {data.hotLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {isAr ? "لا توجد عملاء محتملين" : "No active leads"}
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-chart-2" />
              {isAr ? "مؤشرات سريعة" : "Quick Indicators"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: isAr ? "تذاكر عاجلة" : "Urgent Tickets", value: data.urgentTickets, color: data.urgentTickets > 0 ? "text-destructive" : "text-chart-2", link: "/admin/support-tickets" },
              { label: isAr ? "تذاكر مفتوحة" : "Open Tickets", value: data.openTickets, color: "text-chart-4", link: "/admin/support-tickets" },
              { label: isAr ? "شركات نشطة" : "Active Companies", value: data.activeCompanies, color: "text-primary", link: "/admin/companies" },
            ].map((item, i) => (
              <Link key={i} to={item.link}>
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-2.5 hover:bg-accent/30 transition-all">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
