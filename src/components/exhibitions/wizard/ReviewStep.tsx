import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, MapPin, Globe, Building, Ticket } from "lucide-react";
import { format } from "date-fns";
import type { ExhibitionFormData } from "./types";

const typeLabels: Record<string, { en: string; ar: string }> = {
  exhibition: { en: "Exhibition", ar: "معرض" },
  conference: { en: "Conference", ar: "مؤتمر" },
  summit: { en: "Summit", ar: "قمة" },
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  food_festival: { en: "Food Festival", ar: "مهرجان طعام" },
  trade_show: { en: "Trade Show", ar: "معرض تجاري" },
  competition_event: { en: "Competition Event", ar: "حدث تنافسي" },
};

export function ExhibitionReviewStep({ data }: { data: ExhibitionFormData }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const typeLabel = typeLabels[data.type] || { en: data.type, ar: data.type };

  const Row = ({ label, value }: { label: string; value: string | undefined | null }) =>
    value ? (
      <div className="flex items-start justify-between gap-4 py-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-end">{value}</span>
      </div>
    ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          {isAr ? "مراجعة قبل الإنشاء" : "Review Before Creating"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            {isAr ? "المعلومات الأساسية" : "Basic Info"}
          </h3>
          <Row label={isAr ? "العنوان" : "Title"} value={data.title} />
          {data.titleAr && <Row label={isAr ? "العنوان (عربي)" : "Title (AR)"} value={data.titleAr} />}
          <Row label={isAr ? "النوع" : "Type"} value={isAr ? typeLabel.ar : typeLabel.en} />
          {data.description && <Row label={isAr ? "الوصف" : "Description"} value={data.description.slice(0, 100) + (data.description.length > 100 ? "..." : "")} />}
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Calendar className="h-4 w-4" />
            {isAr ? "التواريخ والموقع" : "Dates & Location"}
          </h3>
          {data.startDate && <Row label={isAr ? "البدء" : "Start"} value={format(new Date(data.startDate), "PPp")} />}
          {data.endDate && <Row label={isAr ? "الانتهاء" : "End"} value={format(new Date(data.endDate), "PPp")} />}
          {data.isVirtual ? (
            <Row label={isAr ? "الموقع" : "Location"} value={isAr ? "حدث افتراضي" : "Virtual Event"} />
          ) : (
            <Row
              label={isAr ? "الموقع" : "Location"}
              value={[data.venue, data.city, data.country].filter(Boolean).join(", ") || null}
            />
          )}
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Building className="h-4 w-4" />
            {isAr ? "المنظم" : "Organizer"}
          </h3>
          <Row label={isAr ? "الاسم" : "Name"} value={data.organizerName} />
          <Row label={isAr ? "البريد" : "Email"} value={data.organizerEmail} />
        </div>

        <Separator />

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Ticket className="h-4 w-4" />
            {isAr ? "التذاكر" : "Tickets"}
          </h3>
          <Row
            label={isAr ? "السعر" : "Price"}
            value={data.isFree ? (isAr ? "مجاني" : "Free") : data.ticketPrice || (isAr ? "غير محدد" : "Not set")}
          />
          {data.maxAttendees && <Row label={isAr ? "الحد الأقصى" : "Max Attendees"} value={data.maxAttendees} />}
        </div>

        {(data.tags || data.targetAudience) && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {data.tags && data.tags.split(",").filter(Boolean).map((tag) => (
                <Badge key={tag.trim()} variant="secondary" className="text-xs">{tag.trim()}</Badge>
              ))}
            </div>
          </>
        )}

        <div className="rounded-lg bg-muted/50 p-3 text-center text-sm text-muted-foreground">
          {isAr
            ? "سيتم حفظ الفعالية كمسودة. يمكنك تعديلها لاحقاً من لوحة الإدارة."
            : "The event will be saved as a draft. You can edit it later from the admin panel."}
        </div>
      </CardContent>
    </Card>
  );
}
