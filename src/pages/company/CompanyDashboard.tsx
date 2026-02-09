import { useCompanyAccess, useCompanyProfile } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  FileText,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function CompanyPortalDashboard() {
  const { t, language } = useLanguage();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {language === "ar" ? "لوحة تحكم الشركة" : "Company Dashboard"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            company?.name
          )}
        </p>
      </div>

      {/* Company Status */}
      {!isLoading && company && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "حالة الشركة" : "Company Status"}
                </p>
                <Badge className="mt-2">
                  {company.status || "pending"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "نوع الشركة" : "Company Type"}
                </p>
                <p className="mt-2 font-medium">{company.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "الرصيد المتاح" : "Available Credit"}
                </p>
                <p className="mt-2 font-medium text-primary">
                  {company.currency} {company.credit_limit?.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label={language === "ar" ? "إجمالي الطلبيات" : "Total Orders"}
          value={stats?.totalOrders || 0}
          subValue={`${stats?.pendingOrders || 0} ${language === "ar" ? "قيد الانتظار" : "pending"}`}
          isLoading={isLoading}
        />
        <StatCard
          icon={FileText}
          label={language === "ar" ? "الدعوات" : "Invitations"}
          value={stats?.totalInvitations || 0}
          subValue={`${stats?.pendingInvitations || 0} ${language === "ar" ? "قيد الانتظار" : "pending"}`}
          isLoading={isLoading}
        />
        <StatCard
          icon={Users}
          label={language === "ar" ? "أعضاء الفريق" : "Team Members"}
          value={stats?.totalContacts || 0}
          isLoading={isLoading}
        />
        <StatCard
          icon={BarChart3}
          label={language === "ar" ? "إجمالي المعاملات" : "Total Transactions"}
          value={stats?.totalTransactions || 0}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {language === "ar" ? "النشاط الأخير" : "Recent Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {language === "ar" ? "لا توجد أنشطة حديثة حالياً" : "No recent activity yet"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, isLoading }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <>
                <p className="mt-2 text-2xl font-bold">{value}</p>
                {subValue && <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>}
              </>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
