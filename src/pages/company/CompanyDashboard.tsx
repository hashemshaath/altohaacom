import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

export default function CompanyPortalDashboard() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { data: company, isLoading: companyLoading } = useCompanyProfile(companyId);

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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">{language === "ar" ? "نشط" : "Active"}</Badge>;
      case "suspended":
        return <Badge variant="destructive">{language === "ar" ? "معلّق" : "Suspended"}</Badge>;
      default:
        return <Badge variant="secondary">{language === "ar" ? "قيد المراجعة" : "Pending"}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-8 text-primary-foreground">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary-foreground/5 blur-2xl" />
        <div className="relative z-10">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-64 bg-primary-foreground/20" />
              <Skeleton className="mt-3 h-5 w-48 bg-primary-foreground/20" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold md:text-3xl">{company?.name}</h1>
                  {company?.name_ar && language !== "ar" && (
                    <p className="text-sm text-primary-foreground/70">{company.name_ar}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {getStatusBadge(company?.status || null)}
                <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                  {company?.type}
                </Badge>
                {company?.company_number && (
                  <span className="text-sm text-primary-foreground/70">#{company.company_number}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label={language === "ar" ? "إجمالي الطلبيات" : "Total Orders"}
          value={stats?.totalOrders || 0}
          subLabel={language === "ar" ? "قيد الانتظار" : "pending"}
          subValue={stats?.pendingOrders || 0}
          accent="border-s-primary"
          isLoading={isLoading}
        />
        <StatCard
          icon={FileText}
          label={language === "ar" ? "الدعوات" : "Invitations"}
          value={stats?.totalInvitations || 0}
          subLabel={language === "ar" ? "قيد الانتظار" : "pending"}
          subValue={stats?.pendingInvitations || 0}
          accent="border-s-chart-4"
          isLoading={isLoading}
        />
        <StatCard
          icon={Users}
          label={language === "ar" ? "أعضاء الفريق" : "Team Members"}
          value={stats?.totalContacts || 0}
          accent="border-s-accent"
          isLoading={isLoading}
        />
        <StatCard
          icon={BarChart3}
          label={language === "ar" ? "المعاملات" : "Transactions"}
          value={stats?.totalTransactions || 0}
          accent="border-s-chart-5"
          isLoading={isLoading}
        />
      </div>

      {/* Financial Overview */}
      {!isLoading && company && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="animate-fade-in transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "حد الائتمان" : "Credit Limit"}
                </p>
                <p className="text-xl font-bold">
                  {company.currency || "USD"} {company.credit_limit?.toLocaleString() || "0"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" style={{ animationDelay: "0.05s" }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-5/10">
                <TrendingUp className="h-6 w-6 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "إجمالي المبالغ" : "Total Volume"}
                </p>
                <p className="text-xl font-bold">
                  {company.currency || "USD"} {stats?.totalAmount?.toLocaleString() || "0"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" style={{ animationDelay: "0.1s" }}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-4/10">
                <Clock className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "شروط الدفع" : "Payment Terms"}
                </p>
                <p className="text-xl font-bold">
                  {company.payment_terms || 0} {language === "ar" ? "يوم" : "days"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            {language === "ar" ? "النشاط الأخير" : "Recent Activity"}
          </h3>
          <Badge variant="secondary" className="text-[10px]">
            {language === "ar" ? "قريباً" : "Coming Soon"}
          </Badge>
        </div>
        <CardContent className="p-5">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border/50 mb-3">
              <TrendingUp className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد أنشطة حديثة حالياً" : "No recent activity yet"}
            </p>
          </div>
        </CardContent>
      </Card>
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
                <p className="mt-1 text-3xl font-bold">{value}</p>
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
