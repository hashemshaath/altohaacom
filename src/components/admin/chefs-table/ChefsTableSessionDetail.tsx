import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package, Calendar, MapPin, ChefHat, Users, Eye, EyeOff,
  Clock, CheckCircle2, XCircle, PlayCircle
} from "lucide-react";
import { format } from "date-fns";
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
          <div key={i} className="rounded-lg border border-border/30 bg-background p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <item.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</span>
            </div>
            <p className="text-sm font-bold truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {session.description && (
        <div className="rounded-lg border border-border/30 bg-background p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {isAr ? "الوصف" : "Description"}
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {isAr && session.description ? session.description : session.description}
          </p>
        </div>
      )}

      {session.notes && (
        <div className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
          <p className="text-[10px] font-bold text-chart-4 uppercase tracking-wider mb-2">
            {isAr ? "ملاحظات" : "Notes"}
          </p>
          <p className="text-sm">{session.notes}</p>
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
