import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, AlertTriangle, ClipboardCheck,
  Package, Truck, DollarSign, Users, ListChecks, ShieldCheck,
} from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props {
  competitionId: string;
  isOrganizer?: boolean;
}

interface ReadinessItem {
  id: string;
  label: string;
  labelAr: string;
  icon: React.ComponentType<any>;
  status: "complete" | "partial" | "incomplete";
  detail: string;
  detailAr: string;
}

export function ReadinessChecklist({ competitionId }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: lists } = useQuery({
    queryKey: ["readiness-lists", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_lists")
        .select("id, title, status, category")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["readiness-items", competitionId],
    queryFn: async () => {
      if (!lists?.length) return [];
      const { data, error } = await supabase
        .from("requirement_list_items")
        .select("id, status, checked, assigned_vendor_id, estimated_cost, quantity, deadline")
        .in("list_id", lists.map(l => l.id));
      if (error) throw error;
      return data as any[];
    },
    enabled: !!lists?.length,
  });

  const { data: sponsorships } = useQuery({
    queryKey: ["readiness-sponsorships", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requirement_sponsorship_requests")
        .select("id, status, total_estimated_cost")
        .eq("competition_id", competitionId);
      if (error) throw error;
      return data;
    },
  });

  const { data: judges } = useQuery({
    queryKey: ["readiness-judges", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_roles")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("role", "judge")
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const { data: participants } = useQuery({
    queryKey: ["readiness-participants", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_registrations")
        .select("id")
        .eq("competition_id", competitionId)
        .eq("status", "approved");
      if (error) throw error;
      return data;
    },
  });

  const checklistItems = useMemo<ReadinessItem[]>(() => {
    const allItems = items || [];
    const totalItems = allItems.length;
    const delivered = allItems.filter(i => i.status === "delivered").length;
    const assigned = allItems.filter(i => i.assigned_vendor_id).length;
    const checked = allItems.filter(i => i.checked).length;
    const overdue = allItems.filter(i => i.deadline && new Date(i.deadline) < new Date() && i.status !== "delivered").length;
    const totalCost = allItems.reduce((s, i) => s + (Number(i.estimated_cost) || 0) * (i.quantity || 1), 0);
    const sponsoredValue = (sponsorships || []).filter(s => s.status === "accepted").reduce((s, sp) => s + (Number(sp.total_estimated_cost) || 0), 0);
    const listsApproved = (lists || []).filter(l => l.status === "approved").length;
    const totalLists = (lists || []).length;
    const judgeCount = judges?.length || 0;
    const participantCount = participants?.length || 0;

    return [
      {
        id: "lists",
        label: "Requirement Lists Created",
        labelAr: "إنشاء قوائم المتطلبات",
        icon: ListChecks,
        status: totalLists === 0 ? "incomplete" : listsApproved === totalLists ? "complete" : "partial",
        detail: `${totalLists} lists (${listsApproved} approved)`,
        detailAr: `${totalLists} قائمة (${listsApproved} موافق عليها)`,
      },
      {
        id: "items",
        label: "Items Added",
        labelAr: "إضافة العناصر",
        icon: Package,
        status: totalItems === 0 ? "incomplete" : totalItems >= 5 ? "complete" : "partial",
        detail: `${totalItems} items across ${totalLists} lists`,
        detailAr: `${totalItems} عنصر في ${totalLists} قائمة`,
      },
      {
        id: "vendors",
        label: "Vendors Assigned",
        labelAr: "تعيين الموردين",
        icon: Truck,
        status: totalItems === 0 ? "incomplete" : assigned === totalItems ? "complete" : assigned > 0 ? "partial" : "incomplete",
        detail: `${assigned}/${totalItems} items have vendors`,
        detailAr: `${assigned}/${totalItems} عنصر لديه مورد`,
      },
      {
        id: "delivery",
        label: "Items Delivered",
        labelAr: "تسليم العناصر",
        icon: CheckCircle2,
        status: totalItems === 0 ? "incomplete" : delivered === totalItems ? "complete" : delivered > 0 ? "partial" : "incomplete",
        detail: `${delivered}/${totalItems} delivered${overdue > 0 ? ` (${overdue} overdue)` : ""}`,
        detailAr: `${delivered}/${totalItems} تم تسليمه${overdue > 0 ? ` (${overdue} متأخر)` : ""}`,
      },
      {
        id: "budget",
        label: "Budget Coverage",
        labelAr: "تغطية الميزانية",
        icon: DollarSign,
        status: totalCost === 0 ? "incomplete" : sponsoredValue >= totalCost ? "complete" : sponsoredValue > 0 ? "partial" : "incomplete",
        detail: `SAR ${toEnglishDigits(sponsoredValue.toLocaleString())} / SAR ${toEnglishDigits(totalCost.toLocaleString())} covered`,
        detailAr: `SAR ${toEnglishDigits(sponsoredValue.toLocaleString())} / SAR ${toEnglishDigits(totalCost.toLocaleString())} مغطى`,
      },
      {
        id: "checklist",
        label: "Items Verified",
        labelAr: "التحقق من العناصر",
        icon: ShieldCheck,
        status: totalItems === 0 ? "incomplete" : checked === totalItems ? "complete" : checked > 0 ? "partial" : "incomplete",
        detail: `${checked}/${totalItems} checked off`,
        detailAr: `${checked}/${totalItems} تم التحقق`,
      },
      {
        id: "judges",
        label: "Judges Assigned",
        labelAr: "تعيين الحكام",
        icon: Users,
        status: judgeCount === 0 ? "incomplete" : judgeCount >= 3 ? "complete" : "partial",
        detail: `${judgeCount} active judges`,
        detailAr: `${judgeCount} حكم نشط`,
      },
      {
        id: "participants",
        label: "Participants Registered",
        labelAr: "تسجيل المشاركين",
        icon: Users,
        status: participantCount === 0 ? "incomplete" : participantCount >= 5 ? "complete" : "partial",
        detail: `${participantCount} approved registrations`,
        detailAr: `${participantCount} تسجيل مقبول`,
      },
    ];
  }, [items, lists, sponsorships, judges, participants]);

  const completeCount = checklistItems.filter(i => i.status === "complete").length;
  const readinessScore = checklistItems.length > 0 ? Math.round((completeCount / checklistItems.length) * 100) : 0;

  const STATUS_ICON = {
    complete: <CheckCircle2 className="h-5 w-5 text-chart-5" />,
    partial: <AlertTriangle className="h-5 w-5 text-chart-4" />,
    incomplete: <Circle className="h-5 w-5 text-muted-foreground/40" />,
  };

  const STATUS_BG = {
    complete: "bg-chart-5/5 border-chart-5/20",
    partial: "bg-chart-4/5 border-chart-4/20",
    incomplete: "bg-muted/30 border-border/40",
  };

  return (
    <div className="space-y-6">
      {/* Readiness Score */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{isAr ? "جاهزية المسابقة" : "Competition Readiness"}</h3>
            </div>
            <div className="text-end">
              <p className={`text-2xl font-bold ${readinessScore >= 80 ? "text-chart-5" : readinessScore >= 50 ? "text-chart-4" : "text-destructive"}`}>
                <AnimatedCounter value={readinessScore} suffix="%" />
              </p>
              <p className="text-[10px] text-muted-foreground">{completeCount}/{checklistItems.length} {isAr ? "مكتمل" : "complete"}</p>
            </div>
          </div>
          <Progress value={readinessScore} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {readinessScore >= 80
              ? (isAr ? "المسابقة جاهزة بشكل كبير! ✅" : "Competition is largely ready! ✅")
              : readinessScore >= 50
              ? (isAr ? "تحتاج بعض الخطوات للاكتمال" : "Some steps still needed")
              : (isAr ? "المسابقة تحتاج مزيداً من التجهيزات" : "Competition needs more preparation")}
          </p>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-2">
        {checklistItems.map(item => {
          const IconComp = item.icon;
          return (
            <Card key={item.id} className={`border ${STATUS_BG[item.status]} transition-colors`}>
              <CardContent className="flex items-center gap-3 p-3.5">
                {STATUS_ICON[item.status]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{isAr ? item.labelAr : item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{isAr ? item.detailAr : item.detail}</p>
                </div>
                <IconComp className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
