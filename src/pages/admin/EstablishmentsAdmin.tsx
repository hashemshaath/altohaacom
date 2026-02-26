import { useLanguage } from "@/i18n/LanguageContext";
import { useEstablishments } from "@/hooks/useEstablishments";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

export default function EstablishmentsAdmin() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { data: establishments, isLoading } = useEstablishments();

  const { selected, toggleOne, toggleAll, clearSelection, isAllSelected, count, selectedItems } =
    useAdminBulkActions(establishments || []);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: any) => isAr && r.name_ar ? r.name_ar : r.name },
      { header: isAr ? "النوع" : "Type", accessor: (r: any) => r.type },
      { header: isAr ? "المدينة" : "City", accessor: (r: any) => r.city || "" },
      { header: isAr ? "موثق" : "Verified", accessor: (r: any) => r.is_verified ? "Yes" : "No" },
      { header: isAr ? "نشط" : "Active", accessor: (r: any) => r.is_active !== false ? "Yes" : "No" },
    ],
    filename: "establishments",
  });

  const toggleVerification = async (id: string, current: boolean) => {
    const { error } = await supabase.from("establishments").update({ is_verified: !current }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["establishments"] });
    toast({ title: !current ? "Verified" : "Unverified" });
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("establishments").update({ is_active: !current }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["establishments"] });
    toast({ title: !current ? "Activated" : "Deactivated" });
  };

  const bulkVerify = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("establishments").update({ is_verified: true }).in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["establishments"] });
    clearSelection();
    toast({ title: isAr ? `تم توثيق ${ids.length} منشأة` : `${ids.length} verified` });
  };

  const bulkDeactivate = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("establishments").update({ is_active: false }).in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    queryClient.invalidateQueries({ queryKey: ["establishments"] });
    clearSelection();
    toast({ title: isAr ? `تم تعطيل ${ids.length} منشأة` : `${ids.length} deactivated` });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Building2}
        title={isAr ? "إدارة المنشآت" : "Establishments Management"}
        description={isAr ? "إدارة المطاعم والفنادق والمنشآت الغذائية" : "Manage restaurants, hotels, and food establishments"}
      />

      <BulkActionBar
        count={count}
        onClear={clearSelection}
        onExport={() => exportCSV(selectedItems)}
        onStatusChange={() => bulkVerify()}
      >
        <Button variant="destructive" size="sm" className="gap-1.5" onClick={bulkDeactivate}>
          <XCircle className="h-3.5 w-3.5" />
          {isAr ? "تعطيل" : "Deactivate"}
        </Button>
      </BulkActionBar>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : !establishments?.length ? (
        <div className="py-16 text-center"><Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">{isAr ? "لا توجد منشآت" : "No establishments"}</p></div>
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          <div className="flex items-center gap-2 px-1">
            <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
            <span className="text-xs text-muted-foreground">
              {isAr ? "تحديد الكل" : "Select all"} ({establishments.length})
            </span>
          </div>

          {establishments.map((est) => (
            <Card key={est.id} className={selected.has(est.id) ? "ring-1 ring-primary/30" : ""}>
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox checked={selected.has(est.id)} onCheckedChange={() => toggleOne(est.id)} />
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{isAr && est.name_ar ? est.name_ar : est.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-xs">{est.type}</Badge>
                    {est.city && <Badge variant="outline" className="text-xs">{est.city}</Badge>}
                    {est.is_verified && <Badge className="bg-chart-3/20 text-chart-3 text-xs">Verified</Badge>}
                    {!est.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleVerification(est.id, est.is_verified ?? false)}>
                    {est.is_verified ? <XCircle className="me-1.5 h-3.5 w-3.5" /> : <CheckCircle className="me-1.5 h-3.5 w-3.5" />}
                    {est.is_verified ? (isAr ? "إلغاء التوثيق" : "Unverify") : (isAr ? "توثيق" : "Verify")}
                  </Button>
                  <Button size="sm" variant={est.is_active ? "destructive" : "default"} onClick={() => toggleActive(est.id, est.is_active ?? true)}>
                    {est.is_active ? (isAr ? "تعطيل" : "Deactivate") : (isAr ? "تفعيل" : "Activate")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
