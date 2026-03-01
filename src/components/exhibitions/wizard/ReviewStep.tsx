import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Calendar, MapPin, Globe, Building, Ticket, Tag, Star, Image } from "lucide-react";
import { format } from "date-fns";
import type { ExhibitionFormData } from "./types";

const typeLabels: Record<string, { en: string; ar: string; emoji: string }> = {
  exhibition: { en: "Exhibition", ar: "معرض", emoji: "🎨" },
  conference: { en: "Conference", ar: "مؤتمر", emoji: "🎤" },
  summit: { en: "Summit", ar: "قمة", emoji: "🏔️" },
  workshop: { en: "Workshop", ar: "ورشة عمل", emoji: "🛠️" },
  food_festival: { en: "Food Festival", ar: "مهرجان طعام", emoji: "🍽️" },
  trade_show: { en: "Trade Show", ar: "معرض تجاري", emoji: "📊" },
  competition_event: { en: "Competition Event", ar: "حدث تنافسي", emoji: "🏆" },
};

export function ExhibitionReviewStep({ data }: { data: ExhibitionFormData }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const typeLabel = typeLabels[data.type] || { en: data.type, ar: data.type, emoji: "📋" };

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value: string | undefined | null }) =>
    value ? (
      <div className="flex items-start justify-between gap-4 py-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="max-w-[60%] text-end text-sm font-medium">{value}</span>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Cover Preview */}
      {data.coverImageUrl && (
        <div className="overflow-hidden rounded-2xl border shadow-sm">
          <div className="relative">
            <img
              src={data.coverImageUrl}
              alt="Cover"
              className="aspect-[21/9] w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 start-4">
              <Badge variant="secondary" className="mb-2 backdrop-blur-sm">
                {typeLabel.emoji} {isAr ? typeLabel.ar : typeLabel.en}
              </Badge>
              <h2 className="text-xl font-bold text-foreground drop-shadow-sm">
                {data.title}
              </h2>
              {data.titleAr && (
                <p className="text-sm text-foreground/70">{data.titleAr}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-1/10">
              <CheckCircle className="h-4 w-4 text-chart-1" />
            </div>
            {isAr ? "مراجعة قبل الإنشاء" : "Review Before Creating"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Basic Info */}
          {!data.coverImageUrl && (
            <>
              <Section icon={Image} title={isAr ? "المعلومات الأساسية" : "Basic Info"}>
                <Row label={isAr ? "العنوان" : "Title"} value={data.title} />
                {data.titleAr && <Row label={isAr ? "العنوان (عربي)" : "Title (AR)"} value={data.titleAr} />}
                <Row label={isAr ? "النوع" : "Type"} value={`${typeLabel.emoji} ${isAr ? typeLabel.ar : typeLabel.en}`} />
              </Section>
              <Separator />
            </>
          )}

          {data.description && (
            <>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-sm leading-relaxed text-foreground/80">
                  {data.description.slice(0, 200)}
                  {data.description.length > 200 && "..."}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Dates */}
          <Section icon={Calendar} title={isAr ? "التواريخ والموقع" : "Dates & Location"}>
            {data.startDate && (
              <Row label={isAr ? "البدء" : "Start"} value={format(new Date(data.startDate), "PPp")} />
            )}
            {data.endDate && (
              <Row label={isAr ? "الانتهاء" : "End"} value={format(new Date(data.endDate), "PPp")} />
            )}
            {data.registrationDeadline && (
              <Row label={isAr ? "آخر تسجيل" : "Deadline"} value={format(new Date(data.registrationDeadline), "PPp")} />
            )}
            {data.isVirtual ? (
              <Row
                label={isAr ? "الموقع" : "Location"}
                value={`🌐 ${isAr ? "حدث افتراضي" : "Virtual Event"}`}
              />
            ) : (
              <Row
                label={isAr ? "الموقع" : "Location"}
                value={[data.venue, data.city, data.country].filter(Boolean).join(", ") || null}
              />
            )}
          </Section>

          <Separator />

          {/* Organizer */}
          <Section icon={Building} title={isAr ? "المنظم" : "Organizer"}>
            <Row label={isAr ? "الاسم" : "Name"} value={data.organizerName} />
            <Row label={isAr ? "البريد" : "Email"} value={data.organizerEmail} />
            <Row label={isAr ? "الهاتف" : "Phone"} value={data.organizerPhone} />
          </Section>

          <Separator />

          {/* Tickets */}
          <Section icon={Ticket} title={isAr ? "التذاكر" : "Tickets"}>
            <Row
              label={isAr ? "السعر" : "Price"}
              value={
                data.isFree
                  ? `✅ ${isAr ? "مجاني" : "Free"}`
                  : data.ticketPrice || (isAr ? "غير محدد" : "Not set")
              }
            />
            {data.maxAttendees && (
              <Row label={isAr ? "الحد الأقصى" : "Max Attendees"} value={data.maxAttendees} />
            )}
          </Section>

          {/* Tags */}
          {(data.tags || data.isFeatured) && (
            <>
              <Separator />
              <Section icon={Tag} title={isAr ? "الوسوم" : "Tags"}>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.isFeatured && (
                    <Badge className="bg-primary/10 text-primary">
                      <Star className="me-1 h-3 w-3" />
                      {isAr ? "مميز" : "Featured"}
                    </Badge>
                  )}
                  {data.tags &&
                    data.tags
                      .split(",")
                      .filter(Boolean)
                      .map((tag) => (
                        <Badge key={tag.trim()} variant="secondary" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                </div>
              </Section>
            </>
          )}

          {/* Draft Notice */}
          <div className="mt-2 rounded-xl bg-chart-1/5 p-4 text-center">
            <CheckCircle className="mx-auto mb-1.5 h-5 w-5 text-chart-1" />
            <p className="text-sm font-medium text-foreground/80">
              {isAr
                ? "سيتم حفظ الفعالية كمسودة. يمكنك تعديلها ونشرها لاحقاً."
                : "The event will be saved as a draft. You can edit and publish it later."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
