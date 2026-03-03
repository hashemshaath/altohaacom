import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Search, Eye, Copy, BarChart3, Hash, ScanLine, Filter, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { format } from "date-fns";
import { useAdminBulkActions } from "@/hooks/useAdminBulkActions";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Checkbox } from "@/components/ui/checkbox";

const CATEGORIES = ["all", "account", "certificate", "invoice", "competition", "company", "exhibition", "participant", "judge", "team_member", "general"];

export default function QRCodesAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ["admin-qr-codes", category],
    queryFn: async () => {
      let query = supabase
        .from("qr_codes")
        .select("id, code, entity_type, entity_id, category, scan_count, is_active, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(200);

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-qr-stats"],
    queryFn: async () => {
      const { count: total } = await supabase.from("qr_codes").select("id", { count: "exact", head: true });
      const { count: active } = await supabase.from("qr_codes").select("id", { count: "exact", head: true }).eq("is_active", true);
      const { data: topScanned } = await supabase
        .from("qr_codes")
        .select("code, scan_count")
        .order("scan_count", { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        total: total || 0,
        active: active || 0,
        topScanned: topScanned?.scan_count || 0,
        topCode: topScanned?.code || "-",
      };
    },
  });

  const filtered = qrCodes?.filter((qr) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      qr.code.toLowerCase().includes(q) ||
      qr.entity_type.toLowerCase().includes(q) ||
      qr.entity_id.toLowerCase().includes(q)
    );
  }) || [];

  const bulk = useAdminBulkActions(filtered);

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الكود" : "Code", accessor: (r: any) => r.code },
      { header: isAr ? "النوع" : "Entity Type", accessor: (r: any) => r.entity_type },
      { header: isAr ? "الفئة" : "Category", accessor: (r: any) => r.category },
      { header: isAr ? "المسح" : "Scans", accessor: (r: any) => r.scan_count },
      { header: isAr ? "الحالة" : "Status", accessor: (r: any) => r.is_active ? "Active" : "Inactive" },
      { header: isAr ? "التاريخ" : "Created", accessor: (r: any) => format(new Date(r.created_at), "yyyy-MM-dd") },
    ],
    filename: "qr-codes",
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: isAr ? "تم النسخ" : "Copied", description: code });
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      account: { en: "Account", ar: "حساب" },
      certificate: { en: "Certificate", ar: "شهادة" },
      invoice: { en: "Invoice", ar: "فاتورة" },
      competition: { en: "Competition", ar: "مسابقة" },
      company: { en: "Company", ar: "شركة" },
      exhibition: { en: "Exhibition", ar: "فعالية" },
      participant: { en: "Participant", ar: "متسابق" },
      judge: { en: "Judge", ar: "حكم" },
      team_member: { en: "Team Member", ar: "عضو فريق" },
      general: { en: "General", ar: "عام" },
    };
    return labels[cat] ? (isAr ? labels[cat].ar : labels[cat].en) : cat;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={QrCode}
        title={isAr ? "إدارة رموز QR" : "QR Codes Management"}
        description={isAr ? "عرض وتتبع جميع رموز QR المُصدرة في المنصة" : "View and track all QR codes issued across the platform"}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {[
          { icon: <Hash className="h-4 w-4" />, label: isAr ? "إجمالي" : "Total", value: stats?.total ?? "—", color: "text-primary", bg: "bg-primary/10" },
          { icon: <QrCode className="h-4 w-4" />, label: isAr ? "النشطة" : "Active", value: stats?.active ?? "—", color: "text-chart-5", bg: "bg-chart-5/10" },
          { icon: <ScanLine className="h-4 w-4" />, label: isAr ? "أعلى مسح" : "Top Scans", value: stats?.topScanned ?? "—", color: "text-chart-3", bg: "bg-chart-3/10" },
          { icon: <BarChart3 className="h-4 w-4" />, label: isAr ? "أكثر كود" : "Top Code", value: stats?.topCode ?? "—", color: "text-chart-4", bg: "bg-chart-4/10" },
        ].map((s, i) => (
          <Card key={i} className="rounded-2xl border-border/40 group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-2.5 p-3 sm:p-4">
              <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${s.bg} ${s.color}`}>{s.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm sm:text-lg font-bold truncate">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-border/40">
        <CardContent className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالكود أو النوع..." : "Search by code or type..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 h-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44 h-9">
              <Filter className="me-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "الكل" : "All Categories"}</SelectItem>
              {CATEGORIES.filter(c => c !== "all").map(c => (
                <SelectItem key={c} value={c}>{categoryLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <BulkActionBar count={bulk.count} onClear={bulk.clearSelection} onExport={() => exportCSV(bulk.selectedItems)} />

      {/* Table / Cards */}
      <Card className="rounded-2xl border-border/40">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-sm">{isAr ? "الرموز المُصدرة" : "Issued Codes"} ({filtered?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-3 sm:p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded-xl" />
                    <Skeleton className="h-2.5 w-16 rounded-xl" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-border">
                {filtered?.map((qr) => (
                  <div key={qr.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs tracking-wider truncate">{qr.code}</span>
                        <Badge variant={qr.is_active ? "default" : "destructive"} className="text-[9px] px-1.5 py-0 shrink-0">
                          {qr.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Off")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{qr.entity_type}</Badge>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{categoryLabel(qr.category)}</Badge>
                        <span className="text-[10px] text-muted-foreground">{qr.scan_count} scans</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(qr.code)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={`/verify?code=${qr.code}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={bulk.isAllSelected} onCheckedChange={bulk.toggleAll} />
                      </TableHead>
                      <TableHead>{isAr ? "الكود" : "Code"}</TableHead>
                      <TableHead>{isAr ? "النوع" : "Entity Type"}</TableHead>
                      <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                      <TableHead className="text-center">{isAr ? "المسح" : "Scans"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "التاريخ" : "Created"}</TableHead>
                      <TableHead className="text-end">{isAr ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered?.map((qr) => (
                      <TableRow key={qr.id} className={bulk.isSelected(qr.id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox checked={bulk.isSelected(qr.id)} onCheckedChange={() => bulk.toggleOne(qr.id)} />
                        </TableCell>
                        <TableCell>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{qr.entity_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">{categoryLabel(qr.category)}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{qr.scan_count}</TableCell>
                        <TableCell>
                          <Badge variant={qr.is_active ? "default" : "destructive"} className="text-[10px]">
                            {qr.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(qr.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(qr.code)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={`/verify?code=${qr.code}`} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
