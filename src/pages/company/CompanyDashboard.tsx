import { useMemo } from "react";
import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useCompanyRoles, COMPANY_ROLES } from "@/hooks/useCompanyRoles";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Link } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Users,
  ShoppingCart,
  TrendingUp,
  Building2,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Crown,
  Trophy,
  Calendar,
  CheckCircle,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currencyFormatter";
import { CompanyAnalyticsCharts } from "@/components/company/CompanyAnalyticsCharts";
import { CompanyRecentOrdersWidget } from "@/components/company/CompanyRecentOrdersWidget";
import { CompanyQuickActions } from "@/components/company/CompanyQuickActions";
import { CompanyActivityFeed } from "@/components/company/CompanyActivityFeed";

export default function CompanyPortalDashboard() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { data: company, isLoading: companyLoading } = useCompanyProfile(companyId);
  const { data: companyRoles = [] } = useCompanyRoles(companyId);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["companyStats", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const [ordersRes, invitationsRes, transactionsRes, contactsRes] = await Promise.all([
        supabase.from("company_orders").select("id, status").eq("company_id", companyId),
        supabase.from("company_invitations").select("id, status").eq("company_id", companyId),
        supabase.from("company_transactions").select("id, amount, type").eq("company_id", companyId),
        supabase.from("company_contacts").select("id").eq("company_id", companyId),
      ]);

      return {
        totalOrders: ordersRes.data?.length || 0,
        pendingOrders: ordersRes.data?.filter(o => o.status === "pending").length || 0,
        completedOrders: ordersRes.data?.filter(o => o.status === "completed").length || 0,
        totalInvitations: invitationsRes.data?.length || 0,
        pendingInvitations: invitationsRes.data?.filter(i => i.status === "pending").length || 0,
        totalContacts: contactsRes.data?.length || 0,
        totalTransactions: transactionsRes.data?.length || 0,
        totalAmount: transactionsRes.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = companyLoading || statsLoading;
  const isAr = language === "ar";

  // Profile completion score
  const completionScore = useMemo(() => {
    if (!company) return 0;
    const fields = [company.name, company.description, company.logo_url, company.cover_image_url, company.email, company.phone, company.website, company.tax_number, company.address, company.city];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [company]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{isAr ? "نشط" : "Active"}</Badge>;
      case "suspended":
        return <Badge variant="destructive">{isAr ? "معلّق" : "Suspended"}</Badge>;
      default:
        return <Badge variant="secondary">{isAr ? "قيد المراجعة" : "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner — Refined */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 sm:p-8 text-primary-foreground">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary-foreground/5 blur-2xl" />
        <div className="relative z-10">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-64 bg-primary-foreground/20" />
              <Skeleton className="mt-3 h-5 w-48 bg-primary-foreground/20" />
            </>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover border-2 border-primary-foreground/20" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                    <Building2 className="h-7 w-7" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold sm:text-2xl">{isAr && company?.name_ar ? company.name_ar : company?.name}</h1>
                  {company?.name_ar && !isAr && (
                    <p className="text-sm text-primary-foreground/70">{company.name_ar}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {getStatusBadge(company?.status || null)}
                    {company?.company_number && (
                      <span className="text-xs text-primary-foreground/60 font-mono">#{company.company_number}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Completion Ring */}
              <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm px-4 py-3">
                <div className="relative h-12 w-12">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground/20" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${completionScore} ${100 - completionScore}`} className="text-primary-foreground transition-all duration-700" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{completionScore}%</span>
                </div>
                <div>
                  <p className="text-xs font-semibold">{isAr ? "اكتمال الملف" : "Profile"}</p>
                  <p className="text-[10px] text-primary-foreground/70">{completionScore === 100 ? (isAr ? "مكتمل ✓" : "Complete ✓") : (isAr ? "أكمل ملفك" : "Complete it")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <CompanyQuickActions />

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { icon: ShoppingCart, label: isAr ? "الطلبيات" : "Orders", value: stats?.totalOrders || 0, sub: stats?.pendingOrders || 0, subLabel: isAr ? "معلقة" : "pending", color: "text-primary", bg: "bg-primary/10" },
          { icon: FileText, label: isAr ? "الدعوات" : "Invitations", value: stats?.totalInvitations || 0, sub: stats?.pendingInvitations || 0, subLabel: isAr ? "معلقة" : "pending", color: "text-chart-4", bg: "bg-chart-4/10" },
          { icon: Users, label: isAr ? "الفريق" : "Team", value: stats?.totalContacts || 0, color: "text-accent", bg: "bg-accent/10" },
          { icon: BarChart3, label: isAr ? "المعاملات" : "Transactions", value: stats?.totalTransactions || 0, color: "text-chart-5", bg: "bg-chart-5/10" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-14 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold tabular-nums">
                      <AnimatedCounter value={stat.value} />
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                  {stat.sub !== undefined && stat.sub > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {stat.sub} {stat.subLabel}
                    </p>
                  )}
                </div>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Overview */}
      {!isLoading && company && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {[
            { icon: CreditCard, label: isAr ? "حد الائتمان" : "Credit Limit", value: formatCurrency(company.credit_limit || 0, language as "en" | "ar"), color: "text-primary", bg: "bg-primary/10" },
            { icon: TrendingUp, label: isAr ? "إجمالي المبالغ" : "Total Volume", value: formatCurrency(stats?.totalAmount || 0, language as "en" | "ar"), color: "text-chart-5", bg: "bg-chart-5/10" },
            { icon: Clock, label: isAr ? "شروط الدفع" : "Payment Terms", value: `${company.payment_terms || 0} ${isAr ? "يوم" : "days"}`, color: "text-chart-4", bg: "bg-chart-4/10" },
          ].map((item, i) => (
            <Card key={item.label} className="rounded-xl animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="flex items-center gap-3.5 p-4">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">{item.label}</p>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Orders & Sponsorship Opportunities */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders Widget */}
        <CompanyRecentOrdersWidget companyId={companyId} language={language} />

        {/* Sponsorship Opportunities Widget */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-chart-3/5 to-transparent px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-3/10">
                <Crown className="h-3.5 w-3.5 text-chart-3" />
              </div>
              {language === "ar" ? "فرص الرعاية" : "Sponsorship Opportunities"}
            </h3>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/company/sponsorships">
                {language === "ar" ? "عرض الكل" : "View All"}
                <ArrowUpRight className="ms-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
          <CardContent className="p-5">
            <SponsorshipWidget companyId={companyId} language={language} />
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <CompanyActivityFeed companyId={companyId} />

      {/* Analytics Charts */}
      <CompanyAnalyticsCharts companyId={companyId} language={language} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  subValue,
  accent,
  isLoading,
}: {
  icon: any;
  label: string;
  value: number;
  subLabel?: string;
  subValue?: number;
  accent: string;
  isLoading: boolean;
}) {
  return (
    <Card className={`border-s-[3px] ${accent} animate-fade-in transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <>
                <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
                {subLabel && subValue !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {subValue} {subLabel}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="rounded-xl bg-muted p-2.5">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SponsorshipWidget({ companyId, language }: { companyId: string | null; language: string }) {
  const isAr = language === "ar";
  const { data: opportunities = [] } = useQuery({
    queryKey: ["company-dash-sponsor-opps", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, competition_start, city, country, cover_image_url")
        .in("status", ["registration_open", "upcoming"])
        .order("competition_start", { ascending: true })
        .limit(3);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Crown className="mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          {isAr ? "لا توجد فرص رعاية متاحة حالياً" : "No sponsorship opportunities available"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {opportunities.map((comp: any) => {
        const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
        return (
          <Link
            key={comp.id}
            to={`/competitions/${comp.id}`}
            className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10">
              <Trophy className="h-5 w-5 text-chart-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{title}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {comp.competition_start && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(comp.competition_start), "MMM d")}
                  </span>
                )}
                {comp.city && <span>{comp.city}</span>}
              </div>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px] bg-chart-3/5 text-chart-3 border-chart-3/30">
              <Crown className="me-1 h-3 w-3" />
              {isAr ? "رعاية" : "Sponsor"}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
