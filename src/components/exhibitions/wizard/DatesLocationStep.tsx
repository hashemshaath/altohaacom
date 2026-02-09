import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Globe } from "lucide-react";
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isAr ? "التواريخ" : "Dates"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{isAr ? "تاريخ البدء" : "Start Date"} *</Label>
              <Input
                type="datetime-local"
                value={data.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>{isAr ? "تاريخ الانتهاء" : "End Date"} *</Label>
              <Input
                type="datetime-local"
                value={data.endDate}
                onChange={(e) => onChange({ endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>{isAr ? "آخر موعد للتسجيل" : "Registration Deadline"}</Label>
            <Input
              type="datetime-local"
              value={data.registrationDeadline}
              onChange={(e) => onChange({ registrationDeadline: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {isAr ? "الموقع" : "Location"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={data.isVirtual}
              onCheckedChange={(v) => onChange({ isVirtual: v })}
            />
            <Label className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              {isAr ? "حدث افتراضي" : "Virtual Event"}
            </Label>
          </div>

          {data.isVirtual ? (
            <div>
              <Label>{isAr ? "رابط الحدث الافتراضي" : "Virtual Event Link"}</Label>
              <Input
                value={data.virtualLink}
                onChange={(e) => onChange({ virtualLink: e.target.value })}
                placeholder="https://zoom.us/..."
              />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{isAr ? "المكان (إنجليزي)" : "Venue (EN)"}</Label>
                  <Input
                    value={data.venue}
                    onChange={(e) => onChange({ venue: e.target.value })}
                    placeholder={isAr ? "اسم المكان" : "Venue name"}
                  />
                </div>
                <div>
                  <Label>{isAr ? "المكان (عربي)" : "Venue (AR)"}</Label>
                  <Input
                    value={data.venueAr}
                    onChange={(e) => onChange({ venueAr: e.target.value })}
                    dir="rtl"
                    placeholder="اسم المكان بالعربي"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{isAr ? "المدينة" : "City"}</Label>
                  <Input
                    value={data.city}
                    onChange={(e) => onChange({ city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{isAr ? "الدولة" : "Country"}</Label>
                  <Input
                    value={data.country}
                    onChange={(e) => onChange({ country: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{isAr ? "رابط الخريطة" : "Map URL"}</Label>
                <Input
                  value={data.mapUrl}
                  onChange={(e) => onChange({ mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
