import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package, ClipboardList, Truck, Lightbulb, Send, FileInput,
  BarChart3, CheckSquare, BookTemplate, ClipboardCheck, Activity,
} from "lucide-react";

type EmptyStateType =
  | "lists" | "items" | "vendors" | "suggestions" | "quotes"
  | "requests" | "performance" | "checklist" | "templates"
  | "readiness" | "activity" | "generic";

const EMPTY_STATE_CONFIG: Record<EmptyStateType, {
  icon: any;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  iconColor: string;
}> = {
  lists: { icon: ClipboardList, titleEn: "No Requirement Lists", titleAr: "لا توجد قوائم", descEn: "Create your first requirement list to start tracking items.", descAr: "أنشئ أول قائمة متطلبات لبدء التتبع.", iconColor: "text-primary" },
  items: { icon: Package, titleEn: "No Items Found", titleAr: "لا توجد عناصر", descEn: "Add items to your requirement lists or adjust your filters.", descAr: "أضف عناصر لقوائم المتطلبات أو عدّل الفلاتر.", iconColor: "text-chart-1" },
  vendors: { icon: Truck, titleEn: "No Vendors Assigned", titleAr: "لا يوجد موردين", descEn: "Assign vendors to items for fulfillment tracking.", descAr: "عيّن موردين للعناصر لتتبع التوريد.", iconColor: "text-chart-3" },
  suggestions: { icon: Lightbulb, titleEn: "No Suggestions Yet", titleAr: "لا اقتراحات بعد", descEn: "Suggestions from team members will appear here.", descAr: "ستظهر اقتراحات أعضاء الفريق هنا.", iconColor: "text-chart-4" },
  quotes: { icon: Send, titleEn: "No Quote Requests", titleAr: "لا توجد طلبات أسعار", descEn: "Send quote requests to sponsors or vendors.", descAr: "أرسل طلبات أسعار للرعاة أو الموردين.", iconColor: "text-chart-1" },
  requests: { icon: FileInput, titleEn: "No Item Requests", titleAr: "لا توجد طلبات", descEn: "Item requests from participants will show here.", descAr: "ستظهر طلبات العناصر من المشاركين هنا.", iconColor: "text-chart-3" },
  performance: { icon: BarChart3, titleEn: "No Performance Data", titleAr: "لا توجد بيانات أداء", descEn: "Vendor performance metrics will appear once orders are placed.", descAr: "ستظهر مقاييس أداء الموردين بعد بدء الطلبات.", iconColor: "text-chart-4" },
  checklist: { icon: CheckSquare, titleEn: "Checklist Empty", titleAr: "القائمة فارغة", descEn: "Items from requirement lists will appear here for verification.", descAr: "ستظهر العناصر من القوائم هنا للتحقق.", iconColor: "text-chart-5" },
  templates: { icon: BookTemplate, titleEn: "No Templates", titleAr: "لا توجد قوالب", descEn: "Create reusable templates for common dish requirements.", descAr: "أنشئ قوالب قابلة لإعادة الاستخدام للمتطلبات الشائعة.", iconColor: "text-primary" },
  readiness: { icon: ClipboardCheck, titleEn: "Readiness Check Unavailable", titleAr: "فحص الجاهزية غير متاح", descEn: "Add requirement lists first to see readiness status.", descAr: "أضف قوائم المتطلبات أولاً لرؤية حالة الجاهزية.", iconColor: "text-chart-5" },
  activity: { icon: Activity, titleEn: "No Activity Yet", titleAr: "لا يوجد نشاط بعد", descEn: "Activity logs will appear as changes are made.", descAr: "ستظهر سجلات النشاط عند إجراء التغييرات.", iconColor: "text-muted-foreground" },
  generic: { icon: Package, titleEn: "Nothing Here Yet", titleAr: "لا شيء هنا بعد", descEn: "Content will appear once data is available.", descAr: "سيظهر المحتوى عند توفر البيانات.", iconColor: "text-muted-foreground" },
};

interface Props {
  type: EmptyStateType;
  actionLabel?: string;
  actionLabelAr?: string;
  onAction?: () => void;
}

export const OrderEmptyState = memo(function OrderEmptyState({ type, actionLabel, actionLabelAr, onAction }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card className="border-dashed border-2 border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
          <Icon className={`h-8 w-8 ${config.iconColor} opacity-60`} />
        </div>
        <h3 className="text-sm font-semibold mb-1">
          {isAr ? config.titleAr : config.titleEn}
        </h3>
        <p className="text-xs text-muted-foreground max-w-[280px]">
          {isAr ? config.descAr : config.descEn}
        </p>
        {onAction && (
          <Button size="sm" variant="outline" className="mt-4" onClick={onAction}>
            {isAr ? (actionLabelAr || "ابدأ") : (actionLabel || "Get Started")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
