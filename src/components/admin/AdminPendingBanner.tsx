import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Building2, Building, ShieldCheck, Trophy, Megaphone, Ticket, Flag, Clock,
  ChefHat, FileText, CreditCard, Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingItem {
  key: string;
  label: string;
  labelAr: string;
  count: number;
  icon: typeof Building2;
  to: string;
  color: string;
}

export default function AdminPendingBanner() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: items } = useQuery({
    queryKey: ["admin-pending-counts"],
    queryFn: async () => {
      const [
        entities,
        companies,
        verification,
        adRequests,
        adCampaigns,
        supportTickets,
        reports,
        chefsTable,
        articles,
        invoices,
        exhibitions,
        competitions,
      ] = await Promise.all([
        supabase.from("culinary_entities").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("verification_requests").select("*", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
        supabase.from("ad_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("ad_campaigns").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("content_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("chefs_table_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "draft"),
        (supabase as any).from("exhibitions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("competitions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const list: PendingItem[] = [
        { key: "entities", label: "Entities", labelAr: "الجهات", count: entities.count || 0, icon: Building2, to: "/admin/establishments", color: "text-chart-4" },
        { key: "companies", label: "Companies", labelAr: "الشركات", count: companies.count || 0, icon: Building, to: "/admin/companies", color: "text-chart-3" },
        { key: "verification", label: "Verification", labelAr: "التوثيق", count: verification.count || 0, icon: ShieldCheck, to: "/admin/verification", color: "text-primary" },
        { key: "adRequests", label: "Ad Requests", labelAr: "طلبات الإعلان", count: adRequests.count || 0, icon: Megaphone, to: "/admin/advertising", color: "text-chart-5" },
        { key: "adCampaigns", label: "Campaigns", labelAr: "الحملات", count: adCampaigns.count || 0, icon: Megaphone, to: "/admin/advertising", color: "text-chart-5" },
        { key: "support", label: "Support", labelAr: "الدعم", count: supportTickets.count || 0, icon: Ticket, to: "/admin/support-tickets", color: "text-chart-1" },
        { key: "reports", label: "Reports", labelAr: "البلاغات", count: reports.count || 0, icon: Flag, to: "/admin/moderation", color: "text-destructive" },
        { key: "chefsTable", label: "Chef's Table", labelAr: "طاولة الشيف", count: chefsTable.count || 0, icon: ChefHat, to: "/admin/chefs-table", color: "text-chart-2" },
        { key: "articles", label: "Drafts", labelAr: "مسودات", count: articles.count || 0, icon: FileText, to: "/admin/articles", color: "text-muted-foreground" },
        { key: "invoices", label: "Invoices", labelAr: "فواتير", count: invoices.count || 0, icon: CreditCard, to: "/admin/invoices", color: "text-chart-4" },
        { key: "exhibitions", label: "Exhibitions", labelAr: "المعارض", count: exhibitions.count || 0, icon: Landmark, to: "/admin/exhibitions", color: "text-chart-2" },
        { key: "competitions", label: "Competitions", labelAr: "المسابقات", count: competitions.count || 0, icon: Trophy, to: "/admin/competitions", color: "text-chart-1" },
      ];

      return list.filter(i => i.count > 0);
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  if (!items || items.length === 0) return null;

  const totalPending = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="mb-4 rounded-xl border border-chart-4/20 bg-chart-4/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Clock className="h-4 w-4 text-chart-4" />
        <span className="text-sm font-semibold">
          {isAr ? `${totalPending} عنصر بانتظار الإجراء` : `${totalPending} item${totalPending > 1 ? "s" : ""} pending action`}
        </span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          {items.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-all",
                "hover:shadow-md hover:-translate-y-0.5 shrink-0"
              )}
            >
              <item.icon className={cn("h-4 w-4", item.color)} />
              <span className="font-medium">{isAr ? item.labelAr : item.label}</span>
              <Badge variant="secondary" className="text-xs font-bold">
                {item.count}
              </Badge>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
