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
import { QrCode, Search, Eye, Copy, BarChart3, Hash, ScanLine, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { format } from "date-fns";

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
        .select("*")
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <Hash className="h-4 w-4" />, label: isAr ? "إجمالي الرموز" : "Total Codes", value: stats?.total ?? "—" },
          { icon: <QrCode className="h-4 w-4" />, label: isAr ? "النشطة" : "Active", value: stats?.active ?? "—" },
          { icon: <ScanLine className="h-4 w-4" />, label: isAr ? "أعلى مسح" : "Top Scans", value: stats?.topScanned ?? "—" },
          { icon: <BarChart3 className="h-4 w-4" />, label: isAr ? "أكثر كود مسحاً" : "Most Scanned", value: stats?.topCode ?? "—" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالكود أو النوع..." : "Search by code or type..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
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

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{isAr ? "الرموز المُصدرة" : "Issued Codes"} ({filtered?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {filtered?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        {isAr ? "لا توجد رموز" : "No QR codes found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered?.map((qr) => (
                      <TableRow key={qr.id}>
                        <TableCell>
                          <span className="font-mono text-xs tracking-widest">{qr.code}</span>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
