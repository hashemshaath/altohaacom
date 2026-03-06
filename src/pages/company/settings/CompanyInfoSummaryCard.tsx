import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, CheckCircle2, Clock, Shield } from "lucide-react";

interface Props {
  company: Record<string, any>;
  isAr: boolean;
}

export function CompanyInfoSummaryCard({ company, isAr }: Props) {
  const statusColor = company.status === "active" ? "default" : "secondary";
  const verifiedColor = company.is_verified ? "default" : "outline";

  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          {isAr ? "ملخص الشركة" : "Company Summary"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "نظرة عامة على بيانات الشركة الأساسية" : "Overview of core company data"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              {isAr ? "رقم الشركة" : "Company Number"}
            </span>
            <span className="font-mono text-xs bg-muted/50 px-2.5 py-1 rounded-lg">{company.company_number || "—"}</span>
          </div>
          <Separator className="bg-border/10" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{isAr ? "النوع" : "Type"}</span>
            <Badge variant="secondary" className="rounded-lg text-[11px] capitalize">{company.type}</Badge>
          </div>
          <Separator className="bg-border/10" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              {isAr ? "الحالة" : "Status"}
            </span>
            <Badge variant={statusColor} className="rounded-lg text-[11px] capitalize">
              {company.status || "active"}
            </Badge>
          </div>
          <Separator className="bg-border/10" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              {isAr ? "التوثيق" : "Verification"}
            </span>
            <Badge variant={verifiedColor} className="rounded-lg text-[11px]">
              {company.is_verified
                ? (isAr ? "✅ موثّق" : "✅ Verified")
                : (isAr ? "غير موثّق" : "Not Verified")}
            </Badge>
          </div>
          {company.verification_level && (
            <>
              <Separator className="bg-border/10" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isAr ? "مستوى التوثيق" : "Verification Level"}</span>
                <span className="capitalize text-xs">{company.verification_level}</span>
              </div>
            </>
          )}
          <Separator className="bg-border/10" />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {isAr ? "تاريخ الإنشاء" : "Created"}
            </span>
            <span className="text-xs text-muted-foreground">
              {company.created_at ? new Date(company.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US") : "—"}
            </span>
          </div>
          {company.founded_year && (
            <>
              <Separator className="bg-border/10" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isAr ? "سنة التأسيس" : "Founded Year"}</span>
                <span className="font-mono text-xs">{company.founded_year}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
