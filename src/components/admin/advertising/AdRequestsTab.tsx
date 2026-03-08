import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";
import { statusColors } from "./statusColors";

interface Props {
  requests: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const AdRequestsTab = memo(function AdRequestsTab({ requests, onApprove, onReject }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

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
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{isAr ? "طلبات الإعلانات" : "Ad Requests"}</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{requests.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
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
              {requests.map((req: any) => (
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
      </CardContent>
    </Card>
  );
});
