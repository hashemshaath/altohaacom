import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, MapPin, Globe, Clock, Map } from "lucide-react";
import type { ExhibitionFormData } from "./types";

interface Props {
  data: ExhibitionFormData;
  onChange: (updates: Partial<ExhibitionFormData>) => void;
}

export function ExhibitionDatesLocationStep({ data, onChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "التواريخ" : "Event Dates"}
          </CardTitle>
          <CardDescription>
            {isAr ? "حدد مواعيد البدء والانتهاء" : "Set the start and end dates for your event"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "تاريخ البدء" : "Start Date"} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={data.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "تاريخ الانتهاء" : "End Date"} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={data.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
                className="h-11"
              />
            </div>
          </div>

          {data.startDate && data.endDate && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isAr ? "المدة:" : "Duration:"}{" "}
                {(() => {
                  const days = Math.ceil(
                    (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return days > 0
                    ? `${days} ${isAr ? (days === 1 ? "يوم" : "أيام") : (days === 1 ? "day" : "days")}`
                    : isAr ? "تاريخ غير صالح" : "Invalid dates";
                })()}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isAr ? "آخر موعد للتسجيل" : "Registration Deadline"}
            </Label>
            <Input
              type="datetime-local"
              value={data.registrationDeadline}
              onChange={(e) => onChange({ registrationDeadline: e.target.value })}
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "الموقع" : "Location"}
          </CardTitle>
          <CardDescription>
            {isAr ? "حدد مكان إقامة الفعالية" : "Set where the event will take place"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              checked={data.isVirtual}
              onCheckedChange={(v) => onChange({ isVirtual: v })}
            />
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div>
                <Label className="text-sm font-medium">{isAr ? "حدث افتراضي" : "Virtual Event"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "الحدث سيقام عبر الإنترنت" : "Event will be hosted online"}
                </p>
              </div>
            </div>
          </div>

          {data.isVirtual ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "رابط الحدث الافتراضي" : "Virtual Event Link"}
              </Label>
              <Input
                value={data.virtualLink}
                onChange={(e) => onChange({ virtualLink: e.target.value })}
                placeholder="https://zoom.us/..."
                className="h-11"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isAr ? "المكان (إنجليزي)" : "Venue (English)"}
                  </Label>
                  <Input
                    value={data.venue}
                    onChange={(e) => onChange({ venue: e.target.value })}
                    placeholder={isAr ? "اسم المكان" : "e.g. Riyadh Convention Center"}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isAr ? "المكان (عربي)" : "Venue (Arabic)"}
                  </Label>
                  <Input
                    value={data.venueAr}
                    onChange={(e) => onChange({ venueAr: e.target.value })}
                    dir="rtl"
                    placeholder="اسم المكان بالعربي"
                    className="h-11"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isAr ? "المدينة" : "City"}
                  </Label>
                  <Input
                    value={data.city}
                    onChange={(e) => onChange({ city: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {isAr ? "الدولة" : "Country"}
                  </Label>
                  <Input
                    value={data.country}
                    onChange={(e) => onChange({ country: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Map className="h-3.5 w-3.5" />
                  {isAr ? "رابط الخريطة" : "Map URL"}
                </Label>
                <Input
                  value={data.mapUrl}
                  onChange={(e) => onChange({ mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="h-11"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
