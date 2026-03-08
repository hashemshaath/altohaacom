import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package, Calendar, MapPin, ChefHat, Users, Eye,
  Clock, CheckCircle2, XCircle, PlayCircle, Receipt,
  Globe, Copy, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChefsTableInvoiceGenerator } from "./ChefsTableInvoiceGenerator";
import type { ChefsTableSession } from "@/hooks/useChefsTable";

interface Props {
  session: ChefsTableSession;
  onNavigate: (id: string) => void;
}

const experienceLabels: Record<string, { en: string; ar: string }> = {
  venue: { en: "On-Site Venue", ar: "في الموقع" },
  chef_kitchen: { en: "Chef's Kitchen", ar: "مطبخ الشيف" },
  sample_delivery: { en: "Sample Delivery", ar: "توصيل عينات" },
};

const sessionStatusConfig: Record<string, { icon: any; color: string }> = {
  scheduled: { icon: Calendar, color: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { icon: PlayCircle, color: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  completed: { icon: CheckCircle2, color: "bg-chart-5/10 text-chart-5 border-chart-5/20" },
  cancelled: { icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function ChefsTableSessionDetail({ session, onNavigate }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const sc = sessionStatusConfig[session.status] || sessionStatusConfig.scheduled;
  const StatusIcon = sc.icon;

  return (
    <div className="border-t border-border/40 bg-muted/20 p-5 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? "المنتج" : "Product", value: isAr && session.product_name_ar ? session.product_name_ar : session.product_name, icon: Package },
          { label: isAr ? "الفئة" : "Category", value: session.product_category, icon: Package },
          { label: isAr ? "نوع التجربة" : "Experience", value: experienceLabels[session.experience_type]?.[isAr ? "ar" : "en"] || session.experience_type, icon: MapPin },
          { label: isAr ? "الحد الأقصى للطهاة" : "Max Chefs", value: session.max_chefs, icon: Users },
          { label: isAr ? "المكان" : "Venue", value: (isAr && session.venue_ar ? session.venue_ar : session.venue) || "—", icon: MapPin },
          { label: isAr ? "المدينة" : "City", value: session.city || "—", icon: MapPin },
          { label: isAr ? "تاريخ البدء" : "Start", value: session.session_date ? format(new Date(session.session_date), "MMM d, yyyy HH:mm") : "—", icon: Calendar },
          { label: isAr ? "تاريخ الانتهاء" : "End", value: session.session_end ? format(new Date(session.session_end), "MMM d, yyyy HH:mm") : "—", icon: Calendar },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-background p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <item.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</span>
            </div>
            <p className="text-sm font-bold truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {session.description && (
        <div className="rounded-xl border border-border/30 bg-background p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {isAr ? "الوصف" : "Description"}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {isAr && session.description ? session.description : session.description}
          </p>
        </div>
      )}

      {session.notes && (
        <div className="rounded-xl border border-chart-4/20 bg-chart-4/5 p-4">
          <p className="text-[10px] font-bold text-chart-4 uppercase tracking-wider mb-2">
            {isAr ? "ملاحظات" : "Notes"}
          </p>
          <p className="text-sm">{session.notes}</p>
        </div>
      )}

      {/* Invoice & Billing */}
      <Separator />
      <ChefsTableInvoiceGenerator session={session} />

      {/* Public Report Link */}
      {(session as any).report_token && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {isAr ? "رابط التقرير العام" : "Public Report Link"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-background border border-border/30 rounded px-3 py-2 truncate font-mono">
              {`${window.location.origin}/evaluation-report/${(session as any).report_token}`}
            </code>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/evaluation-report/${(session as any).report_token}`);
                toast.success(isAr ? "تم نسخ الرابط" : "Link copied!");
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 shrink-0"
              onClick={() => window.open(`/evaluation-report/${(session as any).report_token}`, "_blank")}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" className="gap-1.5" onClick={() => onNavigate(session.id)}>
          <Eye className="h-3.5 w-3.5" />
          {isAr ? "فتح الجلسة" : "Open Session"}
        </Button>
      </div>
    </div>
  );
}
