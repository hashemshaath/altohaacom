import { memo, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { CheckCircle, XCircle, FileText, Search } from "lucide-react";
import { statusColors } from "./statusColors";

interface Props {
  requests: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const AdRequestsTab = memo(function AdRequestsTab({ requests, onApprove, onReject }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...requests]
      .filter(req => {
        if (statusFilter !== "all" && req.status !== statusFilter) return false;
        if (q) {
          const text = `${req.title || ""} ${req.title_ar || ""} ${req.companies?.name || ""} ${req.companies?.name_ar || ""} ${req.description || ""}`.toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const statusPriority = { pending: 0, under_review: 1, approved: 2, rejected: 3 };
        const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 99;
        const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 99;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [requests, searchQuery, statusFilter]);

  if (requests.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{isAr ? "لا توجد طلبات إعلانية" : "No ad requests yet"}</p>
          <p className="text-xs text-muted-foreground mt-1">{isAr ? "ستظهر الطلبات هنا عند إرسالها من بوابة المعلنين" : "Requests will appear here when submitted from the advertiser portal"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث في الطلبات..." : "Search requests..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "الكل" : "All Status"}</SelectItem>
            <SelectItem value="pending">{isAr ? "معلقة" : "Pending"}</SelectItem>
            <SelectItem value="under_review">{isAr ? "قيد المراجعة" : "Under Review"}</SelectItem>
            <SelectItem value="approved">{isAr ? "موافق عليها" : "Approved"}</SelectItem>
            <SelectItem value="rejected">{isAr ? "مرفوضة" : "Rejected"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{isAr ? "طلبات الإعلانات" : "Ad Requests"}</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{filteredRequests.length}/{requests.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد نتائج" : "No results found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                    <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isAr ? "الميزانية" : "Budget"}</TableHead>
                    <TableHead>{isAr ? "المواقع المطلوبة" : "Desired Placements"}</TableHead>
                    <TableHead>{isAr ? "الفترة" : "Period"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req: any) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {req.companies?.logo_url && (
                            <img src={req.companies.logo_url} alt="" className="h-6 w-6 rounded-lg object-cover" />
                          )}
                          <span className="font-medium text-xs">{isAr ? req.companies?.name_ar : req.companies?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-xs font-medium">{isAr ? req.title_ar || req.title : req.title}</span>
                          {req.description && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{isAr ? req.description_ar || req.description : req.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{req.request_type}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{req.budget ? `${req.budget} ${req.currency || "SAR"}` : "—"}</TableCell>
                      <TableCell className="text-xs">{req.desired_placements?.length || 0} {isAr ? "موقع" : "slots"}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {req.desired_start_date && req.desired_end_date
                          ? `${new Date(req.desired_start_date).toLocaleDateString()} → ${new Date(req.desired_end_date).toLocaleDateString()}`
                          : "—"}
                      </TableCell>
                      <TableCell><Badge className={statusColors[req.status] || ""}>{req.status}</Badge></TableCell>
                      <TableCell>
                        {(req.status === "pending" || req.status === "under_review") && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 rounded-xl text-chart-2" onClick={() => onApprove(req.id)}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 rounded-xl text-destructive" onClick={() => onReject(req.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
